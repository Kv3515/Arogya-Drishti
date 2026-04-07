import prisma from '../config/database';

interface VitalsData {
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  heart_rate?: number | null;
  temperature_celsius?: number | string | null | { toNumber?: () => number; toString?: () => string };
  oxygen_saturation?: number | null;
  respiratory_rate?: number | null;
}

interface ThresholdResult {
  isCritical: boolean;
  isWarning: boolean;
  details: string[];
}

function evaluateThresholds(v: VitalsData): ThresholdResult {
  const details: string[] = [];
  let isCritical = false;
  let isWarning = false;

  const sys = v.blood_pressure_systolic;
  const dia = v.blood_pressure_diastolic;
  const hr = v.heart_rate;
  const spo2 = v.oxygen_saturation;
  const rr = v.respiratory_rate;
  const temp = v.temperature_celsius != null ? Number(v.temperature_celsius) : null;

  // Critical thresholds
  if (sys != null && sys >= 180) { isCritical = true; details.push(`Hypertensive crisis: BP ${sys}/${dia ?? '?'} mmHg`); }
  if (dia != null && dia >= 120)  { isCritical = true; details.push(`Critical diastolic: BP ${sys ?? '?'}/${dia} mmHg`); }
  if (spo2 != null && spo2 < 90)  { isCritical = true; details.push(`Critical SpO₂: ${spo2}%`); }
  if (rr != null && rr >= 30)     { isCritical = true; details.push(`Severe tachypnea: RR ${rr}/min`); }
  if (rr != null && rr < 8)       { isCritical = true; details.push(`Hypoventilation: RR ${rr}/min`); }
  if (hr != null && hr >= 150)    { isCritical = true; details.push(`Severe tachycardia: HR ${hr} bpm`); }
  if (hr != null && hr < 40)      { isCritical = true; details.push(`Severe bradycardia: HR ${hr} bpm`); }
  if (temp != null && temp >= 40) { isCritical = true; details.push(`High fever: ${temp.toFixed(1)}°C`); }
  if (temp != null && temp < 35)  { isCritical = true; details.push(`Hypothermia: ${temp.toFixed(1)}°C`); }

  // Warning thresholds (only if not already critical for same metric)
  if (!isCritical) {
    if (sys != null && sys >= 140)             { isWarning = true; details.push(`High BP: ${sys}/${dia ?? '?'} mmHg`); }
    if (dia != null && dia >= 90)              { isWarning = true; details.push(`High diastolic: ${dia} mmHg`); }
    if (spo2 != null && spo2 < 95)            { isWarning = true; details.push(`Low SpO₂: ${spo2}%`); }
    if (rr != null && rr > 20)                { isWarning = true; details.push(`Tachypnea: RR ${rr}/min`); }
    if (hr != null && (hr > 100 || hr < 60))  { isWarning = true; details.push(`Abnormal HR: ${hr} bpm`); }
    if (temp != null && temp >= 38.5)          { isWarning = true; details.push(`Fever: ${temp.toFixed(1)}°C`); }
    if (temp != null && temp >= 37.5 && temp < 38.5) { isWarning = true; details.push(`Low-grade fever: ${temp.toFixed(1)}°C`); }
  }

  return { isCritical, isWarning, details };
}

/**
 * Evaluates a newly recorded vitals entry against thresholds.
 * Creates Notification rows for all medical officers / paramedics in the individual's unit.
 */
export async function createVitalsNotifications(
  individualId: string,
  unitId: string,
  individualName: string,
  serviceNumber: string,
  vitals: VitalsData,
): Promise<void> {
  const { isCritical, isWarning, details } = evaluateThresholds(vitals);
  if (!isCritical && !isWarning) return;

  const notifType = isCritical ? 'vitals_critical' : 'vitals_warning';
  const title = isCritical
    ? `CRITICAL vitals — ${individualName} (${serviceNumber})`
    : `Vitals alert — ${individualName} (${serviceNumber})`;
  const message = details.join(' · ');

  // Find all medical officers and paramedics in the same unit
  const recipients = await prisma.user.findMany({
    where: {
      role: { in: ['medical_officer', 'paramedic'] },
      unit_id: unitId,
      is_active: true,
    },
    select: { id: true },
  });

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipient_id: r.id,
      individual_id: individualId,
      type: notifType,
      title,
      message,
    })),
  });
}
