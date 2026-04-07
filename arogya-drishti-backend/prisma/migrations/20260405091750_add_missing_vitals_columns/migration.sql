-- CreateEnum
CREATE TYPE "AllergyReactionType" AS ENUM ('anaphylaxis', 'urticaria', 'angioedema', 'rash', 'gi_distress', 'respiratory', 'unknown');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');

-- CreateEnum
CREATE TYPE "AllergyStatus" AS ENUM ('active', 'resolved', 'unconfirmed');

-- AlterTable
ALTER TABLE "vitals_log" ADD COLUMN     "pain_scale" SMALLINT,
ADD COLUMN     "respiratory_rate" SMALLINT;

-- CreateTable
CREATE TABLE "allergies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "allergen" VARCHAR(255) NOT NULL,
    "reaction_type" "AllergyReactionType" NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "status" "AllergyStatus" NOT NULL DEFAULT 'active',
    "confirmed_by" UUID,
    "confirmed_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allergies_individual_id_idx" ON "allergies"("individual_id");

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
