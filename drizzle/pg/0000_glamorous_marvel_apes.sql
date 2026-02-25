CREATE TYPE "activity_action" AS ENUM('submitted', 'approved', 'on_hold', 'resubmission_requested', 'viewed');
--> statement-breakpoint
CREATE TYPE "application_status" AS ENUM('pending', 'approved', 'for_resubmission', 'on_hold');
--> statement-breakpoint
CREATE TYPE "delivery_status" AS ENUM('pending', 'sent', 'failed', 'bounced');
--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('submitted', 'approved', 'on_hold', 'resubmission_requested');
--> statement-breakpoint
CREATE TYPE "role" AS ENUM('user', 'admin', 'staff');
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicationId" integer NOT NULL,
	"staffId" integer NOT NULL,
	"staffName" varchar(255) NOT NULL,
	"staffEmail" varchar(320) NOT NULL,
	"action" "activity_action" NOT NULL,
	"remarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"referenceNumber" varchar(32) NOT NULL,
	"applicantName" varchar(255) NOT NULL,
	"applicantEmail" varchar(320) NOT NULL,
	"applicantPhone" varchar(20) NOT NULL,
	"applicantCapacity" varchar(100) NOT NULL,
	"barangay" varchar(100) NOT NULL,
	"propertyLocation" text NOT NULL,
	"propertyAddress" text NOT NULL,
	"projectType" varchar(100) NOT NULL,
	"projectScope" text NOT NULL,
	"estimatedCost" numeric(12, 2),
	"attachments" jsonb,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"staffRemarks" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applications_referenceNumber_unique" UNIQUE("referenceNumber")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"applicationId" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"type" "notification_type" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"sentAt" timestamp,
	"deliveryStatus" "delivery_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
