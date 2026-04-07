-- Migration: Replace FitnessStatus enum with SHAPE medical category system
-- AO 9/2011 DGMS: medical categories 1A, 1B, 2, 3, 4, 5
-- SHAPE factors: S (Psychological), H (Hearing), A (Appendages), P (Physical), E (Eye Sight)
-- COPE coding: C (Climate/Terrain), O (Observation), P (Physical limitations), E (Exclusive limitations)

-- Step 1: Add new medical_category column (nullable first for migration)
ALTER TABLE "annual_medical_exam"
  ADD COLUMN "medical_category"  VARCHAR(5),
  ADD COLUMN "shape_s"           SMALLINT,
  ADD COLUMN "shape_h"           SMALLINT,
  ADD COLUMN "shape_a"           SMALLINT,
  ADD COLUMN "shape_p"           SMALLINT,
  ADD COLUMN "shape_e"           SMALLINT,
  ADD COLUMN "cope_c"            SMALLINT,
  ADD COLUMN "cope_o"            SMALLINT,
  ADD COLUMN "cope_p"            SMALLINT,
  ADD COLUMN "cope_e"            SMALLINT;

-- Step 2: Migrate existing fitness_status values to medical_category
UPDATE "annual_medical_exam"
SET "medical_category" = CASE
  WHEN "fitness_status" = 'temporarily_unfit'  THEN '4'
  WHEN "fitness_status" = 'permanently_unfit'  THEN '5'
  ELSE '1A'
END;

-- Step 3: Set default for rows without fitness_status (shouldn't happen, but safety)
UPDATE "annual_medical_exam" SET "medical_category" = '1A' WHERE "medical_category" IS NULL;

-- Step 4: Make medical_category NOT NULL with default
ALTER TABLE "annual_medical_exam"
  ALTER COLUMN "medical_category" SET NOT NULL,
  ALTER COLUMN "medical_category" SET DEFAULT '1A';

-- Step 5: Drop old fitness_status column
ALTER TABLE "annual_medical_exam" DROP COLUMN "fitness_status";

-- Step 6: Drop FitnessStatus enum (now unreferenced)
DROP TYPE IF EXISTS "FitnessStatus";
