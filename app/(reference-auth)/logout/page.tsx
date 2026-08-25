'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/examples/reference-features/auth/presentation/hooks/use-auth';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    void logout().finally(() => router.push('/login'));
    // Runs once on mount; logout()/router identity churn is intentionally ignored here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <p className="text-sm text-muted-foreground">Logging out…</p>;
}
