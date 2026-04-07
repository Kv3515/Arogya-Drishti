'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuditPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin?tab=audit');
  }, [router]);
  return null;
}
