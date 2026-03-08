-- Backfill uploadedAt timestamp for existing attachments
-- For attachments without uploadedAt, use the application's submittedAt timestamp
UPDATE applications a
SET attachments = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'uploadedAt' IS NOT NULL THEN item
      ELSE item || jsonb_build_object('uploadedAt', a."submittedAt")
    END
  )
  FROM jsonb_array_elements(a.attachments) AS item
)
WHERE a.attachments IS NOT NULL 
AND a.attachments::text != '[]';



