'use client';

import type { Individual, AnnualMedicalExam, VitalsLog } from '@/lib/api';
import { formatShapeCode } from '@/components/doctor/DoctorExamCard';

interface FitnessCertificateProps {
  patient: Individual;
  latestExam?: AnnualMedicalExam | null;
  latestVitals?: VitalsLog | null;
}

export function FitnessCertificate({ patient, latestExam, latestVitals }: FitnessCertificateProps) {
  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bmi =
    patient.heightCm && patient.weightKg
      ? (patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1)
      : null;

  const shapeCode = latestExam
    ? formatShapeCode(latestExam.shapeS ?? null, latestExam.shapeH ?? null, latestExam.shapeA ?? null, latestExam.shapeP ?? null, latestExam.shapeE ?? null)
    : null;

  const categoryLabel = patient.medicalCategory || 'N/A';
  const fitnessExpiry = latestExam?.fitnessValidUntil
    ? new Date(latestExam.fitnessValidUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';
  const examDate = latestExam?.examDate
    ? new Date(latestExam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="print-only hidden" style={{ fontFamily: 'Georgia, serif', color: '#000', background: '#fff' }}>
      {/* Certificate border */}
      <div style={{ border: '2px solid #000', padding: '24px 32px', minHeight: '260mm' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Armed Forces Medical Services
          </p>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Medical Fitness Certificate
          </h1>
          <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>
            Arogya Drishti — Military Medical Intelligence Platform
          </p>
          <p style={{ fontSize: '10px', marginTop: '4px' }}>
            <strong>Unit:</strong> {patient.unit?.name ?? 'N/A'}
          </p>
        </div>

        {/* Category badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <div style={{
            border: '3px double #000',
            padding: '8px 28px',
            textAlign: 'center',
            minWidth: '180px',
          }}>
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2px' }}>Medical Category</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', lineHeight: 1, margin: '2px 0' }}>{shapeCode ?? categoryLabel}</p>
            <p style={{ fontSize: '9px', marginTop: '2px' }}>Valid until: {fitnessExpiry}</p>
          </div>
        </div>

        {/* Personal details table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', width: '25%', background: '#f5f5f5' }}>Full Name</td>
              <td style={{ padding: '5px 8px', width: '25%' }}>{patient.name}</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', width: '25%', background: '#f5f5f5' }}>Service Number</td>
              <td style={{ padding: '5px 8px', width: '25%' }}>{patient.serviceNumber}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Rank</td>
              <td style={{ padding: '5px 8px' }}>{patient.rank ?? 'N/A'}</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Date of Birth</td>
              <td style={{ padding: '5px 8px' }}>
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'N/A'}
                {age ? ` (${age} yrs)` : ''}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Sex</td>
              <td style={{ padding: '5px 8px' }}>{patient.sex}</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Blood Group</td>
              <td style={{ padding: '5px 8px' }}>{patient.bloodGroup}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Height</td>
              <td style={{ padding: '5px 8px' }}>{patient.heightCm ? `${patient.heightCm} cm` : 'N/A'}</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Weight / BMI</td>
              <td style={{ padding: '5px 8px' }}>{patient.weightKg ? `${patient.weightKg} kg` : 'N/A'}{bmi ? ` / BMI ${bmi}` : ''}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Duty Status</td>
              <td style={{ padding: '5px 8px', textTransform: 'capitalize' }}>{patient.dutyStatus?.replace(/_/g, ' ') ?? 'N/A'}</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', background: '#f5f5f5' }}>Exam Date</td>
              <td style={{ padding: '5px 8px' }}>{examDate}</td>
            </tr>
          </tbody>
        </table>

        {/* SHAPE scores */}
        {latestExam && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', marginBottom: '8px', paddingBottom: '3px' }}>
              SHAPE Assessment
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  {['S — Stability', 'H — Hearing', 'A — Agility', 'P — Physique', 'E — Eyesight'].map(h => (
                    <th key={h} style={{ padding: '5px', border: '1px solid #ccc', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[latestExam.shapeS, latestExam.shapeH, latestExam.shapeA, latestExam.shapeP, latestExam.shapeE].map((v, i) => (
                    <td key={i} style={{ padding: '6px', border: '1px solid #ccc', fontSize: '16px', fontWeight: 'bold' }}>{v ?? 'N/A'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            {latestExam.remarks && (
              <p style={{ marginTop: '8px', fontSize: '10px', color: '#444' }}>
                <strong>Remarks:</strong> {latestExam.remarks}
              </p>
            )}
          </div>
        )}

        {/* Latest vitals */}
        {latestVitals && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000', marginBottom: '8px', paddingBottom: '3px' }}>
              Latest Vitals &nbsp;
              <span style={{ fontWeight: 'normal', fontSize: '10px', textTransform: 'none' }}>
                (recorded {new Date(latestVitals.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
              </span>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                <tr>
                  {[
                    { label: 'BP (mmHg)',    value: latestVitals.systolicBp != null && latestVitals.diastolicBp != null ? `${latestVitals.systolicBp}/${latestVitals.diastolicBp}` : 'N/A' },
                    { label: 'HR (bpm)',     value: latestVitals.heartRateBpm ?? 'N/A' },
                    { label: 'SpO₂ (%)',     value: latestVitals.spo2Percent != null ? `${latestVitals.spo2Percent}%` : 'N/A' },
                    { label: 'Temp (°C)',    value: latestVitals.tempCelsius != null ? `${Number(latestVitals.tempCelsius).toFixed(1)}°C` : 'N/A' },
                    { label: 'RR (/min)',    value: latestVitals.respiratoryRate ?? 'N/A' },
                  ].map(({ label, value }) => (
                    <td key={label} style={{ padding: '5px 8px', border: '1px solid #ccc', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#666' }}>{label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{String(value)}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Signature section */}
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {['Examining Medical Officer', 'Unit Commander', 'Individual\'s Signature'].map((label) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '6px', height: '40px' }} />
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '18px', borderTop: '1px solid #ccc', paddingTop: '6px', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', color: '#888' }}>
            Generated by Arogya Drishti Medical Intelligence Platform · {new Date().toLocaleString('en-IN')} · FOR OFFICIAL USE ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
