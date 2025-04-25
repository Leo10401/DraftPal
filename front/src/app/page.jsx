import Link from 'next/link';

export default function Home() {
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