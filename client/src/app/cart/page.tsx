"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Store
import useCartStore from '@/store/useCartStore';
import useAuthStore from '@/store/authStore';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Download, FileText, ShoppingCart, Tags, Trash2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CartPage = () => {
  const { 
    cart, 
    isLoading, 
    error, 
    fetchCart, 
    removeFromCart, 
    clearCart, 
    getCheckoutInfo, 
    handleRemitaRedirect,
    isSubmitting 
  } = useCartStore();
  
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);

  // Fetch cart on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      router.push('/login?redirect=/cart');
    }
  }, [isAuthenticated, fetchCart, router]);

  // Handle remove item from cart
  const handleRemoveItem = async (itemId: number) => {
    await removeFromCart(itemId);
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed with checkout');
      router.push('/login?redirect=/cart');
      return;
    }

    try {
      setRedirectingToPayment(true);
      // Get redirect URL for Remita payment
      const redirectUrl = await handleRemitaRedirect();
      
      if (redirectUrl) {
        // Redirect to Remita payment page
        window.location.href = redirectUrl;
      } else {
        toast.error('Failed to generate payment link. Please try again.');
        setRedirectingToPayment(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout. Please try again.');
      setRedirectingToPayment(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!cart || !cart.items.length) return 0;
    
    // Each journal is ₦10,000
    return cart.items.length * 10000;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }
    }
  };

  // Empty cart state
  if (!isLoading && (!cart || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/journals" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue shopping
            </Link>
          </div>
          
          <div className="bg-white shadow-md rounded-xl border border-emerald-100 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-emerald-500 opacity-80" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Your cart is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any journals to your cart yet. Browse our collection to find journals that interest you.
            </p>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
              onClick={() => router.push('/journals')}
            >
              Browse Journals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center text-sm">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/journals" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue shopping
            </Link>
          </div>
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="bg-white shadow-md rounded-xl border border-emerald-100 p-8 text-center">
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => fetchCart()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main cart content
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/journals" className="flex items-center text-sm text-emerald-600 hover:text-emerald-700">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Continue shopping
          </Link>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Cart Items - Left Side */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-800">Your Cart <span className="text-emerald-600">({cart?.items.length || 0})</span></h1>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCart}
                disabled={!cart?.items.length || isSubmitting}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
            
            {/* Cart Items */}
            <div className="space-y-4">
              {cart?.items.map((item) => (
                <motion.div 
                  key={item.id}
                  variants={itemVariants}
                  className="bg-white rounded-lg border border-emerald-100 shadow-sm overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row p-4 gap-4">
                    {/* Journal Thumbnail */}
                    <div className="w-full sm:w-36 h-24 sm:h-36 overflow-hidden rounded-md bg-emerald-50 flex-shrink-0">
                      {item.journal.thumbnailUrl ? (
                        <Image 
                          src={item.journal.thumbnailUrl} 
                          alt={item.journal.title}
                          width={144}
                          height={144}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-10 w-10 text-emerald-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Journal Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                          {item.journal.title}
                        </h3>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">₦10,000.00</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.journal.abstract || "No abstract available"}
                      </p>
                      
                      {item.journal.category && (
                        <div className="flex items-center gap-2">
                          <Tags className="h-3.5 w-3.5 text-gray-500" />
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {item.journal.category.name}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-emerald-600 hover:text-emerald-700"
                          onClick={() => router.push(`/journals/${item.journal.id}`)}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Order Summary - Right Side */}
          <motion.div variants={itemVariants}>
            <Card className="sticky top-4 border-emerald-100 bg-white shadow-md">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50 pb-4">
                <CardTitle className="text-emerald-700">Order Summary</CardTitle>
                <CardDescription>Review your order details</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart?.items.length} items)</span>
                    <span className="font-medium text-gray-800">₦{calculateTotal().toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assessment Fee</span>
                    <span className="font-medium text-gray-800">₦10,000 per journal</span>
                  </div>
                </div>
                
                <Separator className="bg-emerald-100" />
                
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">Total</span>
                  <span className="font-bold text-lg text-emerald-700">₦{calculateTotal().toLocaleString()}</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">
                    By proceeding to checkout, you agree to pay the assessment fee for each journal submission.
                  </p>
                  
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={!cart?.items.length || isSubmitting || redirectingToPayment}
                  >
                    {redirectingToPayment ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirecting to REMITA Portal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Continue to REMITA Payment Portal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter className="bg-emerald-50 border-t border-emerald-100 flex flex-col items-start px-6 py-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Important Payment Instructions:</strong>
                </p>
                <ol className="text-xs text-gray-500 list-decimal pl-4 space-y-1">
                  <li>You will be redirected to the REMITA payment portal</li>
                  <li>Select <strong>FGN: FEDERAL GOVERNMENT OF NIGERIA</strong> as the biller</li>
                  <li>For service/purpose, select <strong>NERDC Journal Publication</strong></li>
                  <li>Enter the amount: ₦{calculateTotal().toLocaleString()}</li>
                  <li>Fill in your personal details and complete the payment</li>
                  <li>You will be redirected back to our site after payment</li>
                </ol>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CartPage;
