'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import useJournalStore from '@/store/useJournalStore';
import { JournalsList, mapStoreJournalToCard } from '@/components/journal/journal-card';
import { toast } from 'sonner';

// Status filter options based on ReviewStatus enum
const statusFilters = [
  { label: "All", value: "all" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
];

const MyJournalsPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { 
    userJournals, 
    fetchUserJournals, 
    isLoading: journalsLoading, 
    saveJournal, 
    unsaveJournal 
  } = useJournalStore();

  const [isClient, setIsClient] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // If user is authenticated, fetch their journals
    if (user) {
      fetchUserJournals();
    }
  }, [user, fetchUserJournals]);

  // Filter journals based on search query and status filter
  const filteredJournals = userJournals.filter(journal => {
    // Filter by status
    if (activeFilter !== "all" && journal.reviewStatus !== activeFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return (
        journal.title.toLowerCase().includes(query) ||
        journal.abstract.toLowerCase().includes(query) ||
        journal.content?.toLowerCase().includes(query) ||
        journal.author?.name.toLowerCase().includes(query) ||
        journal.category?.name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Toggle save/unsave journal
  const handleToggleSave = async (id: number) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const journal = userJournals.find(j => j.id === id);
      if (journal) {
        if (journal.isSaved) {
          await unsaveJournal(id);
          toast.success('Journal removed from saved items');
        } else {
          await saveJournal(id);
          toast.success('Journal saved successfully');
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error('Failed to update saved status');
    } finally {
      setIsSaving(false);
    }
  };

  // Wait for auth to load before deciding what to show
  if (!isClient || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // If not authenticated, show access denied screen
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200
            }}
            className="mb-8"
          >
            <svg 
              className="w-20 h-20 mx-auto text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 11l3-3m0 0l3 3m-3-3v8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.071 19.071a9.937 9.937 0 01-14.142 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 1 }}
              />
            </svg>
          </motion.div>

          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Access Restricted
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            You don't have permission to view this page. Please log in to access your journals.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Link 
              href="/login" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Log In Now
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Calculate stats
  const statCounts = {
    total: userJournals.length,
    published: userJournals.filter(j => j.reviewStatus === "PUBLISHED").length,
    inReview: userJournals.filter(j => j.reviewStatus === "UNDER_REVIEW").length,
    drafts: userJournals.filter(j => j.reviewStatus === "DRAFT").length
  };

  // Authenticated user view
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header with stats */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-emerald-100"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Research Papers</h1>
              <p className="text-gray-600 text-lg">Manage and track your academic publications</p>
            </div>
            <Link
              href="/my-journals/create"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-500/20 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Submit New Paper
            </Link>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Papers", value: statCounts.total, icon: "📝" },
              { label: "Published", value: statCounts.published, icon: "📊" },
              { label: "In Review", value: statCounts.inReview, icon: "⏳" },
              { label: "Drafts", value: statCounts.drafts, icon: "📋" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-md"
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{stat.icon}</div>
                  <div>
                    <div className="text-emerald-700 font-medium">{stat.label}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Filters and search */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-md border border-emerald-100">
            {/* Status filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
              {statusFilters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeFilter === filter.value
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Search input */}
            <div className="relative w-full lg:w-64">
              <input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Journals list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {journalsLoading ? (
            <div className="flex justify-center my-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <JournalsList 
              journals={filteredJournals}
              toggleSave={handleToggleSave}
              isAuthenticated={true}
              variant="default"
            />
          )}
        </motion.div>
        
        {/* Empty state */}
        {!journalsLoading && filteredJournals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-emerald-100 shadow-md"
          >
            <svg className="h-20 w-20 text-emerald-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No journals found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {activeFilter !== "all" || searchQuery
                ? "Try adjusting your search or filters"
                : "Start your research journey by submitting your first paper"}
            </p>
            {activeFilter === "all" && !searchQuery && (
              <Link 
                href="/myjournals/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg shadow-emerald-500/10 text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Your First Paper
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyJournalsPage;
