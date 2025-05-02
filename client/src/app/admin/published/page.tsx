"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useJournalStore from '@/store/useJournalStore';
import { Container } from '@/components/ui/container';
import { format } from 'date-fns';
import Image from 'next/image';

const PublishedJournalsPage = () => {
  const { 
    fetchJournals, 
    journals, 
    pagination, 
    isLoading 
  } = useJournalStore();
  const router = useRouter();
  const [fadeIn, setFadeIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('publicationDate');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Apply filter changes with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchJournals(currentPage, 10, {
      status: 'PUBLISHED',
      search: debouncedSearchTerm,
      category: selectedCategory,
      sortBy,
      sortOrder,
    });
    
    // Animation delay
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchJournals, currentPage, debouncedSearchTerm, selectedCategory, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentPage(page);
    }, 300);
  };

  const handleViewJournal = (id: number) => {
    router.push(`/journals/${id}`);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Default to desc when changing column
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20 pb-16">
      <Container>
        {/* Page Header */}
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold">Published Journals</h1>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="text-gray-400 mb-8">Browse and manage all published academic journals</p>

          {/* Filters */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, abstract, or author..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="1">Computer Science</option>
                  <option value="2">Biology</option>
                  <option value="3">Physics</option>
                  <option value="4">Mathematics</option>
                  <option value="5">Medicine</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="publicationDate">Publication Date</option>
                    <option value="title">Title</option>
                    <option value="viewCount">View Count</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 px-3 rounded-lg transition-colors flex items-center justify-center"
                    aria-label={sortOrder === 'desc' ? 'Sort ascending' : 'Sort descending'}
                  >
                    {sortOrder === 'desc' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !journals.length && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading published journals...</p>
          </div>
        )}

        {/* No Journals State */}
        {!isLoading && !journals.length && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No journals found</h3>
            <p className="text-gray-400 max-w-md">There are no published journals matching your search criteria. Try adjusting your filters or check back later.</p>
          </div>
        )}

        {/* Journals Table */}
        {journals.length > 0 && (
          <div className={`transition-all duration-700 delay-100 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-800/70 border-b border-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Journal</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 hidden md:table-cell">Author</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 hidden lg:table-cell">Category</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 hidden lg:table-cell">Views</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Published Date</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {journals.map((journal) => (
                    <tr 
                      key={journal.id} 
                      className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <h3 className="font-medium text-white line-clamp-1">{journal.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-1 mt-1 hidden sm:block">{journal.abstract}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
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
                          <span className="text-sm">{journal.author?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm hidden lg:table-cell">
                        <span className="bg-gray-700/50 px-2 py-1 rounded-md text-xs">
                          {journal.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm hidden lg:table-cell">
                        {journal.viewCount}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {format(new Date(journal.publicationDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleViewJournal(journal.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
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
                  
                  {[...Array(pagination.totalPages)].map((_, index) => (
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
                    disabled={currentPage === pagination.totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pagination.totalPages
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default PublishedJournalsPage; 