"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { Journal, JournalsList } from '@/components/journal/journal-card';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useJournalStore from '@/store/useJournalStore';

// Separate client component that uses useSearchParams
const JournalsContent = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { journals: allJournals, fetchJournals, isLoading: journalsLoading } = useJournalStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize state from URL params for bookmarkable filters
  const [searchQuery, setSearchQuery] = useState(() => 
    searchParams?.get("q") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(() => 
    searchParams?.get("category") || "All Categories"
  );
  const [displayVariant, setDisplayVariant] = useState<'default' | 'featured'>(() => 
    (searchParams?.get("view") as 'default' | 'featured') || 'default'
  );
  
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update URL when filters change (for shareable/bookmarkable URLs)
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    
    if (selectedCategory !== "All Categories") {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }
    
    if (displayVariant !== "default") {
      params.set("view", displayVariant);
    } else {
      params.delete("view");
    }
    
    const newParams = params.toString();
    const url = pathname + (newParams ? `?${newParams}` : '');
    router.replace(url, { scroll: false });
  }, [searchQuery, selectedCategory, displayVariant, pathname, router, searchParams]);

  // Fetch journals on component mount
  useEffect(() => {
    const loadJournals = async () => {
      setIsLoading(true);
      await fetchJournals();
      setIsLoading(false);
    };
    
    loadJournals();
  }, [fetchJournals]);

  // Update journals state when the store data changes
  useEffect(() => {
    // Filter to only include published journals from the store
    const publishedJournals = allJournals.filter(journal => 
      journal.reviewStatus === "PUBLISHED" && journal.isPublished === true
    );
    setJournals(publishedJournals);
  }, [allJournals]);

  // Update the filteredJournals memoization to handle category properly
  const filteredJournals = useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch = !searchQuery || 
        journal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        journal.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (journal.author?.name && journal.author.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All Categories" || 
        (journal.category && journal.category.name === selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [journals, searchQuery, selectedCategory]);

  // Update categories from actual data - fixed to ensure they're all strings
  const categories = useMemo(() => {
    // Start with "All Categories"
    const allCategories = ["All Categories"];
    
    // Add categories from journals, ensuring they're valid strings
    journals.forEach(journal => {
      if (journal.category && journal.category.name) {
        if (!allCategories.includes(journal.category.name)) {
          allCategories.push(journal.category.name);
        }
      }
    });
    
    return allCategories;
  }, [journals]);

  // Debounced search handler
  const debouncedSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const searchInput = document.getElementById('search-input') as HTMLInputElement;
      if (searchInput) {
        debouncedSearch(searchInput.value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Toggle saved status with optimistic update
  const toggleSaveJournal = useCallback((id: number) => {
    setJournals(prevJournals => 
      prevJournals.map(journal => 
        journal.id === id 
          ? { ...journal, isSaved: !journal.isSaved } 
          : journal
      )
    );
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Handle display variant change
  const handleVariantChange = useCallback((variant: 'default' | 'featured') => {
    setDisplayVariant(variant);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements - only render on larger screens for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <motion.div 
            className="absolute -top-40 -right-40 w-60 md:w-80 h-60 md:h-80 bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 20, 0],
              y: [0, -30, 0],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 20,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-40 -left-40 w-60 md:w-80 h-60 md:h-80 bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ 
              repeat: Infinity,
              duration: 25,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500 mb-4 sm:mb-6">
              Explore Research Journals
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
              Discover cutting-edge research papers from leading academics and institutions around the world.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Input
                id="search-input"
                type="text"
                placeholder="Search journals by title, author, or keywords..."
                className="w-full py-2 sm:py-3 px-4 sm:px-5 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-lg shadow-sm"
                defaultValue={searchQuery}
                aria-label="Search journals"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Category Pills - scrollable container on mobile */}
          <div className="overflow-x-auto pb-2 mb-6 sm:mb-8 md:mb-12 -mx-4 sm:mx-0 px-4 sm:px-0">
            <motion.div 
              className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 min-w-max sm:min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {categories.map((category, index) => {
                return (
                  <motion.button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: Math.min(0.1 + (index * 0.03), 0.3) // Cap the delay for better performance
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {category}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
          
          {/* View Controls */}
          <div className="flex justify-end items-center mb-6 sm:mb-8">
            {/* Display Variant Selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVariantChange('featured')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${displayVariant === 'featured' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title="Featured View"
                aria-label="Switch to featured view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleVariantChange('default')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${displayVariant === 'default' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title="Grid View"
                aria-label="Switch to grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-20"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-emerald-200/20 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading journals...</p>
              </div>
            </motion.div>
          ) : (
                <motion.div
              key="journals-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <JournalsList 
                    journals={filteredJournals} 
                    toggleSave={toggleSaveJournal} 
                    isAuthenticated={isAuthenticated}
                    variant={displayVariant}
                  />
                </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

// Main page component with Suspense boundary
const JournalsPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-200/20 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading journals...</p>
        </div>
      </div>
    }>
      <JournalsContent />
    </Suspense>
  );
};

export default JournalsPage;
