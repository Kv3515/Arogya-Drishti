'use client';

import { Plus, X } from 'lucide-react';

interface Prescription {
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route: string;
  instructions?: string;
}

interface PrescriptionFormProps {
  prescriptions: Prescription[];
  onPrescriptionsChange: (prescriptions: Prescription[]) => void;
}

const MEDICATION_ROUTES = ['oral', 'IV', 'IM', 'topical', 'inhaled', 'other'] as const;

const COMMON_DRUGS = [
  'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
  'Omeprazole', 'Prednisolone', 'Salbutamol', 'Metformin', 'Amlodipine'
];

const COMMON_FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed'
];

export function PrescriptionForm({ prescriptions, onPrescriptionsChange }: PrescriptionFormProps) {
  const addPrescription = () => {
    const newPrescription: Prescription = {
      drugName: '',
      dosage: '',
      frequency: 'Twice daily',
      durationDays: 7,
      route: 'oral',
      instructions: '',
    };
    onPrescriptionsChange([...prescriptions, newPrescription]);
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string | number) => {
    const updated = prescriptions.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    );
    onPrescriptionsChange(updated);
  };

  const removePrescription = (index: number) => {
    onPrescriptionsChange(prescriptions.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Prescriptions ({prescriptions.length})</h4>
        <button
          type="button"
          onClick={addPrescription}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Medication
        </button>
      </div>

      {prescriptions.map((prescription, index) => (
        <div key={index} className="mb-4 p-3 bg-white border border-gray-100 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Medication {index + 1}</span>
            <button
              type="button"
              onClick={() => removePrescription(index)}
              className="text-gray-400 hover:text-red-500 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Drug Name *</label>
              <input
                list={`drugs-${index}`}
                value={prescription.drugName}
                onChange={(e) => updatePrescription(index, 'drugName', e.target.value)}
                className="input input-sm text-xs"
                placeholder="e.g. Paracetamol"
              />
              <datalist id={`drugs-${index}`}>
                {COMMON_DRUGS.map(drug => (
                  <option key={drug} value={drug} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Dosage *</label>
              <input
                value={prescription.dosage}
                onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                className="input input-sm text-xs"
                placeholder="e.g. 500mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Frequency *</label>
              <select
                value={prescription.frequency}
                onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                className="input input-sm text-xs"
              >
                {COMMON_FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Duration (Days) *</label>
              <input
                type="number"
                min="1"
                max="365"
                value={prescription.durationDays}
                onChange={(e) => updatePrescription(index, 'durationDays', parseInt(e.target.value) || 1)}
                className="input input-sm text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Route *</label>
              <select
                value={prescription.route}
                onChange={(e) => updatePrescription(index, 'route', e.target.value)}
                className="input input-sm text-xs"
              >
                {MEDICATION_ROUTES.map(route => (
                  <option key={route} value={route}>{route.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Instructions</label>
            <textarea
              value={prescription.instructions}
              onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
              className="input input-sm text-xs resize-none"
              rows={2}
              maxLength={1000}
              placeholder="e.g. Take with food, avoid alcohol"
            />
          </div>
        </div>
      ))}

      {prescriptions.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          <p className="text-xs">No medications prescribed</p>
          <p className="text-[10px] text-gray-300 mt-1">Click "Add Medication" to prescribe</p>
        </div>
      )}
    </div>
  );
}