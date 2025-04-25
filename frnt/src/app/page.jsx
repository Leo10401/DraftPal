'use client';

import Link from 'next/link';
import { useAuth } from '@/Context/AuthContext';
import EmailGenerator from '@/components/email-generator';
import Header from '@/components/Header';
import ComposePage from './compose/page';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Email Sender</h1>
          <p className="text-gray-600 mb-8 text-center">
            A simple app to send emails using your Google account.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/login" 
              className="bg-blue-600 text-white font-medium py-3 px-4 rounded-md text-center hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ComposePage/>
    </div>
  );
}
