import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getApplicationsFIFO,
  getApplicationsByStatus,
  searchApplications,
  getApplicationById,
  getApplicationByRefNumber,
  getApplicationByEmail,
  createApplication,
  updateApplicationStatus,
  createActivityLog,
  getActivityLogsByApplicationId,
} from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

// Helper to generate reference number
function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `PERMIT-${year}-${randomNum}`;
}

// Helper to calculate processing days
function getProcessingDays(submittedAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - submittedAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Helper to get status indicator color
function getStatusIndicator(submittedAt: Date): "green" | "yellow" | "red" {
  const days = getProcessingDays(submittedAt);
  if (days <= 1) return "green";
  if (days === 2) return "yellow";
  return "red";
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getSupabaseStorageConfig() {
  const supabaseUrl = ENV.supabaseUrl;
  const supabaseAnonKey = ENV.supabaseAnonKey;
  const supabaseServiceRoleKey = ENV.supabaseServiceRoleKey;
  const bucket = ENV.supabaseStorageBucket || "permit-attachments";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Supabase storage is not configured.",
    });
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    supabaseAnonKey,
    supabaseServiceRoleKey,
    bucket,
  };
}

async function uploadToSupabaseStorage(input: {
  documentKey: string;
  fileName: string;
  mimeType: string;
  fileBase64: string;
}) {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, bucket } = getSupabaseStorageConfig();
  const authKey = supabaseServiceRoleKey || supabaseAnonKey;

  const now = Date.now();
  const safeName = sanitizeFileName(input.fileName);
  const storagePath = `applications/${input.documentKey}/${now}-${safeName}`;
  const objectPath = `${bucket}/${storagePath}`;
  const encodedObjectPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodedObjectPath}`;
  const fileBytes = Buffer.from(input.fileBase64, "base64");

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: authKey,
      Authorization: `Bearer ${authKey}`,
      "Content-Type": input.mimeType,
      "x-upsert": "true",
    },
    body: fileBytes,
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text().catch(() => uploadResponse.statusText);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `File upload failed: ${message}`,
    });
  }

  return {
    path: storagePath,
    url: `${supabaseUrl}/storage/v1/object/public/${encodedObjectPath}`,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Applications ============
  applications: router({
    uploadAttachment: protectedProcedure
      .input(
        z.object({
          documentKey: z.string().min(1),
          fileName: z.string().min(1),
          mimeType: z.enum(["application/pdf", "image/jpeg", "image/jpg"]),
          fileBase64: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return uploadToSupabaseStorage(input);
      }),

    // Get all applications in FIFO order
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        const apps = await getApplicationsFIFO(input.limit, input.offset);
        return apps.map((app) => ({
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        }));
      }),

    // Get applications by status
    byStatus: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "for_resubmission", "on_hold"]),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        const apps = await getApplicationsByStatus(
          input.status,
          input.limit,
          input.offset
        );
        return apps.map((app) => ({
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        }));
      }),

    // Search applications
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        const apps = await searchApplications(
          input.query,
          input.limit,
          input.offset
        );
        return apps.map((app) => ({
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        }));
      }),

    // Get single application
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        };
      }),

    // Get current user's application
    getMyApplication: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.email) throw new TRPCError({ code: "UNAUTHORIZED" });
        const app = await getApplicationByEmail(ctx.user.email);
        if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "No application found" });
        return {
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        };
      }),

    // Create new application
    create: protectedProcedure
      .input(
        z.object({
          applicantName: z.string().min(1),
          applicantEmail: z.string().email(),
          applicantPhone: z.string().min(1),
          applicantCapacity: z.string().min(1),
          barangay: z.string().min(1),
          propertyLocation: z.string().min(1),
          propertyAddress: z.string().min(1),
          projectType: z.string().min(1),
          projectScope: z.string().min(1),
          buildingClassification: z.string().min(1),
          attachments: z.array(z.object({
            name: z.string(),
            url: z.string(),
            type: z.string(),
          })).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user's email matches the applicant email
        if (ctx.user?.email !== input.applicantEmail) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only submit applications with your registered email address",
          });
        }

        // Check if user has already submitted an application
        const existingApp = await getApplicationByEmail(input.applicantEmail);
        if (existingApp) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already submitted an application. Only one application per email is allowed.",
          });
        }

        const referenceNumber = generateReferenceNumber();
        await createApplication({
          referenceNumber,
          ...input,
          attachments: input.attachments || [],
          status: "pending",
        });

        // Get the created application to get its ID
        const app = await getApplicationByRefNumber(referenceNumber);
        if (!app) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return {
          success: true,
          referenceNumber,
          applicationId: app.id,
        };
      }),

    // Update application status (staff only)
    updateStatus: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          status: z.enum(["pending", "approved", "for_resubmission", "on_hold"]),
          remarks: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "staff" && ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        await updateApplicationStatus(
          input.applicationId,
          input.status,
          input.remarks
        );

        // Log activity
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user.name || "Unknown",
          staffEmail: ctx.user.email || "unknown@example.com",
          action: input.status === "approved" ? "approved" : input.status === "for_resubmission" ? "resubmission_requested" : "on_hold",
          remarks: input.remarks,
        });

        return { success: true };
      }),
  }),

  // ============ Activity Logs ============
  activityLogs: router({
    getByApplicationId: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .query(async ({ input }) => {
        return getActivityLogsByApplicationId(input.applicationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
