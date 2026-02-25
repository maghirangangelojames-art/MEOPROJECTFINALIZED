ALTER TABLE `applications` MODIFY COLUMN `attachments` json;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `sent` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `sent` tinyint NOT NULL DEFAULT 0;