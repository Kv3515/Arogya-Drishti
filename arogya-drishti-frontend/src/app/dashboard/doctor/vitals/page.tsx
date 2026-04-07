'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorVitalsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/doctor');
  }, [router]);
  return null;
}
