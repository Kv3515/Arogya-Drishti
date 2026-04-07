import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MobileMyHealthClient } from '@/components/mobile/MobileMyHealthClient';

function isLikelyMobile(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Opera Mini/i.test(userAgent);
}

export default async function MobileMyHealthPage() {
  const userAgent = (await headers()).get('user-agent') ?? '';

  if (!isLikelyMobile(userAgent)) {
    redirect('/dashboard/me');
  }

  return <MobileMyHealthClient />;
}