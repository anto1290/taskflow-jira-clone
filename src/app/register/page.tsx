'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { GuestRoute } from '@/components/RouteGuards';
import { Button } from '@/components/Button';
import { useRegister } from '@/hooks/useApi';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const register = useRegister();

  useEffect(() => {
    if (isAuthenticated) router.replace('/projects');
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await register.mutateAsync({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      displayName: fd.get('displayName') as string,
    });
  }

  return (
    <GuestRoute>
      <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-xl bg-primary-500/10 items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary">Create account</h1>
            <p className="text-sm text-neutral-500 mt-1">Start managing your projects</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                minLength={1}
                maxLength={100}
                className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full h-10 px-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                placeholder="Min 8 characters"
              />
            </div>
            {register.isError && (
              <p className="text-sm text-error-400">{register.error?.message ?? 'Registration failed'}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              isLoading={register.isPending}
              disabled={register.isPending}
            >
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </GuestRoute>
  );
}
