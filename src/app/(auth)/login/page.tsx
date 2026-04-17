import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="bg-card border rounded-lg p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Annex Leather ERP</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-xs text-muted-foreground">
        Seed admin: <code className="font-mono">admin@annex.local</code> / <code className="font-mono">Admin@12345</code>
      </p>
    </div>
  );
}
