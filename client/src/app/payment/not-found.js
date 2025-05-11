"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4 text-center">
      <h2 className="text-3xl font-bold text-emerald-800 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        The payment page you are looking for does not exist or may have been moved.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  );
} 