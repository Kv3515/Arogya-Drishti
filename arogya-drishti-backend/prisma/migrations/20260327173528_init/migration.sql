-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'medical_officer', 'paramedic', 'commander', 'individual');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('OPD', 'emergency', 'annual', 'field', 'telemedicine');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('mild', 'moderate', 'severe', 'critical');

-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('oral', 'IV', 'IM', 'topical', 'inhaled', 'other');

-- CreateEnum
CREATE TYPE "InjuryType" AS ENUM ('fracture', 'laceration', 'burn', 'contusion', 'sprain', 'blast', 'other');

-- CreateEnum
CREATE TYPE "InjuryCause" AS ENUM ('combat', 'training', 'accident', 'sports', 'other');

-- CreateEnum
CREATE TYPE "RecoveryStatus" AS ENUM ('active', 'recovering', 'recovered', 'chronic');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('full_duty', 'light_duty', 'non_duty', 'hospitalized');

-- CreateEnum
CREATE TYPE "FitnessStatus" AS ENUM ('fit', 'temporarily_unfit', 'permanently_unfit');

-- CreateEnum
CREATE TYPE "HearingStatus" AS ENUM ('normal', 'impaired', 'deaf');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export');

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unit_name" VARCHAR(255) NOT NULL,
    "parent_unit_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individuals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "sex" "Sex" NOT NULL,
    "blood_group" "BloodGroup" NOT NULL,
    "unit_id" UUID NOT NULL,
    "contact_info" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "linked_individual_id" UUID,
    "unit_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "visit_type" "VisitType" NOT NULL,
    "chief_complaint" TEXT,
    "symptoms" JSONB NOT NULL,
    "diagnosis_code" VARCHAR(20) NOT NULL,
    "diagnosis_text" VARCHAR(500) NOT NULL,
    "severity" "Severity" NOT NULL,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "doctor_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medical_history_id" UUID NOT NULL,
    "individual_id" UUID NOT NULL,
    "medication_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "route" "MedicationRoute" NOT NULL,
    "instructions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "blood_pressure_systolic" SMALLINT,
    "blood_pressure_diastolic" SMALLINT,
    "heart_rate" SMALLINT,
    "temperature_celsius" DECIMAL(4,1),
    "oxygen_saturation" SMALLINT,
    "weight_kg" DECIMAL(5,2),
    "height_cm" DECIMAL(5,1),
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injury_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "injury_date" DATE NOT NULL,
    "injury_type" "InjuryType" NOT NULL,
    "body_part" VARCHAR(100) NOT NULL,
    "cause" "InjuryCause" NOT NULL,
    "recovery_status" "RecoveryStatus" NOT NULL,
    "duty_status" "DutyStatus" NOT NULL,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "injury_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_medical_exam" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "individual_id" UUID NOT NULL,
    "exam_date" DATE NOT NULL,
    "fitness_status" "FitnessStatus" NOT NULL,
    "fitness_valid_until" DATE NOT NULL,
    "bmi" DECIMAL(4,1),
    "vision_left" VARCHAR(20),
    "vision_right" VARCHAR(20),
    "hearing_status" "HearingStatus" NOT NULL,
    "lab_results" JSONB,
    "remarks" TEXT,
    "examining_officer_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_medical_exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" VARCHAR(255),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "individuals_service_number_key" ON "individuals"("service_number");

-- CreateIndex
CREATE INDEX "individuals_service_number_idx" ON "individuals"("service_number");

-- CreateIndex
CREATE INDEX "individuals_unit_id_idx" ON "individuals"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "medical_history_individual_id_visit_date_idx" ON "medical_history"("individual_id", "visit_date");

-- CreateIndex
CREATE INDEX "vitals_log_individual_id_recorded_at_idx" ON "vitals_log"("individual_id", "recorded_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_parent_unit_id_fkey" FOREIGN KEY ("parent_unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuals" ADD CONSTRAINT "individuals_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_linked_individual_id_fkey" FOREIGN KEY ("linked_individual_id") REFERENCES "individuals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medical_history_id_fkey" FOREIGN KEY ("medical_history_id") REFERENCES "medical_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals_log" ADD CONSTRAINT "vitals_log_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals_log" ADD CONSTRAINT "vitals_log_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_log" ADD CONSTRAINT "injury_log_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injury_log" ADD CONSTRAINT "injury_log_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_medical_exam" ADD CONSTRAINT "annual_medical_exam_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "individuals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_medical_exam" ADD CONSTRAINT "annual_medical_exam_examining_officer_id_fkey" FOREIGN KEY ("examining_officer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
