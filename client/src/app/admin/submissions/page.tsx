"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useJournalStore from '@/store/useJournalStore';
import { Container } from '@/components/ui/container';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
const SubmissionsPage = () => {
  const { 
    fetchPendingReviews, 
    pendingReviews, 
    pendingReviewsPagination, 
    isLoading 
  } = useJournalStore();
  const router = useRouter();
  const [fadeIn, setFadeIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPendingReviews(currentPage);
    
    // Animation delay
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchPendingReviews, currentPage]);

  const handlePageChange = (page: number) => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentPage(page);
    }, 300);
  };

  const handleReviewJournal = (id: number) => {
    router.push(`/admin/submissions/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20 pb-16">
      <Container>
        {/* Page Header */}
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold">Pending Submissions</h1>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="text-gray-400 mb-8">Review and manage journal submissions awaiting approval</p>
        </div>

        {/* Loading State */}
        {isLoading && !pendingReviews.length && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading submissions...</p>
          </div>
        )}

        {/* No Submissions State */}
        {!isLoading && !pendingReviews.length && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No pending submissions</h3>
            <p className="text-gray-400 max-w-md">There are currently no journals waiting for review. Check back later or visit the dashboard for other actions.</p>
          </div>
        )}

        {/* Submissions Grid */}
        {pendingReviews.length > 0 && (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {pendingReviews.map((journal) => (
              <div 
                key={journal.id}
                className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
              >
                {/* Journal Card Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full mb-2">
                        Pending Review
                      </span>
                      <h2 className="text-xl font-bold line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {journal.title}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Submitted {formatDistanceToNow(new Date(journal.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-400 line-clamp-3 mb-3">
                      {journal.abstract || "No abstract provided"}
                    </p>
                    
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full overflow-hidden mr-3">
                        {journal.author?.profileImage ? (
                          <Image
                            src={journal.author.profileImage} 
                            alt={journal.author.name}
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-700 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {journal.author?.name?.charAt(0).toUpperCase() || "A"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{journal.author?.name || "Unknown Author"}</p>
                        <p className="text-xs text-gray-500">{journal.author?.institution || "No institution provided"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {journal.category && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-400 mr-2">Category:</span>
                        <span className="text-sm bg-gray-700/50 px-2 py-0.5 rounded-md">
                          {journal.category.name}
                        </span>
                      </div>
                    )}
                    
                    {journal.tags && journal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {journal.tags.map((tagItem) => (
                          <span 
                            key={tagItem.tag.id}
                            className="text-xs bg-gray-700/30 text-gray-300 px-2 py-1 rounded-md"
                          >
                            {tagItem.tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-purple-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <button
                    onClick={() => handleReviewJournal(journal.id)}
                    className="transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
                  >
                    Review Submission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pendingReviewsPagination && pendingReviewsPagination.totalPages > 1 && (
          <div className={`flex justify-center mt-8 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                } transition-colors`}
              >
                Previous
              </button>
              
              {[...Array(pendingReviewsPagination.totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === index + 1
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  } transition-colors`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pendingReviewsPagination.totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === pendingReviewsPagination.totalPages
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                } transition-colors`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default SubmissionsPage;
