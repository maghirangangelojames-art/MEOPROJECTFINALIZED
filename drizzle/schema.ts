import { 
  integer,
  pgEnum,
  pgTable,
  serial,
  text, 
  timestamp, 
  varchar,
  numeric,
  jsonb,
  boolean
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin", "staff"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "for_resubmission", "on_hold"]);
export const activityActionEnum = pgEnum("activity_action", ["submitted", "approved", "on_hold", "resubmission_requested", "viewed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["submitted", "approved", "on_hold", "resubmission_requested"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "sent", "failed", "bounced"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Building permit applications table.
 * Stores all permit application data with FIFO ordering by submission timestamp.
 */
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 32 }).notNull().unique(),
  
  // Applicant Information
  applicantName: varchar("applicantName", { length: 255 }).notNull(),
  applicantEmail: varchar("applicantEmail", { length: 320 }).notNull(),
  applicantPhone: varchar("applicantPhone", { length: 20 }).notNull(),
  applicantCapacity: varchar("applicantCapacity", { length: 100 }).notNull(), // Owner, Contractor, Architect, etc.
  ownerName: varchar("ownerName", { length: 255 }), // Only for Authorized Representatives
  barangay: varchar("barangay", { length: 100 }).notNull(),
  
  // Property Information
  propertyLocation: text("propertyLocation").notNull(),
  propertyAddress: text("propertyAddress").notNull(),
  projectType: varchar("projectType", { length: 100 }).notNull(), // Residential, Commercial, etc.
  
  // Project Details
  projectScope: text("projectScope").notNull(),
  buildingClassification: varchar("buildingClassification", { length: 255 }).notNull(),
  
  // File uploads (stored as JSON with URLs)
  attachments: jsonb("attachments"),
  
  // Status and Timestamps
  status: applicationStatusEnum("status").default("pending").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  
  // Staff notes and remarks
  staffRemarks: text("staffRemarks"),
  
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Activity log table for tracking all staff actions.
 * Provides audit trail for compliance and transparency.
 */
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  staffId: integer("staffId").notNull(),
  staffName: varchar("staffName", { length: 255 }).notNull(),
  staffEmail: varchar("staffEmail", { length: 320 }).notNull(),
  
  // Action details
  action: activityActionEnum("action").notNull(),
  remarks: text("remarks"),
  
  // Timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Notifications table for tracking email notifications sent.
 * Helps with delivery tracking and resend capabilities.
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  
  // Notification details
  type: notificationTypeEnum("type").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  
  // Delivery tracking
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  deliveryStatus: deliveryStatusEnum("deliveryStatus").default("pending").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
