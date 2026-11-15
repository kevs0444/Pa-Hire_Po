import { Suspense } from 'react';
import { AuthScreen } from '@/features/auth/components/AuthScreen';

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthScreen
      initialError={params.error || ''}
      nextPath={params.next || '/'}
    />
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
