'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Authentication Error
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            There was a problem confirming your authentication. This could happen if:
          </p>
          
          <ul className="text-sm text-gray-600 space-y-2 mb-6 list-disc list-inside">
            <li>The confirmation link has expired</li>
            <li>The link has already been used</li>
            <li>The link was invalid or corrupted</li>
          </ul>
          
          <div className="space-y-3">
            <Link 
              href="/signup"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Try Signing Up Again
            </Link>
            
            <Link 
              href="/login"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}