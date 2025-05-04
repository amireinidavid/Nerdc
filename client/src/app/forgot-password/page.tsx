"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { z } from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_kvgn01c';
const EMAILJS_TEMPLATE_ID = 'template_9qgu0g7';
const EMAILJS_PUBLIC_KEY = 'ms-zUsw4YPlhKkTxc';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    
    try {
      // Validate the email
      const result = forgotPasswordSchema.safeParse({ email });
      if (!result.success) {
        setValidationError(result.error.errors[0]?.message || 'Invalid email');
        return;
      }
      
      setSendingEmail(true);
      
      // Generate a unique reset token
      const resetToken = uuidv4();
      
      // Store the reset token in the backend through the API
      await requestPasswordReset(email);
      
      // Build the reset link with the token
      const resetLink = `https://nerdc-journal.vercel.app/reset-password/${resetToken}`;
      
      // Prepare template parameters for EmailJS
      const templateParams = {
        email: email,
        to_name: email.split('@')[0],
        link: resetLink,
        message: `Click the link below to reset your password. If you didn't request this, please ignore this email.`,
        site_name: 'NERDC Journal',
      };
      
      // Send the email using EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('Email sent successfully!', response.status, response.text);
      setEmailSent(true);
      setSendingEmail(false);
    } catch (err) {
      console.error('Password reset request failed:', err);
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center text-emerald-600 hover:text-emerald-500 mb-6">
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back to Home</span>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {emailSent ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                <Mail className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-2 text-sm text-gray-500">
                We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Send again
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Didn't receive the email?{' '}
                <Link href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Check your spam folder
                </Link>
              </p>
            </div>
          ) : (
            <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">{validationError}</p>
                )}
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
                  disabled={isLoading || sendingEmail}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    (isLoading || sendingEmail) ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading || sendingEmail ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-sm">
                  <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Return to login
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
