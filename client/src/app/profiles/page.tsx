"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import useAuthStore from '@/store/authStore';
import useProfileStore from '@/store/useProfileStore';

// Import UI components as needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Step type for our multi-step form
type FormStep = 'user-type' | 'basic-info' | 'contact-info' | 'researcher-info' | 'confirmation';

// Main component
const ProfileCompletionPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isProfileComplete } = useAuthStore();
  const { completeProfile, isLoading, error, clearError } = useProfileStore();

  // State for form steps
  const [currentStep, setCurrentStep] = useState<FormStep>('user-type');
  const [isResearcher, setIsResearcher] = useState(false);
  const [stepCompleted, setStepCompleted] = useState({
    'user-type': false,
    'basic-info': false,
    'contact-info': false,
    'researcher-info': false,
  });

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    name: user?.name || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
    
    // Contact info
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    website: '',
    linkedinUrl: '',
    twitterHandle: '',
    
    // Researcher-specific info
    institution: '',
    department: '',
    position: '',
    researchInterests: '',
    academicDegrees: '',
    orcidId: '',
    googleScholarId: '',
    researchGateUrl: '',
    publicationsCount: '',
    citationsCount: '',
    hIndex: '',
  });

  // Check if user is already authenticated and profile is complete
  useEffect(() => {
    // For production (Vercel), manually check localStorage for tokens
    const accessToken = localStorage.getItem('accessToken');
    
    // Don't redirect if we have tokens and we're in this page
    // This ensures the profile completion form is shown even in production
    if (accessToken) {
      console.log('Token found in localStorage, allowing profile completion');
      return;
    }
    
    // Only redirect if authenticated AND profile is already complete
    if (isAuthenticated && isProfileComplete()) {
      router.push('/dashboard');
    } else if (!isAuthenticated && !accessToken) {
      // If no tokens anywhere, redirect to login
      router.push('/login');
    }
  }, [isAuthenticated, isProfileComplete, router]);

  // Show toast when error changes
  useEffect(() => {
    if (error) {
      toast.error('Profile Update Failed', {
        description: error,
      });
      clearError();
    }
  }, [error, clearError]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Move to the next step
  const handleNext = () => {
    if (currentStep === 'user-type') {
      setStepCompleted(prev => ({ ...prev, 'user-type': true }));
      setCurrentStep('basic-info');
    } else if (currentStep === 'basic-info') {
      setStepCompleted(prev => ({ ...prev, 'basic-info': true }));
      setCurrentStep('contact-info');
    } else if (currentStep === 'contact-info') {
      setStepCompleted(prev => ({ ...prev, 'contact-info': true }));
      if (isResearcher) {
        setCurrentStep('researcher-info');
      } else {
        setCurrentStep('confirmation');
      }
    } else if (currentStep === 'researcher-info') {
      setStepCompleted(prev => ({ ...prev, 'researcher-info': true }));
      setCurrentStep('confirmation');
    }
  };

  // Move to the previous step
  const handleBack = () => {
    if (currentStep === 'basic-info') {
      setCurrentStep('user-type');
    } else if (currentStep === 'contact-info') {
      setCurrentStep('basic-info');
    } else if (currentStep === 'researcher-info') {
      setCurrentStep('contact-info');
    } else if (currentStep === 'confirmation') {
      if (isResearcher) {
        setCurrentStep('researcher-info');
      } else {
        setCurrentStep('contact-info');
      }
    }
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format data for API
      const profileData = {
        ...formData,
        // Convert string numbers to actual numbers for researcher metrics
        ...(isResearcher && {
          publicationsCount: formData.publicationsCount ? parseInt(formData.publicationsCount) : undefined,
          citationsCount: formData.citationsCount ? parseInt(formData.citationsCount) : undefined,
          hIndex: formData.hIndex ? parseInt(formData.hIndex) : undefined,
        }),
      };
      
      await completeProfile(profileData, isResearcher);
      
      toast.success('Profile Completed', {
        description: 'Your profile has been successfully completed.',
      });
      
      // Redirect to home page (/) instead of dashboard
      router.push('/');
    } catch (err) {
      console.error('Profile completion failed:', err);
    }
  };

  // Render the progress indicator
  const renderProgress = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center w-full max-w-3xl mx-auto">
          {['user-type', 'basic-info', 'contact-info', ...(isResearcher ? ['researcher-info'] : []), 'confirmation'].map((step, index) => (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step 
                    ? 'border-emerald-600 bg-emerald-600 text-white' 
                    : stepCompleted[step as keyof typeof stepCompleted] 
                      ? 'border-green-500 bg-green-500 text-white' 
                      : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {stepCompleted[step as keyof typeof stepCompleted] ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`mt-2 text-xs ${currentStep === step ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
                {step.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
          ))}
        </div>
        <div className="relative flex justify-between w-full max-w-3xl mt-2 mx-auto">
          {['user-type', 'basic-info', 'contact-info', ...(isResearcher ? ['researcher-info'] : []), 'confirmation'].map((step, index, array) => {
            if (index < array.length - 1) {
              const isCompleted = 
                stepCompleted[step as keyof typeof stepCompleted] || 
                currentStep === array[index + 1];
              
              return (
                <div 
                  key={`line-${index}`} 
                  className={`flex-1 h-1 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-200'}`}
                ></div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  // Render the step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'user-type':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Academic Community</h1>
              <p className="text-lg text-gray-600">Please select your account type to continue</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Regular User Option */}
              <motion.div 
                className={`relative overflow-hidden rounded-xl border-2 ${isResearcher ? 'border-gray-200' : 'border-emerald-500'} p-6 cursor-pointer transition-all hover:shadow-md bg-white`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsResearcher(false)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Regular User</h3>
                  <p className="text-gray-600">Access research journals, save favorites, and follow researchers in your field of interest.</p>
                  
                  <ul className="mt-4 space-y-2 text-left">
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Access to journal repository
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save and organize research
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Subscribe to updates
                    </li>
                  </ul>
                </div>
                
                {!isResearcher && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Researcher Option */}
              <motion.div 
                className={`relative overflow-hidden rounded-xl border-2 ${isResearcher ? 'border-emerald-500' : 'border-gray-200'} p-6 cursor-pointer transition-all hover:shadow-md bg-white`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsResearcher(true)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Researcher</h3>
                  <p className="text-gray-600">Publish your own research, participate in peer reviews, and build your academic profile.</p>
                  
                  <ul className="mt-4 space-y-2 text-left">
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All regular user features
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Publish your research
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Participate in peer review
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Academic credential showcase
                    </li>
                  </ul>
                </div>
                
                {isResearcher && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        );
        
      case 'basic-info':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Basic Information</h1>
              <p className="text-lg text-gray-600">Tell us a bit about yourself</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name*
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <Input
                    id="profileImage"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleChange}
                    placeholder="https://example.com/your-image.jpg"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                  {formData.profileImage && (
                    <div className="mt-2 relative w-20 h-20 rounded-full overflow-hidden">
                      <Image 
                        src={formData.profileImage}
                        alt="Profile preview"
                        fill
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      case 'contact-info':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h1>
              <p className="text-lg text-gray-600">How can others reach you?</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State or province"
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Postal or ZIP code"
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country"
                      className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mt-8">Social Profiles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/your-username"
                    className="bg-white border-gray-200"
                  />
                </div>
                
                <div>
                  <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter/X Handle
                  </label>
                  <Input
                    id="twitterHandle"
                    name="twitterHandle"
                    value={formData.twitterHandle}
                    onChange={handleChange}
                    placeholder="@yourusername"
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      
     case 'researcher-info':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Information</h1>
              <p className="text-lg text-gray-600">Tell us about your research experience</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                    Institution*
                  </label>
                  <Input
                    id="institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="University name"
                    required
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position/Title
                </label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g. Associate Professor"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <label htmlFor="researchInterests" className="block text-sm font-medium text-gray-700 mb-1">
                  Research Interests
                </label>
                <Textarea
                  id="researchInterests"
                  name="researchInterests"
                  value={formData.researchInterests}
                  onChange={handleChange}
                  placeholder="Brief description of your research areas"
                  rows={3}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="publicationsCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Publications
                  </label>
                  <Input
                    id="publicationsCount"
                    name="publicationsCount"
                    type="number"
                    value={formData.publicationsCount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="citationsCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Citations Count
                  </label>
                  <Input
                    id="citationsCount"
                    name="citationsCount"
                    type="number"
                    value={formData.citationsCount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="hIndex" className="block text-sm font-medium text-gray-700 mb-1">
                    h-index
                  </label>
                  <Input
                    id="hIndex"
                    name="hIndex"
                    type="number"
                    value={formData.hIndex}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="googleScholarId" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Scholar ID (optional)
                </label>
                <Input
                  id="googleScholarId"
                  name="googleScholarId"
                  value={formData.googleScholarId}
                  onChange={handleChange}
                  placeholder="Your Google Scholar ID"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <label htmlFor="orcidId" className="block text-sm font-medium text-gray-700 mb-1">
                  ORCID ID (optional)
                </label>
                <Input
                  id="orcidId"
                  name="orcidId"
                  value={formData.orcidId}
                  onChange={handleChange}
                  placeholder="Your ORCID ID"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          </motion.div>
        );
        
      case 'confirmation':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Almost Done!</h1>
              <p className="text-lg text-gray-600">Please review your information and submit</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-900">{isResearcher ? 'Researcher' : 'Regular User'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{formData.name || '–'}</p>
                  </div>
                  
                  {formData.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{formData.phone}</p>
                    </div>
                  )}
                </div>
                
                {formData.bio && (
                  <div>
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="font-medium text-gray-900">{formData.bio}</p>
                  </div>
                )}
                
                {(formData.address || formData.city || formData.state || formData.country) && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">
                      {[
                        formData.address,
                        formData.city,
                        formData.state,
                        formData.postalCode,
                        formData.country
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                
                {isResearcher && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Academic Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Institution</p>
                          <p className="font-medium text-gray-900">{formData.institution || '–'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium text-gray-900">{formData.department || '–'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Position</p>
                          <p className="font-medium text-gray-900">{formData.position || '–'}</p>
                        </div>
                      </div>
                      
                      {formData.researchInterests && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Research Interests</p>
                          <p className="font-medium text-gray-900">{formData.researchInterests}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                By clicking 'Complete Profile', you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  // Main component layout
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-emerald-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
            <div className="text-white text-sm">
              <span className="opacity-75">Step {currentStep === 'user-type' ? '1' : 
                currentStep === 'basic-info' ? '2' : 
                currentStep === 'contact-info' ? '3' : 
                currentStep === 'researcher-info' ? '4' : '5'} of {isResearcher ? '5' : '4'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator */}
        {renderProgress()}
        
        {/* Form */}
        <div className="max-w-3xl mx-auto bg-white shadow-xl shadow-emerald-900/5 rounded-xl p-8 border border-emerald-100">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
            
            {/* Form controls */}
            <div className="flex justify-between mt-8 pt-6 border-t border-emerald-100">
              {currentStep !== 'user-type' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Back
                </Button>
              ) : (
                <div></div> // Empty div for alignment
              )}
              
              {currentStep === 'confirmation' ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Continue
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;
