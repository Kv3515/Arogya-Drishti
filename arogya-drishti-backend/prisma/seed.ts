import { PrismaClient, UserRole, Sex, BloodGroup, VisitType, Severity, MedicationRoute, InjuryType, InjuryCause, RecoveryStatus, DutyStatus, FitnessStatus, HearingStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env so DATABASE_URL is available
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Prisma 7 requires a driver adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Arogya Drishti database...');

  // ─── Idempotency guard ────────────────────────────────────────────────────
  const existingUnits = await prisma.unit.count();
  if (existingUnits > 0) {
    console.log('⏭️  Database already has data — skipping seed.');
    console.log('   (Delete all rows or reset the DB to re-seed)');
    return;
  }

  // ─── Units (Military Hierarchy) ────────────────────────────────────────────
  const brigade = await prisma.unit.create({
    data: { unit_name: '42nd Infantry Brigade' },
  });

  const battalion1 = await prisma.unit.create({
    data: { unit_name: '1st Battalion', parent_unit_id: brigade.id },
  });

  const battalion2 = await prisma.unit.create({
    data: { unit_name: '2nd Battalion', parent_unit_id: brigade.id },
  });

  const alphaCompany = await prisma.unit.create({
    data: { unit_name: 'Alpha Company', parent_unit_id: battalion1.id },
  });

  const bravoCompany = await prisma.unit.create({
    data: { unit_name: 'Bravo Company', parent_unit_id: battalion1.id },
  });

  const charlieCompany = await prisma.unit.create({
    data: { unit_name: 'Charlie Company', parent_unit_id: battalion2.id },
  });

  console.log('  ✓ Units created (6)');

  // ─── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@12345678', 12);

  await prisma.user.create({
    data: {
      username: 'admin',
      password_hash: passwordHash,
      role: UserRole.super_admin,
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      username: 'dr.sharma',
      password_hash: passwordHash,
      role: UserRole.medical_officer,
      unit_id: battalion1.id,
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      username: 'dr.patel',
      password_hash: passwordHash,
      role: UserRole.medical_officer,
      unit_id: battalion2.id,
    },
  });

  await prisma.user.create({
    data: {
      username: 'medic.kumar',
      password_hash: passwordHash,
      role: UserRole.paramedic,
      unit_id: alphaCompany.id,
    },
  });

  await prisma.user.create({
    data: {
      username: 'col.singh',
      password_hash: passwordHash,
      role: UserRole.commander,
      unit_id: battalion1.id,
    },
  });

  await prisma.user.create({
    data: {
      username: 'col.verma',
      password_hash: passwordHash,
      role: UserRole.commander,
      unit_id: battalion2.id,
    },
  });

  console.log('  ✓ Users created (6)');

  // ─── Individuals ──────────────────────────────────────────────────────────
  const bloodGroups: BloodGroup[] = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
  const sexOptions: Sex[] = ['male', 'female'];
  const units = [alphaCompany.id, bravoCompany.id, charlieCompany.id];

  const firstNames = ['Arun', 'Vikram', 'Rajesh', 'Suresh', 'Amit', 'Deepak', 'Manoj', 'Ravi', 'Sanjay', 'Priya',
    'Kavita', 'Ankita', 'Rahul', 'Nitin', 'Gaurav', 'Sahil', 'Rohit', 'Vivek', 'Ashok', 'Mohan',
    'Naveen', 'Sunil', 'Pankaj', 'Ajay', 'Vinod', 'Meera', 'Neha', 'Pooja', 'Divya', 'Swati'];
  const lastNames = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Verma', 'Gupta', 'Yadav', 'Reddy', 'Nair', 'Joshi',
    'Mishra', 'Chauhan', 'Thakur', 'Rao', 'Pandey', 'Mehta', 'Das', 'Dutta', 'Sen', 'Bose'];

  const individuals = [];
  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const yearOffset = 20 + Math.floor(Math.random() * 20);
    const dob = new Date(2026 - yearOffset, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));

    const individual = await prisma.individual.create({
      data: {
        service_number: `SVC-${String(i + 1).padStart(5, '0')}`,
        name: `${firstName} ${lastName}`,
        date_of_birth: dob,
        sex: sexOptions[i % 2],
        blood_group: bloodGroups[i % bloodGroups.length],
        unit_id: units[i % units.length],
        contact_info: { phone: `+91-${9000000000 + i}`, email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mil.in` },
      },
    });
    individuals.push(individual);
  }

  // Create individual user accounts for first 5
  for (let i = 0; i < 5; i++) {
    await prisma.user.create({
      data: {
        username: `ind.${individuals[i].service_number.toLowerCase()}`,
        password_hash: passwordHash,
        role: UserRole.individual,
        linked_individual_id: individuals[i].id,
        unit_id: individuals[i].unit_id,
      },
    });
  }

  console.log('  ✓ Individuals created (100)');

  // ─── Medical History ──────────────────────────────────────────────────────
  const visitTypes: VisitType[] = ['OPD', 'emergency', 'annual', 'field'];
  const severities: Severity[] = ['mild', 'moderate', 'severe', 'critical'];
  const icdCodes = [
    { code: 'I10',   text: 'Essential hypertension' },
    { code: 'E11.9', text: 'Type 2 diabetes without complications' },
    { code: 'J06.9', text: 'Acute upper respiratory infection' },
    { code: 'M54.5', text: 'Low back pain' },
    { code: 'K29.7', text: 'Gastritis, unspecified' },
    { code: 'J45.9', text: 'Asthma, unspecified' },
    { code: 'H10.1', text: 'Acute atopic conjunctivitis' },
    { code: 'S93.4', text: 'Sprain of ankle' },
    { code: 'R51',   text: 'Headache' },
    { code: 'L30.9', text: 'Dermatitis, unspecified' },
  ];
  const doctors = [doctor1.id, doctor2.id];

  const medicalHistories = [];
  for (let i = 0; i < 200; i++) {
    const individual = individuals[i % 100];
    const icd = icdCodes[i % icdCodes.length];
    const monthsAgo = Math.floor(Math.random() * 24);
    const visitDate = new Date();
    visitDate.setMonth(visitDate.getMonth() - monthsAgo);

    const record = await prisma.medicalHistory.create({
      data: {
        individual_id: individual.id,
        visit_date: visitDate,
        visit_type: visitTypes[i % visitTypes.length],
        chief_complaint: `Patient presents with ${icd.text.toLowerCase()}`,
        symptoms: [{ code: icd.code, description: icd.text }],
        diagnosis_code: icd.code,
        diagnosis_text: icd.text,
        severity: severities[i % severities.length],
        is_sensitive: i % 20 === 0,
        doctor_id: doctors[i % doctors.length],
      },
    });
    medicalHistories.push(record);
  }

  console.log('  ✓ Medical history entries created (200)');

  // ─── Prescriptions ────────────────────────────────────────────────────────
  const medications = [
    { name: 'Amlodipine',    dosage: '5mg',   freq: 'Once daily',           route: 'oral' as MedicationRoute, days: 30 },
    { name: 'Metformin',     dosage: '500mg', freq: 'Twice daily',           route: 'oral' as MedicationRoute, days: 90 },
    { name: 'Paracetamol',   dosage: '500mg', freq: 'As needed',             route: 'oral' as MedicationRoute, days: 7  },
    { name: 'Omeprazole',    dosage: '20mg',  freq: 'Before breakfast',      route: 'oral' as MedicationRoute, days: 14 },
    { name: 'Cetirizine',    dosage: '10mg',  freq: 'Once daily at night',   route: 'oral' as MedicationRoute, days: 10 },
    { name: 'Diclofenac Gel',dosage: '1%',   freq: 'Apply twice daily',     route: 'topical' as MedicationRoute, days: 14 },
  ];

  for (let i = 0; i < 150; i++) {
    const history = medicalHistories[i % medicalHistories.length];
    const med = medications[i % medications.length];
    await prisma.prescription.create({
      data: {
        medical_history_id: history.id,
        individual_id: history.individual_id,
        medication_name: med.name,
        dosage: med.dosage,
        frequency: med.freq,
        duration_days: med.days,
        route: med.route,
        is_active: i % 5 !== 0,
      },
    });
  }

  console.log('  ✓ Prescriptions created (150)');

  // ─── Vitals ───────────────────────────────────────────────────────────────
  for (let i = 0; i < 300; i++) {
    const individual = individuals[i % 100];
    const daysAgo = Math.floor(Math.random() * 365);
    const recordedAt = new Date();
    recordedAt.setDate(recordedAt.getDate() - daysAgo);

    await prisma.vitalsLog.create({
      data: {
        individual_id: individual.id,
        recorded_at: recordedAt,
        blood_pressure_systolic:  110 + Math.floor(Math.random() * 40),
        blood_pressure_diastolic: 65  + Math.floor(Math.random() * 25),
        heart_rate:               60  + Math.floor(Math.random() * 40),
        temperature_celsius:      36.0 + Math.random() * 2,
        oxygen_saturation:        95  + Math.floor(Math.random() * 5),
        weight_kg:                60  + Math.random() * 30,
        height_cm:                160 + Math.random() * 25,
        recorded_by: doctors[i % doctors.length],
      },
    });
  }

  console.log('  ✓ Vitals entries created (300)');

  // ─── Injuries ─────────────────────────────────────────────────────────────
  const injuryTypes: InjuryType[] = ['fracture', 'laceration', 'burn', 'contusion', 'sprain'];
  const causes: InjuryCause[]     = ['combat', 'training', 'accident', 'sports'];
  const recoveryStatuses: RecoveryStatus[] = ['active', 'recovering', 'recovered'];
  const dutyStatuses: DutyStatus[]         = ['full_duty', 'light_duty', 'non_duty'];
  const bodyParts = ['left ankle', 'right wrist', 'lower back', 'left knee', 'right shoulder', 'left hand', 'chest'];

  for (let i = 0; i < 80; i++) {
    const individual = individuals[i % 100];
    const monthsAgo = Math.floor(Math.random() * 12);
    const injuryDate = new Date();
    injuryDate.setMonth(injuryDate.getMonth() - monthsAgo);

    await prisma.injuryLog.create({
      data: {
        individual_id:   individual.id,
        injury_date:     injuryDate,
        injury_type:     injuryTypes[i % injuryTypes.length],
        body_part:       bodyParts[i % bodyParts.length],
        cause:           causes[i % causes.length],
        recovery_status: recoveryStatuses[i % recoveryStatuses.length],
        duty_status:     dutyStatuses[i % dutyStatuses.length],
        recorded_by:     doctors[i % doctors.length],
      },
    });
  }

  console.log('  ✓ Injury records created (80)');

  // ─── Annual Medical Exams ─────────────────────────────────────────────────
  const fitnessStatuses: FitnessStatus[] = ['fit', 'fit', 'fit', 'temporarily_unfit', 'permanently_unfit'];

  for (let i = 0; i < 100; i++) {
    const individual = individuals[i];
    const examDate = new Date();
    examDate.setMonth(examDate.getMonth() - Math.floor(Math.random() * 6));
    const validUntil = new Date(examDate);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const weightKg = 60 + Math.random() * 30;
    const heightM  = (160 + Math.random() * 25) / 100;
    const bmi      = weightKg / (heightM * heightM);

    await prisma.annualMedicalExam.create({
      data: {
        individual_id:        individual.id,
        exam_date:            examDate,
        fitness_status:       fitnessStatuses[i % fitnessStatuses.length],
        fitness_valid_until:  validUntil,
        bmi:                  Math.round(bmi * 10) / 10,
        vision_left:          '6/6',
        vision_right:         i % 10 === 0 ? '6/9' : '6/6',
        hearing_status:       i % 15 === 0 ? HearingStatus.impaired : HearingStatus.normal,
        lab_results: {
          hemoglobin:           (12 + Math.random() * 4).toFixed(1),
          blood_sugar_fasting:  Math.floor(80  + Math.random() * 40),
          cholesterol_total:    Math.floor(150 + Math.random() * 80),
        },
        examining_officer_id: doctors[i % doctors.length],
      },
    });
  }

  console.log('  ✓ Annual exams created (100)');

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Login credentials (password: Admin@12345678):');
  console.log('   admin        → Super Admin');
  console.log('   dr.sharma    → Medical Officer (1st Battalion)');
  console.log('   dr.patel     → Medical Officer (2nd Battalion)');
  console.log('   medic.kumar  → Paramedic (Alpha Company)');
  console.log('   col.singh    → Commander (1st Battalion)');
  console.log('   col.verma    → Commander (2nd Battalion)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error('   Message:', e?.message ?? String(e));
    if (e?.code)    console.error('   Code:   ', e.code);
    if (e?.meta)    console.error('   Meta:   ', JSON.stringify(e.meta));
    if (e?.cause)   console.error('   Cause:  ', e.cause?.message ?? e.cause);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
