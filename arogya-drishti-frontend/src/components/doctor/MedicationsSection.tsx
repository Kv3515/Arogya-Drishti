'use client';

import { useState, useEffect } from 'react';
import { Pill, Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import { api, type Prescription } from '@/lib/api';

interface MedicationsSectionProps {
  serviceNumber: string;
}

export function MedicationsSection({ serviceNumber }: MedicationsSectionProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [serviceNumber]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listPrescriptions(serviceNumber);
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePrescription = async (prescriptionId: string) => {
    try {
      await api.deactivatePrescription(prescriptionId);
      // Refresh the list
      await fetchPrescriptions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate prescription.');
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.dose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (prescription: Prescription) => {
    // No createdAt on Prescription — cannot determine expiry; default to not expired
    return false;
  };

  const getExpiryDays = (_prescription: Prescription) => {
    // No createdAt on Prescription — cannot calculate expiry days
    return 999;
  };

  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="h-4 w-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Medications</h3>
        </div>
        <div className="text-center py-8 text-gray-400">Loading medications...</div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Medications</h3>
          {filteredPrescriptions.length > 0 && (
            <span className="text-xs text-gray-400">{filteredPrescriptions.length} prescriptions</span>
          )}
        </div>
        <button
          onClick={() => setShowActiveOnly(!showActiveOnly)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            showActiveOnly 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {showActiveOnly ? 'Active Only' : 'All Medications'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medications..."
            className="input input-sm pl-10"
          />
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No medications found</p>
          <p className="text-xs text-gray-300 mt-1">
            {searchTerm ? 'Try a different search term' : 'Prescriptions will appear here when added'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrescriptions.map((prescription) => {
            const expiryDays = getExpiryDays(prescription);
            const expired = isExpired(prescription);
            const expiringSoon = expiryDays <= 3 && expiryDays > 0;

            return (
              <div
                key={prescription.id}
                className={`p-4 rounded-lg border transition-colors ${
                  expired 
                    ? 'border-red-200 bg-red-50' 
                    : expiringSoon 
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{prescription.drugName}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {prescription.route.toUpperCase()}
                      </span>
                      {!prescription.instructions && null /* isActive not in type */}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{prescription.dose}</span> • {prescription.frequency}
                    </div>
                    {prescription.instructions && (
                      <p className="text-xs text-gray-500 mb-2">{prescription.instructions}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {prescription.durationDays} day{prescription.durationDays > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        {prescription.durationDays} day course
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {expired && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>Expired</span>
                      </div>
                    )}
                    {expiringSoon && !expired && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Expires in {expiryDays} day{expiryDays > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {prescription.instructions && null /* isActive not in type */}
                    <button
                      onClick={() => handleDeactivatePrescription(prescription.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}