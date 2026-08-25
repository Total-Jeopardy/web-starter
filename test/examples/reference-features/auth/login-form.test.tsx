import React, { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// getAppConfig() is zod-validated and memoized, so env vars must be set
// before the first call — before importing anything that constructs an
// ApiClient (use-auth -> getApiClient()).
process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
process.env.NEXT_PUBLIC_ENV = 'dev';
process.env.NEXT_PUBLIC_REQUEST_ID_HEADER = 'X-Request-Id';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { LoginForm } from '@/examples/reference-features/auth/presentation/components/login-form';

function renderWithProviders(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('LoginForm', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    push.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders phone and password fields as required inputs', () => {
    renderWithProviders(<LoginForm />);

    const phone = screen.getByLabelText('Phone');
    const password = screen.getByLabelText('Password');

    expect(phone).toBeRequired();
    expect(phone).toHaveAttribute('type', 'tel');
    expect(password).toBeRequired();
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('submits credentials to the login endpoint via fetch', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ access_token: 'access-1', refresh_token: 'refresh-1', id: 'user-1', user_name: 'Ama', role: 'member' }),
    );
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0551234567' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ phone: '0551234567', password: 'password123' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  it('shows the error state and does not navigate when login fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ message: 'Invalid credentials' }, { status: 401 }),
    );
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0551234567' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
