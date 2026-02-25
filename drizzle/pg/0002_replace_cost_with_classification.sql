-- Drop estimatedCost column and add buildingClassification column
ALTER TABLE "applications" DROP COLUMN IF EXISTS "estimatedCost";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "buildingClassification" varchar(255) NOT NULL DEFAULT 'GROUP A - Residential (Dwelling)';
