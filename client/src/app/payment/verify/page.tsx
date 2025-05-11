"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Home, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const PaymentVerificationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | 'unknown'>('unknown');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  
  useEffect(() => {
    if (!searchParams) return;
    
    if (typeof window !== 'undefined') {
      const storedInfo = sessionStorage.getItem('remitaCheckoutInfo');
      if (storedInfo) {
        try {
          setPaymentInfo(JSON.parse(storedInfo));
        } catch (e) {
          console.error('Failed to parse payment info:', e);
        }
      }
    }
    
    const rrr = searchParams.get('RRR') || searchParams.get('rrr');
    const statusParam = searchParams.get('status') || '';
    
    if (rrr) {
      setPaymentStatus('success');
    } else if (statusParam.toLowerCase() === 'failed' || statusParam.toLowerCase() === 'error') {
      setPaymentStatus('failed');
    } else if (statusParam.toLowerCase() === 'pending') {
      setPaymentStatus('pending');
    } else {
      setPaymentStatus('unknown');
    }
    
  }, [searchParams]);

  const renderStatusContent = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-green-700 mb-2">Payment Successful</CardTitle>
            <p className="text-center text-gray-600 mb-6">
              Your journal assessment fee payment has been processed successfully.
            </p>
            {paymentInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{paymentInfo.orderId}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">₦{paymentInfo.amount?.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{paymentInfo.serviceName}</span>
                  </div>
                </div>
              </div>
            )}
            <Alert className="bg-green-50 border-green-200 text-green-800 mb-6">
              <AlertTitle className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Payment Confirmed
              </AlertTitle>
              <AlertDescription>
                Your payment has been confirmed. You will receive an email confirmation shortly.
              </AlertDescription>
            </Alert>
          </>
        );
        
      case 'failed':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-red-700 mb-2">Payment Failed</CardTitle>
            <p className="text-center text-gray-600 mb-6">
              Unfortunately, your payment could not be processed. Please try again.
            </p>
            <Alert variant="destructive" className="mb-6">
              <AlertTitle className="flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Payment Error
              </AlertTitle>
              <AlertDescription>
                Your payment was not successful. This could be due to insufficient funds, 
                network issues, or bank restrictions. Please try again or contact your bank.
              </AlertDescription>
            </Alert>
          </>
        );
        
      case 'pending':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-amber-700 mb-2">Payment Pending</CardTitle>
            <p className="text-center text-gray-600 mb-6">
              Your payment is being processed. This may take a few minutes.
            </p>
            <Alert className="bg-amber-50 border-amber-200 text-amber-800 mb-6">
              <AlertTitle className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Payment In Progress
              </AlertTitle>
              <AlertDescription>
                Your payment is being processed. Please do not close this page.
                You will receive an email confirmation once the payment is complete.
              </AlertDescription>
            </Alert>
          </>
        );
        
      default:
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl text-blue-700 mb-2">Payment Status Unknown</CardTitle>
            <p className="text-center text-gray-600 mb-6">
              We couldn't determine the status of your payment. If you completed the payment, 
              it may still be processing.
            </p>
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 mb-6">
              <AlertTitle className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Verification Needed
              </AlertTitle>
              <AlertDescription>
                If you've made the payment, please check your email for confirmation.
                If you haven't received any confirmation within 24 hours, please contact support.
              </AlertDescription>
            </Alert>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4">
      <div className="container max-w-md mx-auto">
        <Card className="border-emerald-100 overflow-hidden">
          <CardHeader className="bg-emerald-50 border-b border-emerald-100">
            <h1 className="text-center text-emerald-800 font-bold text-lg">Payment Verification</h1>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4">
            {renderStatusContent()}
          </CardContent>
          
          <CardFooter className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              className="w-full bg-white"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push('/journals')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Journals
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Having trouble with your payment?{' '}
            <Link href="/contact" className="text-emerald-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationPage;