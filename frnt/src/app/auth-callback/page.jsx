'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';

// Create a separate client component to use the hooks
function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save the token to localStorage
      localStorage.setItem('authToken', token);
      
      // Refresh auth state
      checkAuth();
      
      // Redirect to home or dashboard
      router.push('/');
    } else {
      // No token found, redirect to login
      router.push('/login?error=auth_failed');
    }
  }, [searchParams, router, checkAuth]);

  // Simple loading state while processing
  return (
    <div className="text-center">
      <h1 className="text-2xl mb-4">Completing authentication...</h1>
      <div className="animate-pulse">Please wait</div>
    </div>
  );
}

// Main page component with Suspense
export default function AuthCallback() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Suspense fallback={
        <div className="text-center">
          <h1 className="text-2xl mb-4">Loading...</h1>
          <div className="animate-pulse">Please wait</div>
        </div>
      }>
        <AuthCallbackClient />
      </Suspense>
    </div>
  );
} 