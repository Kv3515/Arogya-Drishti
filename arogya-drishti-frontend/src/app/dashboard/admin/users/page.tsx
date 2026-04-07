'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/admin?tab=users');
  }, [router]);
  return null;
}
