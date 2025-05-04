"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { z } from 'zod';
import { CheckCircle, ArrowLeft, X,  } from 'lucide-react';

// Validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

const ResetPasswordPage = ({ params }: { params: { token: string } }) => {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [resetComplete, setResetComplete] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  
  const token = params.token;
  
  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
    
    // Basic validation of token format
    if (!token || token.length < 20) {
      setInvalidToken(true);
    }
  }, [token, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});
    
    try {
      // Validate the form
      const result = resetPasswordSchema.safeParse({ password, confirmPassword });
      
      if (!result.success) {
        const formattedErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          const field = error.path[0] as string;
          formattedErrors[field] = error.message;
        });
        setValidationErrors(formattedErrors);
        return;
      }
      
      // Reset password
      await resetPassword(token, password);
      setResetComplete(true);
    } catch (err) {
      console.error('Password reset failed:', err);
      // If there's a specific error about invalid or expired token
      if (error?.includes('token') || error?.includes('expired')) {
        setInvalidToken(true);
      }
    }
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <X className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid or Expired Link</h3>
              <p className="mt-2 text-sm text-gray-500">
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <div className="mt-6">
                <Link
                  href="/forgot-pasword"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Request New Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center text-emerald-600 hover:text-emerald-500 mb-6">
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back to Home</span>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Create New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter a new password for your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {resetComplete ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Password Reset Complete</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                  />
                </div>
                {validationErrors.password && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm`}
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>Password must:</p>
                <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                  <li>Be at least 8 characters long</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one lowercase letter</li>
                  <li>Include at least one number</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 