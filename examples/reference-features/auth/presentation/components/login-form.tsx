'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/core/design-system/ui/button';
import { Input } from '@/core/design-system/ui/input';
import { AppStrings } from '@/core/strings/app-strings';
import { appToast } from '@/core/shared/components/app-toast';
import { useAuth } from '@/examples/reference-features/auth/presentation/hooks/use-auth';

/**
 * Reference login screen for the `reference_backend` auth provider. UI
 * renders and delegates to `useAuth()` — no fetch/token logic lives here.
 */
export function LoginForm() {
  const router = useRouter();
  const { login, isLoggingIn, authState } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login({ phone, password });
      router.push('/');
    } catch {
      appToast.error(AppStrings.auth.loginFailed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold">{AppStrings.auth.login}</h1>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {authState.status === 'error' ? <p className="text-sm text-destructive">{authState.message}</p> : null}

      <Button type="submit" className="w-full" disabled={isLoggingIn}>
        {isLoggingIn ? AppStrings.common.loading : AppStrings.auth.login}
      </Button>
    </form>
  );
}
