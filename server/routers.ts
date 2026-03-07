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
  getDb,
  deleteApplication,
} from "./db";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { eq } from "drizzle-orm";
import { applications } from "../drizzle/schema";
import { 
  sendApplicationApprovedNotification, 
  sendApplicationResubmissionNotification,
  sendApplicationSubmissionNotificationToStaff,
  sendApplicationResubmissionNotificationToStaff,
} from "./_core/email";

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

// Helper to calculate approval days (days from submission to approval)
function getApprovalDays(submittedAt: Date, status: string, processedAt: Date | null): number | null {
  if (status !== "approved" || !processedAt) {
    return null;
  }
  const diffMs = processedAt.getTime() - submittedAt.getTime();
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
      
      // Prevent any caching of this response
      ctx.res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      ctx.res.setHeader('Pragma', 'no-cache');
      ctx.res.setHeader('Expires', '0');
      
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
        try {
          return await uploadToSupabaseStorage(input);
        } catch (error) {
          console.error("[Server] Upload attachment error:", error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to upload attachment",
          });
        }
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
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        }));
      }),

    // Get applications by status
    byStatus: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "for_resubmission", "on_hold", "pending_resubmit"]),
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
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
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
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
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
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
          statusIndicator: getStatusIndicator(app.submittedAt),
        };
      }),

    // Get application by reference number (public endpoint for confirmation page)
    getByRefNumber: publicProcedure
      .input(z.object({ refNumber: z.string().min(1) }))
      .query(async ({ input }) => {
        const app = await getApplicationByRefNumber(input.refNumber);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          ...app,
          processingDays: getProcessingDays(app.submittedAt),
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
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
          approvalDays: getApprovalDays(app.submittedAt, app.status, app.processedAt),
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
          ownerName: z.string().optional(),
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
            documentKey: z.string().optional(),
            label: z.string().optional(),
          })).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
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
          if (!app) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve created application" });

          // Send notification to staff about new submission
          await sendApplicationSubmissionNotificationToStaff({
            applicantName: input.applicantName,
            applicantEmail: input.applicantEmail,
            applicantPhone: input.applicantPhone,
            referenceNumber: referenceNumber,
            propertyAddress: input.propertyAddress,
            projectType: input.projectType,
            buildingClassification: input.buildingClassification,
            barangay: input.barangay,
          }).catch(err => {
            console.error("Failed to send submission notification to staff:", err);
            // Don't throw - allow the application creation to succeed even if email fails
          });

          return {
            success: true,
            referenceNumber,
            applicationId: app.id,
          };
        } catch (error) {
          console.error("[Server] Create application error:", error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to create application",
          });
        }
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

        // If approving an application that was marked for resubmission,
        // verify all files that required resubmission have been resubmitted
        if (input.status === "approved" && 
            (app.status === "for_resubmission" || app.status === "pending_resubmit")) {
          const attachments = (app.attachments as any[]) || [];
          const filesWithRemarks = attachments.filter((att: any) => att.remarks);
          
          if (filesWithRemarks.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Cannot approve application. ${filesWithRemarks.length} file(s) still require resubmission. All files must be resubmitted before approval.`,
            });
          }
        }

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

        // Send email notification to applicant based on status
        if (input.status === "approved") {
          // Send approval notification
          await sendApplicationApprovedNotification({
            applicantEmail: app.applicantEmail,
            applicantName: app.applicantName,
            referenceNumber: app.referenceNumber,
          }).catch(err => {
            console.error("Failed to send approval email:", err);
            // Don't throw - allow the status update to succeed even if email fails
          });
        } else if (input.status === "for_resubmission") {
          // Send resubmission request notification
          await sendApplicationResubmissionNotification({
            applicantEmail: app.applicantEmail,
            applicantName: app.applicantName,
            referenceNumber: app.referenceNumber,
            staffRemarks: input.remarks,
          }).catch(err => {
            console.error("Failed to send resubmission email:", err);
            // Don't throw - allow the status update to succeed even if email fails
          });
        }

        // Return success with notification type for client-side notification
        return { 
          success: true,
          notificationType: input.status === "approved" ? "approved" : input.status === "for_resubmission" ? "resubmission_requested" : "on_hold",
          referenceNumber: app.referenceNumber,
        };
      }),

    // Update file lock status (staff only)
    updateFileLockStatus: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          fileIndex: z.number(),
          isLocked: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "staff" && ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        const attachments = (app.attachments as any[]) || [];
        if (input.fileIndex < 0 || input.fileIndex >= attachments.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file index" });
        }

        // Update the specific file's lock status
        attachments[input.fileIndex].isLocked = input.isLocked;

        // Update the application with the modified attachments
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db
          .update(applications)
          .set({ attachments, updatedAt: new Date() })
          .where(eq(applications.id, input.applicationId));

        // Log activity
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user.name || "Unknown",
          staffEmail: ctx.user.email || "unknown@example.com",
          action: "viewed",
          remarks: `File ${input.fileIndex + 1} ${input.isLocked ? "locked" : "unlocked"}`,
        });

        return { success: true };
      }),

    // Update file remarks (staff only)
    updateFileRemarks: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          fileIndex: z.number(),
          remarks: z.string().max(500),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "staff" && ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        const attachments = (app.attachments as any[]) || [];
        if (input.fileIndex < 0 || input.fileIndex >= attachments.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file index" });
        }

        // Update the specific file's remarks
        attachments[input.fileIndex].remarks = input.remarks;

        // Update the application with the modified attachments
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db
          .update(applications)
          .set({ attachments, updatedAt: new Date() })
          .where(eq(applications.id, input.applicationId));

        return { success: true };
      }),

    // Delete file remarks (staff only)
    deleteFileRemarks: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          fileIndex: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "staff" && ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        const attachments = (app.attachments as any[]) || [];
        if (input.fileIndex < 0 || input.fileIndex >= attachments.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file index" });
        }

        // Delete the file's remarks by setting it to empty string
        attachments[input.fileIndex].remarks = "";

        // Update the application with the modified attachments
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db
          .update(applications)
          .set({ attachments, updatedAt: new Date() })
          .where(eq(applications.id, input.applicationId));

        // Log activity
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user.name || "Unknown",
          staffEmail: ctx.user.email || "unknown@example.com",
          action: "viewed",
          remarks: `Remarks deleted from file ${input.fileIndex + 1}`,
        });

        return { success: true };
      }),

    // Resubmit application with updated files
    resubmitApplication: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          updatedAttachments: z.array(
            z.object({
              fileIndex: z.number(),
              name: z.string(),
              url: z.string(),
              type: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        // Verify the application belongs to the user
        if (app.applicantEmail !== ctx.user?.email) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Verify application is in resubmission status (either "for_resubmission" or "pending_resubmit")
        if (app.status !== "for_resubmission" && app.status !== "pending_resubmit") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application is not in resubmission status",
          });
        }

        const currentAttachments = (app.attachments as any[]) || [];

        // Update the specified file attachments
        input.updatedAttachments.forEach((update) => {
          if (
            update.fileIndex >= 0 &&
            update.fileIndex < currentAttachments.length
          ) {
            // Preserve locked status but CLEAR remarks when file is resubmitted
            // This indicates the file has been successfully resubmitted
            const existingAttachment = currentAttachments[update.fileIndex];
            currentAttachments[update.fileIndex] = {
              ...existingAttachment,
              name: update.name,
              url: update.url,
              type: update.type,
              remarks: "", // Clear remarks to mark file as resubmitted
            };
          }
        });

        // Update application status to pending_resubmit
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();
        await db
          .update(applications)
          .set({
            attachments: currentAttachments,
            status: "pending_resubmit",
            updatedAt: now,
          })
          .where(eq(applications.id, input.applicationId));

        // Log activity
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user?.name || "Unknown",
          staffEmail: ctx.user?.email || "unknown@example.com",
          action: "submitted",
          remarks: `Applicant submitted revised files for ${input.updatedAttachments.length} document(s)`,
        });

        // Send notification to staff about resubmission
        await sendApplicationResubmissionNotificationToStaff({
          applicantName: app.applicantName,
          applicantEmail: app.applicantEmail,
          referenceNumber: app.referenceNumber,
          filesResubmitted: input.updatedAttachments.length,
          barangay: app.barangay,
          projectType: app.projectType,
        }).catch(err => {
          console.error("Failed to send resubmission notification to staff:", err);
          // Don't throw - allow the resubmission to succeed even if email fails
        });

        return { success: true };
      }),

    // Update application information during resubmission
    updateApplicationInfoDuringResubmission: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          applicantName: z.string().min(1).optional(),
          applicantEmail: z.string().email().optional(),
          applicantPhone: z.string().optional(),
          applicantCapacity: z.string().optional(),
          ownerName: z.string().optional(),
          barangay: z.string().optional(),
          propertyLocation: z.string().optional(),
          propertyAddress: z.string().optional(),
          projectType: z.string().optional(),
          projectScope: z.string().optional(),
          buildingClassification: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND" });

        // Verify the application belongs to the user
        if (app.applicantEmail !== ctx.user?.email) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Verify application is in resubmission status (either "for_resubmission" or "pending_resubmit")
        if (app.status !== "for_resubmission" && app.status !== "pending_resubmit") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application is not in resubmission status",
          });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updateData: any = {
          updatedAt: new Date(),
          status: "pending_resubmit",
        };

        // Only update fields that were provided
        if (input.applicantName !== undefined) updateData.applicantName = input.applicantName;
        if (input.applicantEmail !== undefined) updateData.applicantEmail = input.applicantEmail;
        if (input.applicantPhone !== undefined) updateData.applicantPhone = input.applicantPhone;
        if (input.applicantCapacity !== undefined) updateData.applicantCapacity = input.applicantCapacity;
        if (input.ownerName !== undefined) updateData.ownerName = input.ownerName;
        if (input.barangay !== undefined) updateData.barangay = input.barangay;
        if (input.propertyLocation !== undefined) updateData.propertyLocation = input.propertyLocation;
        if (input.propertyAddress !== undefined) updateData.propertyAddress = input.propertyAddress;
        if (input.projectType !== undefined) updateData.projectType = input.projectType;
        if (input.projectScope !== undefined) updateData.projectScope = input.projectScope;
        if (input.buildingClassification !== undefined) updateData.buildingClassification = input.buildingClassification;

        await db
          .update(applications)
          .set(updateData)
          .where(eq(applications.id, input.applicationId));

        // Log activity
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user?.name || "Unknown",
          staffEmail: ctx.user?.email || "unknown@example.com",
          action: "submitted",
          remarks: "Applicant updated application information during resubmission",
        });

        // Send notification to staff about application information updates
        await sendApplicationResubmissionNotificationToStaff({
          applicantName: app.applicantName,
          applicantEmail: app.applicantEmail,
          referenceNumber: app.referenceNumber,
          filesResubmitted: 0, // No files updated, just information
          barangay: input.barangay || app.barangay,
          projectType: input.projectType || app.projectType,
        }).catch(err => {
          console.error("Failed to send information update notification to staff:", err);
          // Don't throw - allow the update to succeed even if email fails
        });

        return { success: true };
      }),

    // Delete application (staff only)
    delete: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "staff" && ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only staff can delete applications" });
        }

        const app = await getApplicationById(input.applicationId);
        if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

        // Log the deletion activity before deleting
        await createActivityLog({
          applicationId: input.applicationId,
          staffId: ctx.user.id,
          staffName: ctx.user.name || "Unknown",
          staffEmail: ctx.user.email || "unknown@example.com",
          action: "viewed",
          remarks: `Application deleted by staff member ${ctx.user.name}`,
        });

        // Delete the application
        await deleteApplication(input.applicationId);

        return { 
          success: true, 
          message: "Application deleted successfully",
          referenceNumber: app.referenceNumber,
          applicantEmail: app.applicantEmail,
        };
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
