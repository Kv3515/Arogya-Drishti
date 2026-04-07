/**
 * Health Calculations Utilities
 * Provides medical calculation functions for the Arogya Drishti health dashboard
 */

import type { Individual, VitalsLog, AnnualMedicalExam, InjuryLog, MedicalHistory } from '@/lib/api';

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Number(((celsius * 9) / 5 + 32).toFixed(1));
}

export interface HealthAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  category: 'bmi' | 'vitals' | 'fitness' | 'injury' | 'general';
}

export interface HealthMetrics {
  age: number;
  currentWeight?: number | null;
  currentHeight?: number | null;
  bmi?: number;
  overallStatus: 'operational' | 'warning' | 'critical';
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight (kg) / height (m)²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    throw new Error('Invalid weight or height values');
  }
  
  const heightM = heightCm / 100;
  return Number((weightKg / Math.pow(heightM, 2)).toFixed(1));
}

/**
 * Get BMI category based on WHO classification
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Get BMI status color for UI display
 */
export function getBMIStatusColor(bmi: number): 'success' | 'warning' | 'danger' {
  if (bmi < 18.5 || bmi >= 30) return 'danger';
  if (bmi >= 25) return 'warning';
  return 'success';
}

/**
 * Calculate comprehensive health metrics
 */
export function calculateHealthMetrics(
  individual: Individual,
  latestVitals?: VitalsLog,
  latestExam?: AnnualMedicalExam
): HealthMetrics {
  const age = calculateAge(individual.dateOfBirth);
  
  // Use latest vitals or individual record for current metrics
  const currentWeight = latestVitals?.weightKg ?? individual.weightKg;
  const currentHeight = latestVitals?.heightCm ?? individual.heightCm;
  
  let bmi: number | undefined;
  if (currentWeight && currentHeight) {
    try {
      bmi = calculateBMI(currentWeight, currentHeight);
    } catch (error) {
      console.warn('BMI calculation failed:', error);
    }
  }

  return {
    age,
    currentWeight,
    currentHeight,
    bmi,
    overallStatus: 'operational', // Will be determined by generateHealthAlerts
  };
}

/**
 * Generate health alerts based on individual's health data
 */
export function generateHealthAlerts(
  individual: Individual,
  latestVitals?: VitalsLog,
  latestExam?: AnnualMedicalExam,
  activeInjuries: InjuryLog[] = []
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const metrics = calculateHealthMetrics(individual, latestVitals, latestExam);

  // BMI alerts
  if (metrics.bmi) {
    if (metrics.bmi >= 30) {
      alerts.push({
        type: 'critical',
        message: `BMI ${metrics.bmi} indicates obesity (≥30)`,
        category: 'bmi',
      });
    } else if (metrics.bmi >= 25) {
      alerts.push({
        type: 'warning',
        message: `BMI ${metrics.bmi} indicates overweight (25-29.9)`,
        category: 'bmi',
      });
    } else if (metrics.bmi < 18.5) {
      alerts.push({
        type: 'warning',
        message: `BMI ${metrics.bmi} indicates underweight (<18.5)`,
        category: 'bmi',
      });
    }
  }

  // Blood pressure alerts (if latest vitals available)
  if (latestVitals) {
    const { systolicBp: sys, diastolicBp: dia } = latestVitals;
    
    if (sys && dia && (sys >= 140 || dia >= 90)) {
      alerts.push({
        type: 'critical',
        message: `Elevated blood pressure: ${sys}/${dia} mmHg (≥140/90)`,
        category: 'vitals',
      });
    } else if (sys && dia && (sys >= 120 || dia >= 80)) {
      alerts.push({
        type: 'warning',
        message: `Pre-hypertension: ${sys}/${dia} mmHg (120-139/80-89)`,
        category: 'vitals',
      });
    }

    // Oxygen saturation alerts
    if (latestVitals.spo2Percent && latestVitals.spo2Percent < 95) {
      alerts.push({
        type: 'critical',
        message: `Low oxygen saturation: ${latestVitals.spo2Percent}% (<95%)`,
        category: 'vitals',
      });
    } else if (latestVitals.spo2Percent && latestVitals.spo2Percent < 98) {
      alerts.push({
        type: 'warning',
        message: `Borderline oxygen saturation: ${latestVitals.spo2Percent}% (<98%)`,
        category: 'vitals',
      });
    }

    // Heart rate alerts (normal range: 60-100 bpm)
    if (latestVitals.heartRateBpm && latestVitals.heartRateBpm > 100) {
      alerts.push({
        type: 'warning',
        message: `Elevated heart rate: ${latestVitals.heartRateBpm} bpm (>100)`,
        category: 'vitals',
      });
    } else if (latestVitals.heartRateBpm && latestVitals.heartRateBpm < 60) {
      alerts.push({
        type: 'warning',
        message: `Low heart rate: ${latestVitals.heartRateBpm} bpm (<60)`,
        category: 'vitals',
      });
    }

    // Respiratory rate alerts (normal: 12–20 /min)
    if (latestVitals.respiratoryRate != null) {
      const rr = latestVitals.respiratoryRate;
      if (rr >= 30) {
        alerts.push({
          type: 'critical',
          message: `Respiratory distress: RR ${rr}/min (≥30 — severe tachypnea)`,
          category: 'vitals',
        });
      } else if (rr > 20) {
        alerts.push({
          type: 'warning',
          message: `Tachypnea: RR ${rr}/min (>20)`,
          category: 'vitals',
        });
      } else if (rr < 8) {
        alerts.push({
          type: 'critical',
          message: `Hypoventilation: RR ${rr}/min (<8 — dangerously low)`,
          category: 'vitals',
        });
      }
    }
  }

  // Medical category alerts (SHAPE system: 4=temp unfit, 5=perm unfit, 3=restricted)
  if (individual.medicalCategory === '4' || individual.fitnessStatus === 'temporarily_unfit') {
    alerts.push({
      type: 'warning',
      message: 'Category 4 — Temporarily unfit for duty',
      category: 'fitness',
    });
  } else if (individual.medicalCategory === '5' || individual.fitnessStatus === 'permanently_unfit') {
    alerts.push({
      type: 'critical',
      message: 'Category 5 — Permanently unfit for military duties',
      category: 'fitness',
    });
  } else if (individual.medicalCategory === '3') {
    alerts.push({
      type: 'warning',
      message: 'Category 3 — Fit for sedentary / routine duties only',
      category: 'fitness',
    });
  }

  // Active injuries alerts
  if (activeInjuries.length > 0) {
    const criticalInjuries = activeInjuries.filter(injury => 
      injury.recoveryStatus === 'active'
    );
    
    if (criticalInjuries.length > 0) {
      alerts.push({
        type: 'critical',
        message: `${criticalInjuries.length} active ${criticalInjuries.length === 1 ? 'injury' : 'injuries'} requiring attention`,
        category: 'injury',
      });
    } else {
      alerts.push({
        type: 'warning',
        message: `${activeInjuries.length} active ${activeInjuries.length === 1 ? 'injury' : 'injuries'}`,
        category: 'injury',
      });
    }
  }

  // Fitness validity alerts (if exam data available)
  if (latestExam?.fitnessValidUntil) {
    const validUntil = new Date(latestExam.fitnessValidUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      alerts.push({
        type: 'critical',
        message: 'Fitness certificate expired',
        category: 'fitness',
      });
    } else if (daysUntilExpiry <= 30) {
      alerts.push({
        type: 'warning',
        message: `Fitness certificate expires in ${daysUntilExpiry} days`,
        category: 'fitness',
      });
    }
  }

  return alerts;
}

/**
 * Determine overall health status based on alerts
 */
export function determineOverallHealthStatus(alerts: HealthAlert[]): 'operational' | 'warning' | 'critical' {
  const criticalAlerts = alerts.filter(alert => alert.type === 'critical').length;
  const warningAlerts = alerts.filter(alert => alert.type === 'warning').length;

  if (criticalAlerts > 0) return 'critical';
  if (warningAlerts > 0) return 'warning';
  return 'operational';
}

/**
 * Get status badge display text
 */
export function getStatusDisplayText(status: 'operational' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical': return 'Needs Attention';
    case 'warning': return 'Monitor';
    case 'operational': return 'Healthy';
    default: return 'Unknown';
  }
}

/**
 * Calculate active conditions count
 */
export function calculateActiveConditionsCount(
  activeInjuries: InjuryLog[],
  healthAlerts: HealthAlert[]
): number {
  // Count active injuries + critical/warning health alerts
  const alertConditions = healthAlerts.filter(alert => 
    alert.type === 'critical' || alert.type === 'warning'
  ).length;
  
  return activeInjuries.length + alertConditions;
}

/**
 * Health calculation constants
 */
export const HEALTH_CONSTANTS = {
  BMI: {
    UNDERWEIGHT: 18.5,
    NORMAL: 25,
    OVERWEIGHT: 30,
  },
  BLOOD_PRESSURE: {
    NORMAL_SYSTOLIC: 120,
    HIGH_SYSTOLIC: 140,
    NORMAL_DIASTOLIC: 80,
    HIGH_DIASTOLIC: 90,
  },
  HEART_RATE: {
    MIN_NORMAL: 60,
    MAX_NORMAL: 100,
  },
  OXYGEN_SATURATION: {
    CRITICAL_THRESHOLD: 95,
    WARNING_THRESHOLD: 98,
  },
  FITNESS_EXPIRY_WARNING_DAYS: 30,
  TEMPERATURE: {
    MIN_NORMAL: 97.0, // °F
    MAX_NORMAL: 99.5,
    FEVER_THRESHOLD: 100.4,
  },
} as const;

// ========================
// VITALS MONITORING SPECIFIC UTILITIES
// ========================

export type VitalMetric = 'systolic' | 'diastolic' | 'heartRate' | 'spo2' | 'temperature';
export type DateRangeFilter = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface VitalThreshold {
  normal: { min: number; max: number };
  warning: { min?: number; max?: number };
  critical: { min?: number; max?: number };
  unit: string;
}

export interface ProcessedVitalData {
  date: string;
  formattedDate: string;
  timestamp: Date;
  'BP Systolic': number | null;
  'BP Diastolic': number | null;
  'Heart Rate': number | null;
  'SpO₂': number | null;
  'Temperature': number | null;
}

/**
 * Get threshold ranges for vital signs
 */
export function getVitalThresholds(metric: VitalMetric): VitalThreshold {
  switch (metric) {
    case 'systolic':
      return {
        normal: { min: 90, max: 120 },
        warning: { min: 80, max: 140 },
        critical: { min: 70, max: 180 },
        unit: 'mmHg'
      };
    case 'diastolic':
      return {
        normal: { min: 60, max: 80 },
        warning: { min: 50, max: 90 },
        critical: { min: 40, max: 120 },
        unit: 'mmHg'
      };
    case 'heartRate':
      return {
        normal: { min: 60, max: 100 },
        warning: { min: 50, max: 120 },
        critical: { min: 40, max: 150 },
        unit: 'bpm'
      };
    case 'spo2':
      return {
        normal: { min: 95, max: 100 },
        warning: { min: 90, max: 94 },
        critical: { min: 0, max: 89 },
        unit: '%'
      };
    case 'temperature':
      return {
        normal: { min: 97.0, max: 99.5 },
        warning: { min: 96.0, max: 100.3 },
        critical: { min: 0, max: 95.9 }, // Hypothermia < 95°F, Hyperthermia > 104°F  
        unit: '°F'
      };
    default:
      throw new Error(`Unknown vital metric: ${metric}`);
  }
}

/**
 * Convert date range filter to actual date range
 */
export function getDateRangeFromFilter(filter: DateRangeFilter, customRange?: DateRange): DateRange {
  const end = new Date();
  let start: Date;

  switch (filter) {
    case '7d':
      start = new Date(end.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      start = new Date(end.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    case 'custom':
      if (!customRange) {
        throw new Error('Custom range required for custom date filter');
      }
      return customRange;
    default:
      throw new Error(`Unknown date range filter: ${filter}`);
  }

  return { start, end };
}

/**
 * Check if date is within specified range
 */
export function isInDateRange(date: string | Date, range: DateRange): boolean {
  const checkDate = new Date(date);
  return checkDate >= range.start && checkDate <= range.end;
}

/**
 * Process vitals data for chart display
 */
export function processVitalsForChart(
  vitals: VitalsLog[], 
  dateRange: DateRange
): ProcessedVitalData[] {
  return vitals
    .filter(vital => isInDateRange(vital.recordedAt, dateRange))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(vital => ({
      date: new Date(vital.recordedAt).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short' 
      }),
      formattedDate: new Date(vital.recordedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: new Date(vital.recordedAt),
      'BP Systolic': vital.systolicBp || null,
      'BP Diastolic': vital.diastolicBp || null,  
      'Heart Rate': vital.heartRateBpm || null,
      'SpO₂': vital.spo2Percent || null,
      'Temperature': vital.tempCelsius ? (vital.tempCelsius * 9/5) + 32 : null // Convert to Fahrenheit
    }));
}

/**
 * Generate vital-specific health alerts for monitoring section
 */
export function generateVitalAlerts(vitalsData: VitalsLog[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  
  if (vitalsData.length === 0) {
    return [{
      type: 'info',
      message: 'No recent vitals data available',
      category: 'vitals'
    }];
  }

  // Get latest vitals for current status
  const latest = vitalsData[vitalsData.length - 1];
  
  // Check each vital against thresholds
  if (latest.systolicBp || latest.diastolicBp) {
    const sys = latest.systolicBp || 0;
    const dia = latest.diastolicBp || 0;
    
    if (sys >= 180 || dia >= 120) {
      alerts.push({
        type: 'critical',
        message: `Severe hypertension: ${sys}/${dia} mmHg - Immediate attention required`,
        category: 'vitals'
      });
    } else if (sys >= 140 || dia >= 90) {
      alerts.push({
        type: 'warning',
        message: `Elevated blood pressure: ${sys}/${dia} mmHg`,
        category: 'vitals'
      });
    }
  }

  // Heart rate alerts
  if (latest.heartRateBpm) {
    if (latest.heartRateBpm > 120) {
      alerts.push({
        type: 'critical',
        message: `Severe tachycardia: ${latest.heartRateBpm} bpm`,
        category: 'vitals'
      });
    } else if (latest.heartRateBpm > 100) {
      alerts.push({
        type: 'warning',
        message: `Tachycardia: ${latest.heartRateBpm} bpm`,
        category: 'vitals'
      });
    } else if (latest.heartRateBpm < 50) {
      alerts.push({
        type: 'critical',
        message: `Severe bradycardia: ${latest.heartRateBpm} bpm`,
        category: 'vitals'
      });
    } else if (latest.heartRateBpm < 60) {
      alerts.push({
        type: 'warning',
        message: `Bradycardia: ${latest.heartRateBpm} bpm`,
        category: 'vitals'
      });
    }
  }

  // Oxygen saturation alerts
  if (latest.spo2Percent) {
    if (latest.spo2Percent < 90) {
      alerts.push({
        type: 'critical',
        message: `Critical hypoxemia: ${latest.spo2Percent}% SpO₂`,
        category: 'vitals'
      });
    } else if (latest.spo2Percent < 95) {
      alerts.push({
        type: 'warning',
        message: `Low oxygen saturation: ${latest.spo2Percent}% SpO₂`,
        category: 'vitals'
      });
    }
  }

  // Temperature alerts (convert to Fahrenheit for display)
  if (latest.tempCelsius) {
    const tempF = (latest.tempCelsius * 9/5) + 32;
    if (tempF >= 104) {
      alerts.push({
        type: 'critical',
        message: `High fever: ${tempF.toFixed(1)}°F - Hyperthermia risk`,
        category: 'vitals'
      });
    } else if (tempF >= 100.4) {
      alerts.push({
        type: 'warning',
        message: `Fever: ${tempF.toFixed(1)}°F`,
        category: 'vitals'
      });
    } else if (tempF <= 95) {
      alerts.push({
        type: 'critical',
        message: `Hypothermia: ${tempF.toFixed(1)}°F`,
        category: 'vitals'
      });
    }
  }

  return alerts;
}

/**
 * Calculate vital sign trends (improving, worsening, stable)
 */
export function calculateVitalTrends(vitalsData: VitalsLog[]): Record<VitalMetric, 'improving' | 'worsening' | 'stable'> {
  if (vitalsData.length < 2) {
    return {
      systolic: 'stable',
      diastolic: 'stable',  
      heartRate: 'stable',
      spo2: 'stable',
      temperature: 'stable'
    };
  }

  // Compare last 3 readings if available
  const recent = vitalsData.slice(-3);
  const trends: Record<VitalMetric, 'improving' | 'worsening' | 'stable'> = {
    systolic: 'stable',
    diastolic: 'stable',
    heartRate: 'stable', 
    spo2: 'stable',
    temperature: 'stable'
  };

  // Basic trend analysis - compare first and last of recent readings
  const first = recent[0];
  const last = recent[recent.length - 1];

  // Blood pressure trends (lower is better)
  if (first.systolicBp && last.systolicBp) {
    const change = last.systolicBp - first.systolicBp;
    trends.systolic = change < -5 ? 'improving' : change > 5 ? 'worsening' : 'stable';
  }

  if (first.diastolicBp && last.diastolicBp) {
    const change = last.diastolicBp - first.diastolicBp;
    trends.diastolic = change < -3 ? 'improving' : change > 3 ? 'worsening' : 'stable';
  }

  // Heart rate trends (closer to 60-80 is better)
  if (first.heartRateBpm && last.heartRateBpm) {
    const firstDistance = Math.abs(first.heartRateBpm - 70); // Optimal ~70 bpm
    const lastDistance = Math.abs(last.heartRateBpm - 70);
    trends.heartRate = lastDistance < firstDistance ? 'improving' : 
                      lastDistance > firstDistance ? 'worsening' : 'stable';
  }

  // SpO2 trends (higher is better)
  if (first.spo2Percent && last.spo2Percent) {
    const change = last.spo2Percent - first.spo2Percent;
    trends.spo2 = change > 1 ? 'improving' : change < -1 ? 'worsening' : 'stable';
  }

  // Temperature trends (closer to normal is better)
  if (first.tempCelsius && last.tempCelsius) {
    const normalTemp = 37.0; // °C
    const firstDistance = Math.abs(first.tempCelsius - normalTemp);
    const lastDistance = Math.abs(last.tempCelsius - normalTemp);
    trends.temperature = lastDistance < firstDistance ? 'improving' :
                        lastDistance > firstDistance ? 'worsening' : 'stable';
  }

  return trends;
}

// ========================
// WEIGHT TRACKING SPECIFIC UTILITIES  
// ========================

export type WeightDisplayMode = 'weight' | 'bmi' | 'both';
export type WeightTimeframe = '3m' | '6m' | '1y' | 'all';

export interface ProcessedWeightData {
  date: string;
  formattedDate: string;
  timestamp: Date;
  weightKg: number;
  bmi: number;
  bmiCategory: string;
}

export interface WeightProgress {
  currentWeight: number;
  startingWeight: number;
  targetWeight?: number;
  weightChange: number; // kg
  weightChangeRate: number; // kg/month
  progressToGoal?: number; // percentage (0-100)
  timeSpan: number; // days
  bmiChange: number;
  currentBMI: number;
  startingBMI: number;
}

/**
 * Process weight data for chart display
 */
export function processWeightData(
  vitals: VitalsLog[], 
  individual: Individual,
  timeframe: WeightTimeframe
): ProcessedWeightData[] {
  // Filter to only vitals with weight data
  const weightVitals = vitals.filter(v => v.weightKg && v.weightKg > 0);
  
  if (weightVitals.length === 0 || !individual.heightCm) {
    return [];
  }

  // Apply timeframe filter
  const cutoffDate = getTimeframeCutoff(timeframe);
  const filteredVitals = cutoffDate 
    ? weightVitals.filter(v => new Date(v.recordedAt) >= cutoffDate)
    : weightVitals;

  return filteredVitals
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(vital => {
      const bmi = calculateBMI(vital.weightKg!, individual.heightCm!);
      return {
        date: new Date(vital.recordedAt).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short' 
        }),
        formattedDate: new Date(vital.recordedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        timestamp: new Date(vital.recordedAt),
        weightKg: vital.weightKg!,
        bmi,
        bmiCategory: getBMICategory(bmi)
      };
    });
}

/**
 * Get cutoff date for timeframe filter
 */
function getTimeframeCutoff(timeframe: WeightTimeframe): Date | null {
  const now = new Date();
  switch (timeframe) {
    case '3m':
      return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    case '6m':
      return new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
    case '1y':
      return new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    case 'all':
      return null;
    default:
      return null;
  }
}

/**
 * Calculate weight progress and statistics
 */
export function calculateWeightProgress(
  weightData: ProcessedWeightData[],
  targetWeight?: number,
  targetBMI?: number
): WeightProgress | null {
  if (weightData.length === 0) return null;

  const latest = weightData[weightData.length - 1];
  const earliest = weightData[0];
  
  const timeSpanMs = latest.timestamp.getTime() - earliest.timestamp.getTime();
  const timeSpanDays = Math.max(1, timeSpanMs / (1000 * 60 * 60 * 24));
  const timeSpanMonths = timeSpanDays / 30.44; // Average days per month

  const weightChange = latest.weightKg - earliest.weightKg;
  const weightChangeRate = weightChange / Math.max(0.1, timeSpanMonths); // kg/month
  const bmiChange = latest.bmi - earliest.bmi;

  let progressToGoal: number | undefined;
  if (targetWeight) {
    const totalNeededChange = earliest.weightKg - targetWeight;
    if (totalNeededChange !== 0) {
      const achievedChange = earliest.weightKg - latest.weightKg;
      progressToGoal = Math.max(0, Math.min(100, (achievedChange / totalNeededChange) * 100));
    }
  }

  return {
    currentWeight: latest.weightKg,
    startingWeight: earliest.weightKg,
    targetWeight,
    weightChange,
    weightChangeRate,
    progressToGoal,
    timeSpan: timeSpanDays,
    bmiChange,
    currentBMI: latest.bmi,
    startingBMI: earliest.bmi
  };
}

/**
 * Determine if weight change rate is healthy or concerning
 */
export function determineWeightChangeRate(
  weightChangeRate: number
): 'healthy' | 'concerning_loss' | 'concerning_gain' | 'stable' {
  const absRate = Math.abs(weightChangeRate);
  
  // Stable weight (< 0.5 kg/month change)
  if (absRate < 0.5) return 'stable';
  
  // Healthy weight change (0.5 - 2 kg/month)
  if (absRate <= 2) return 'healthy';
  
  // Concerning rapid change (> 2 kg/month)
  return weightChangeRate > 0 ? 'concerning_gain' : 'concerning_loss';
}

/**
 * Get BMI category color for UI display
 */
export function getBMIColor(bmi: number): string {
  if (bmi < 18.5) return '#EAB308'; // yellow-500 (underweight)
  if (bmi < 25) return '#10B981'; // emerald-500 (normal)
  if (bmi < 30) return '#F59E0B'; // amber-500 (overweight)  
  return '#EF4444'; // red-500 (obese)
}

/**
 * Generate weight-specific health insights
 */
export function generateWeightInsights(
  progress: WeightProgress,
  targetWeight?: number,
  targetBMI?: number
): string[] {
  const insights: string[] = [];
  
  // Weight change insights
  const changeTimeframe = progress.timeSpan < 60 ? 
    Math.round(progress.timeSpan) + ' days' : 
    Math.round(progress.timeSpan / 30.44) + ' months';
    
  if (Math.abs(progress.weightChange) >= 0.5) {
    const direction = progress.weightChange < 0 ? 'lost' : 'gained';
    insights.push(`${direction} ${Math.abs(progress.weightChange).toFixed(1)} kg over ${changeTimeframe}`);
  }

  // BMI insights  
  const bmiDirection = progress.bmiChange < 0 ? 'decreased' : 'increased';
  if (Math.abs(progress.bmiChange) >= 0.5) {
    insights.push(`BMI ${bmiDirection} by ${Math.abs(progress.bmiChange).toFixed(1)} points`);
  }

  // Goal progress insights
  if (progress.progressToGoal !== undefined && targetWeight) {
    if (progress.progressToGoal >= 100) {
      insights.push('Target weight achieved! 🎯');
    } else if (progress.progressToGoal >= 75) {
      insights.push(`Excellent progress: ${progress.progressToGoal.toFixed(0)}% to goal`);
    } else if (progress.progressToGoal >= 50) {
      insights.push(`Good progress: ${progress.progressToGoal.toFixed(0)}% to goal`);
    } else if (progress.progressToGoal > 0) {
      insights.push(`Making progress: ${progress.progressToGoal.toFixed(0)}% to goal`);
    }
  }

  // Rate insights
  const rateCategory = determineWeightChangeRate(progress.weightChangeRate);
  switch (rateCategory) {
    case 'concerning_loss':
      insights.push(`⚠️ Rapid weight loss: ${Math.abs(progress.weightChangeRate).toFixed(1)} kg/month`);
      break;
    case 'concerning_gain':
      insights.push(`⚠️ Rapid weight gain: ${progress.weightChangeRate.toFixed(1)} kg/month`);
      break;
    case 'healthy':
      insights.push(`✓ Healthy rate: ${Math.abs(progress.weightChangeRate).toFixed(1)} kg/month`);
      break;
    case 'stable':
      insights.push('Weight stable over time period');
      break;
  }

  return insights;
}

// ========================
// MEDICAL HISTORY UTILITIES
// ========================

export type VisitTypeFilter = 'routine' | 'emergency' | 'follow_up' | 'specialist';
export type SeverityFilter = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
export type MedicalHistorySortOrder = 'newest' | 'oldest';

export interface MedicalHistoryFilters {
  visitTypes: VisitTypeFilter[];
  severities: SeverityFilter[];
  dateRange?: { start: Date; end: Date };
  searchQuery: string;
}

/**
 * Filter medical history records based on criteria
 */
export function filterMedicalRecords(
  records: MedicalHistory[],
  filters: MedicalHistoryFilters
): MedicalHistory[] {
  return records.filter(record => {
    // Visit type filter
    if (filters.visitTypes.length > 0 && !filters.visitTypes.includes(record.visitType as VisitTypeFilter)) {
      return false;
    }

    // Severity filter  
    if (filters.severities.length > 0 && !filters.severities.includes(record.severity as SeverityFilter)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const visitDate = new Date(record.visitDate);
      if (visitDate < filters.dateRange.start || visitDate > filters.dateRange.end) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        record.diagnosis,
        record.chiefComplaint,
        record.icd10Code || '',
        record.visitType.replace(/_/g, ' ')
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort medical history records
 */
export function sortMedicalRecords(
  records: MedicalHistory[],
  sortOrder: MedicalHistorySortOrder
): MedicalHistory[] {
  return [...records].sort((a, b) => {
    const dateA = new Date(a.visitDate).getTime();
    const dateB = new Date(b.visitDate).getTime();
    
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Get statistics for medical history
 */
export function getMedicalHistoryStats(records: MedicalHistory[]): {
  totalVisits: number;
  visitTypeBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  timeSpan: { earliest: Date; latest: Date } | null;
  commonDiagnoses: { diagnosis: string; count: number }[];
} {
  if (records.length === 0) {
    return {
      totalVisits: 0,
      visitTypeBreakdown: {},
      severityBreakdown: {},
      timeSpan: null,
      commonDiagnoses: []
    };
  }

  // Visit type breakdown
  const visitTypeBreakdown = records.reduce((acc, record) => {
    const type = record.visitType.replace(/_/g, ' ');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Severity breakdown
  const severityBreakdown = records.reduce((acc, record) => {
    acc[record.severity] = (acc[record.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Time span
  const dates = records.map(r => new Date(r.visitDate)).sort((a, b) => a.getTime() - b.getTime());
  const timeSpan = {
    earliest: dates[0],
    latest: dates[dates.length - 1]
  };

  // Common diagnoses
  const diagnosisCount = records.reduce((acc, record) => {
    acc[record.diagnosis] = (acc[record.diagnosis] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonDiagnoses = Object.entries(diagnosisCount)
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalVisits: records.length,
    visitTypeBreakdown,
    severityBreakdown,
    timeSpan,
    commonDiagnoses
  };
}

/**
 * Generate medical history insights
 */
export function generateMedicalHistoryInsights(records: MedicalHistory[]): string[] {
  const insights: string[] = [];
  const stats = getMedicalHistoryStats(records);

  if (stats.totalVisits === 0) {
    return ['No medical history recorded'];
  }

  // Visit frequency insights
  if (stats.timeSpan) {
    const daysBetween = Math.round((stats.timeSpan.latest.getTime() - stats.timeSpan.earliest.getTime()) / (1000 * 60 * 60 * 24));
    const visitRate = stats.totalVisits / Math.max(1, daysBetween / 30.44); // visits per month

    if (visitRate > 2) {
      insights.push(`High medical utilization: ${visitRate.toFixed(1)} visits/month`);
    } else if (visitRate < 0.2) {
      insights.push(`Low medical utilization: ${visitRate.toFixed(1)} visits/month`);
    }
  }

  // Emergency visit insights
  const emergencyVisits = stats.visitTypeBreakdown['emergency'] || 0;
  const emergencyPercentage = (emergencyVisits / stats.totalVisits) * 100;
  
  if (emergencyPercentage > 30) {
    insights.push(`⚠️ High emergency visits: ${emergencyPercentage.toFixed(0)}% of total`);
  }

  // Severity insights
  const criticalVisits = stats.severityBreakdown['CRITICAL'] || 0;
  const severeVisits = stats.severityBreakdown['SEVERE'] || 0;
  const highSeverityPercentage = ((criticalVisits + severeVisits) / stats.totalVisits) * 100;

  if (highSeverityPercentage > 40) {
    insights.push(`⚠️ High severity cases: ${highSeverityPercentage.toFixed(0)}% severe/critical`);
  }

  // Common conditions
  if (stats.commonDiagnoses.length > 0) {
    const topDiagnosis = stats.commonDiagnoses[0];
    if (topDiagnosis.count > 1) {
      insights.push(`Most common: ${topDiagnosis.diagnosis} (${topDiagnosis.count} visits)`);
    }
  }

  // Follow-up compliance
  const followUpVisits = stats.visitTypeBreakdown['follow up'] || 0;
  const followUpPercentage = (followUpVisits / stats.totalVisits) * 100;
  
  if (followUpPercentage < 10 && stats.totalVisits > 3) {
    insights.push('⚠️ Low follow-up compliance');
  } else if (followUpPercentage > 30) {
    insights.push('✓ Good follow-up compliance');
  }

  return insights;
}

/**
 * Format date for display in a user-friendly format
 */
export function formatDateForDisplay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Sort array by date in descending order (most recent first)
 */
export function sortByDateDesc<T extends { [key: string]: any }>(
  items: T[], 
  dateKey: keyof T
): T[] {
  return items.sort((a, b) => {
    const dateA = new Date(a[dateKey]).getTime();
    const dateB = new Date(b[dateKey]).getTime();
    return dateB - dateA; // Descending order
  });
}