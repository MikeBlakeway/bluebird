-- Ensure enum for Take.status to prevent invalid values
CREATE TYPE "TakeStatus" AS ENUM ('pending', 'planned', 'processing', 'completed', 'failed');

ALTER TABLE "Take"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "TakeStatus" USING (
    CASE
      WHEN "status" IN ('pending', 'planned', 'processing', 'completed', 'failed')
        THEN "status"::"TakeStatus"
      ELSE 'pending'::"TakeStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- Drop redundant indexes created by the initial migration
DROP INDEX IF EXISTS "User_email_idx";
DROP INDEX IF EXISTS "MagicLink_token_idx";
DROP INDEX IF EXISTS "MagicLink_userId_idx";
DROP INDEX IF EXISTS "Take_jobId_idx";

-- Add composite index to speed up job authorization checks
CREATE INDEX "Take_jobId_projectId_idx" ON "Take"("jobId", "projectId");
