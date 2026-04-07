'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { api, type Unit } from '@/lib/api';

interface UnitSelectorProps {
  selectedUnitId: string;
  onUnitChange: (unitId: string) => void;
}

export function UnitSelector({ selectedUnitId, onUnitChange }: UnitSelectorProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await api.listUnits();
        setUnits(Array.isArray(u) ? u : []);
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-brand-400 flex-shrink-0" />
        <select
          value={selectedUnitId}
          onChange={(e) => onUnitChange(e.target.value)}
          disabled={loading || units.length === 0}
          className="input input-sm pr-8 min-w-[180px] appearance-none bg-white"
        >
          {loading && <option>Loading units…</option>}
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.unitName}
            </option>
          ))}
        </select>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 -ml-7 pointer-events-none" />
      </div>
    </div>
  );
}
