'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/TacticalStatusBadge';
import { 
  User, 
  Calendar, 
  Droplets, 
  Ruler, 
  Scale, 
  Calculator,
  Shield,
  AlertTriangle,
  HeartPulse,
  Activity,
  Eye,
  Ear
} from 'lucide-react';
import type { Individual, VitalsLog, AnnualMedicalExam, InjuryLog } from '@/lib/api';
import {
  calculateHealthMetrics,
  generateHealthAlerts,
  determineOverallHealthStatus,
  getStatusDisplayText,
  calculateActiveConditionsCount,
  getBMICategory,
  getBMIStatusColor,
  type HealthAlert
} from '@/lib/health/calculations';

interface HealthOverviewCardProps {
  individual: Individual;
  latestVitals?: VitalsLog;
  latestExam?: AnnualMedicalExam;
  activeInjuries: InjuryLog[];
  className?: string;
}

export function HealthOverviewCard({
  individual,
  latestVitals,
  latestExam,
  activeInjuries,
  className = '',
}: HealthOverviewCardProps) {
  // Calculate health metrics using utility functions
  const healthMetrics = useMemo(() => {
    return calculateHealthMetrics(individual, latestVitals, latestExam);
  }, [individual, latestVitals, latestExam]);

  // Generate health alerts
  const healthAlerts = useMemo(() => {
    return generateHealthAlerts(individual, latestVitals, latestExam, activeInjuries);
  }, [individual, latestVitals, latestExam, activeInjuries]);

  // Calculate overall health status
  const overallHealthStatus = useMemo(() => {
    return determineOverallHealthStatus(healthAlerts);
  }, [healthAlerts]);

  // Calculate active conditions count
  const activeConditionsCount = useMemo(() => {
    return calculateActiveConditionsCount(activeInjuries, healthAlerts);
  }, [activeInjuries, healthAlerts]);

  const getAlertIcon = (alert: HealthAlert) => {
    switch (alert.category) {
      case 'vitals': 
        return alert.message.includes('pressure') ? HeartPulse :
               alert.message.includes('oxygen') ? Activity : HeartPulse;
      case 'bmi': return Calculator;
      case 'fitness': return Shield;
      case 'injury': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className={`${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <User className="h-5 w-5" />
            Health Overview
          </h2>
          <StatusBadge 
            status={overallHealthStatus}
            label={getStatusDisplayText(overallHealthStatus)}
          />
        </div>
        <p className="section-subtitle">
          Personal health summary for {individual.name}
        </p>
      </div>

      <div className="card-padding space-y-6">
        {/* Basic Demographics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-shrink-0">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Age</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {healthMetrics.age} years
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-shrink-0">
              <Droplets className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Blood Group</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {individual.bloodGroup}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-shrink-0">
              <Ruler className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Height</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {healthMetrics.currentHeight ? `${healthMetrics.currentHeight} cm` : 'Not recorded'}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">as on I Card</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-shrink-0">
              <Scale className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">Weight</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {healthMetrics.currentWeight ? `${healthMetrics.currentWeight} kg` : 'Not recorded'}
              </div>
              {latestVitals?.recordedAt ? (
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Measured on {new Date(latestVitals.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              ) : (
                <div className="text-[10px] text-gray-400 mt-0.5">Measurement date unknown</div>
              )}
            </div>
          </div>
        </div>

        {/* Key Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BMI Card */}
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calculator className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {healthMetrics.bmi?.toFixed(1) ?? '--'}
            </div>
            <div className="text-sm text-primary-600 dark:text-primary-400">BMI</div>
            {healthMetrics.bmi && (
              <div className={`text-xs mt-1 font-medium ${
                getBMIStatusColor(healthMetrics.bmi) === 'success' ? 'text-success-600 dark:text-success-400' :
                getBMIStatusColor(healthMetrics.bmi) === 'warning' ? 'text-warning-600 dark:text-warning-400' :
                'text-danger-600 dark:text-danger-400'
              }`}>
                {getBMICategory(healthMetrics.bmi)}
              </div>
            )}
          </div>

          {/* Fitness Status Card */}
          <div className={`text-center p-4 rounded-lg ${
            individual.fitnessStatus === 'fit' 
              ? 'bg-success-50 dark:bg-success-900/20' 
              : individual.fitnessStatus === 'temporarily_unfit'
              ? 'bg-warning-50 dark:bg-warning-900/20'
              : 'bg-danger-50 dark:bg-danger-900/20'
          }`}>
            <div className="flex items-center justify-center mb-2">
              <Shield className={`h-5 w-5 ${
                individual.fitnessStatus === 'fit'
                  ? 'text-success-600 dark:text-success-400'
                  : individual.fitnessStatus === 'temporarily_unfit'
                  ? 'text-warning-600 dark:text-warning-400'
                  : 'text-danger-600 dark:text-danger-400'
              }`} />
            </div>
            <div className={`text-sm font-semibold uppercase ${
              individual.fitnessStatus === 'fit'
                ? 'text-success-700 dark:text-success-300'
                : individual.fitnessStatus === 'temporarily_unfit'
                ? 'text-warning-700 dark:text-warning-300'
                : 'text-danger-700 dark:text-danger-300'
            }`}>
              {individual.fitnessStatus.replace('_', ' ')}
            </div>
            <div className={`text-xs ${
              individual.fitnessStatus === 'fit'
                ? 'text-success-600 dark:text-success-400'
                : individual.fitnessStatus === 'temporarily_unfit'
                ? 'text-warning-600 dark:text-warning-400'
                : 'text-danger-600 dark:text-danger-400'
            }`}>
              Fitness Status
            </div>
            {latestExam?.fitnessValidUntil && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Valid until {new Date(latestExam.fitnessValidUntil).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Active Conditions Card */}
          <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
              {activeConditionsCount}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Active Conditions
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {activeInjuries.length} injuries, {healthAlerts.length} alerts
            </div>
          </div>
        </div>

        {/* Latest Examination Details */}
        {latestExam && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Latest Medical Examination
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {new Date(latestExam.examDate).toLocaleDateString()}
                </span>
              </div>
              {latestExam.visionLeft && latestExam.visionRight && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-500 dark:text-gray-400">Vision:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                    {latestExam.visionLeft}/{latestExam.visionRight}
                  </span>
                </div>
              )}
              {latestExam.hearingStatus && (
                <div className="flex items-center gap-1">
                  <Ear className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-500 dark:text-gray-400">Hearing:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {latestExam.hearingStatus}
                  </span>
                </div>
              )}
              {latestExam.bmi && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Exam BMI:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {latestExam.bmi}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Alerts */}
        {healthAlerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Health Alerts ({healthAlerts.length})
            </h3>
            <div className="space-y-2">
              {healthAlerts.slice(0, 4).map((alert, index) => {
                const Icon = getAlertIcon(alert);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      alert.type === 'critical'
                        ? 'bg-danger-50 text-danger-800 dark:bg-danger-900/20 dark:text-danger-300'
                        : alert.type === 'warning'
                        ? 'bg-warning-50 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300'
                        : 'bg-primary-50 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{alert.message}</span>
                    <span className="text-xs opacity-75 capitalize">{alert.type}</span>
                  </div>
                );
              })}
              {healthAlerts.length > 4 && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    +{healthAlerts.length - 4} more alerts
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Information */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <span>
              Service Number: {individual.serviceNumber}
            </span>
            <span>
              Last updated: {latestVitals 
                ? new Date(latestVitals.recordedAt).toLocaleDateString()
                : 'No recent vitals'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}