CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`staffId` int NOT NULL,
	`staffName` varchar(255) NOT NULL,
	`staffEmail` varchar(320) NOT NULL,
	`action` enum('submitted','approved','on_hold','resubmission_requested','viewed') NOT NULL,
	`remarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceNumber` varchar(32) NOT NULL,
	`applicantName` varchar(255) NOT NULL,
	`applicantEmail` varchar(320) NOT NULL,
	`applicantPhone` varchar(20) NOT NULL,
	`applicantCapacity` varchar(100) NOT NULL,
	`barangay` varchar(100) NOT NULL,
	`propertyLocation` text NOT NULL,
	`propertyAddress` text NOT NULL,
	`projectType` varchar(100) NOT NULL,
	`projectScope` text NOT NULL,
	`buildingClassification` varchar(255) NOT NULL DEFAULT 'GROUP A - Residential (Dwelling)',
	`attachments` json DEFAULT ('[]'),
	`status` enum('pending','approved','for_resubmission','on_hold') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`staffRemarks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `applications_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`type` enum('submitted','approved','on_hold','resubmission_requested') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`sent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`deliveryStatus` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';