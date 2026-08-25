import { LoginForm } from '@/examples/reference-features/auth/presentation/components/login-form';

/**
 * Only meaningfully reachable when NEXT_PUBLIC_AUTH_PROVIDER=reference_backend.
 * Consumes examples/reference-features/auth — no business logic of its own.
 */
export default function LoginPage() {
  return <LoginForm />;
}
