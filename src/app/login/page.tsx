'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/presentation/contexts/auth-context';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, error, isConfigured, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(password);
      if (success) {
        router.push('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show configuration error
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-destructive">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <CardTitle className="text-xl text-destructive">Server Not Configured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              The server is not configured for authentication.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono">
                Set the <strong>AUTH_PASSWORD</strong> environment variable and restart the server.
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Example: <code className="bg-muted px-1 rounded">AUTH_PASSWORD=your-password</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌡️</div>
          <CardTitle className="text-2xl">Fever Log</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter password to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !password}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
