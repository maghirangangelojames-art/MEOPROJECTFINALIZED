-- Backfill uploadedAt timestamp for existing attachments
-- For attachments without uploadedAt, use the application's submittedAt timestamp
UPDATE applications
SET attachments = (
  SELECT jsonb_agg(
    CASE 
      WHEN (att->>'uploadedAt') IS NULL
      THEN att || jsonb_build_object('uploadedAt', "submittedAt"::text)
      ELSE att
    END
  )
  FROM jsonb_array_elements(attachments) as att
)
WHERE attachments IS NOT NULL AND attachments != '[]'::jsonb;
