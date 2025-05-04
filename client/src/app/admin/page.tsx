"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useJournalStore from '@/store/useJournalStore';
import { Container } from '@/components/ui/container';

// Icons
const SubmissionsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ContributorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const JournalsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const ReviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const PublishedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 20V10"></path>
    <path d="M18 20V4"></path>
    <path d="M6 20v-6"></path>
  </svg>
);

const AdminPage = () => {
  const { fetchJournalStats, journalStats, isLoading } = useJournalStore();
  const router = useRouter();
  const [fadeIn, setFadeIn] = useState(false);
  console.log(journalStats);
  useEffect(() => {
    fetchJournalStats();
    
    // Animation delay
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchJournalStats]);

  // Quick links
  const quickLinks = [
    { 
      title: "Review Submissions", 
      description: "Evaluate pending journal submissions",
      icon: <ReviewIcon />,
      href: "/admin/submissions",
      color: "from-amber-400 to-orange-500",
    },
    { 
      title: "Upload Assessed", 
      description: "Upload reviewed journals with feedback",
      icon: <UploadIcon />,
      href: "/admin/upload-assessed",
      color: "from-emerald-400 to-teal-500",
    },
    { 
      title: "Manage Users", 
      description: "View and manage contributor accounts",
      icon: <UsersIcon />,
      href: "/admin/users",
      color: "from-sky-400 to-blue-500",
    },
    { 
      title: "View Published", 
      description: "Browse all published journals",
      icon: <PublishedIcon />,
      href: "/admin/published",
      color: "from-violet-400 to-purple-500",
    },
  ];

  // Placeholder data in case API doesn't return all needed values
  const stats = {
    totalJournals: journalStats?.journals?.totalJournals || 0,
    pendingSubmissions: (journalStats?.journals?.statusCounts?.find((s: any) => s.reviewStatus === 'UNDER_REVIEW')?._count || 0),
    recentSubmissions: journalStats?.journals?.recentSubmissions || 0,
    approvedSubmissions: (journalStats?.journals?.statusCounts?.find((s: any) => s.reviewStatus === 'PUBLISHED')?._count || 0),
    rejectedSubmissions: (journalStats?.journals?.statusCounts?.find((s: any) => s.reviewStatus === 'REJECTED')?._count || 0),
    contributorsCount: journalStats?.users?.totalAuthors || 0,
    publishedThisMonth: journalStats?.journals?.publishedJournals || 0,
    totalUsers: journalStats?.users?.totalUsers || 0,
    totalAuthors: journalStats?.users?.totalAuthors || 0, 
    totalRegularUsers: journalStats?.users?.totalRegularUsers || 0,
    totalAdmins: journalStats?.users?.totalAdmins || 0,
    newUsers: journalStats?.users?.newUsers || 0,
    activeAuthorsCount: journalStats?.users?.activeAuthorsCount || 0,
    totalDownloads: journalStats?.engagement?.totalDownloads || 0,
    totalComments: journalStats?.engagement?.totalComments || 0,
    categoriesCount: journalStats?.engagement?.categoriesWithJournalsCount || 0,
    mostViewed: journalStats?.mostViewed || [],
    mostDownloaded: journalStats?.mostDownloaded || [],
    topAuthors: journalStats?.topAuthors || [],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 text-gray-800 pt-20 pb-16">
      <Container>
        {/* Dashboard Header */}
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-3xl font-bold mb-1 text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mb-8">Overview of journal submissions and platform activity</p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 transition-all duration-700 delay-100 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Submissions Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">Total Submissions</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.totalJournals}</h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <p className="text-xs text-amber-600">Recent</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.recentSubmissions}</p>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <p className="text-xs text-emerald-600">Published</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.approvedSubmissions}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg">
                    <p className="text-xs text-red-600">Rejected</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.rejectedSubmissions}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <SubmissionsIcon />
              </div>
            </div>
          </div>

          {/* Contributors Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">Contributors</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.contributorsCount}</h2>
                <p className="text-gray-600 mt-4 text-sm">Total registered authors and researchers on the platform</p>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <ContributorsIcon />
              </div>
            </div>
          </div>

          {/* Published This Month */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">Published This Month</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.publishedThisMonth}</h2>
                <p className="text-gray-600 mt-4 text-sm">New journals published in the current month</p>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <JournalsIcon />
              </div>
            </div>
          </div>
          
          {/* Engagement Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">Engagement</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.totalDownloads}</h2>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-xs text-blue-600">Comments</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.totalComments}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <p className="text-xs text-purple-600">Categories</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.categoriesCount}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* User Statistics Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">User Statistics</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.totalUsers}</h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <p className="text-xs text-indigo-600">Authors</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.totalAuthors}</p>
                  </div>
                  <div className="bg-pink-50 p-2 rounded-lg">
                    <p className="text-xs text-pink-600">Regular</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.totalRegularUsers}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <p className="text-xs text-yellow-600">New</p>
                    <p className="text-xl font-semibold text-gray-800">{isLoading ? "..." : stats.newUsers}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Active Authors Card */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 font-medium mb-1">Active Authors</p>
                <h2 className="text-3xl font-bold text-gray-800">{isLoading ? "..." : stats.activeAuthorsCount}</h2>
                <p className="text-gray-600 mt-4 text-sm">Authors who have published at least one article</p>
              </div>
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Authors and Popular Content */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 transition-all duration-700 delay-200 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Top Authors */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Authors</h2>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading...</div>
            ) : (
              <div className="space-y-4">
                {stats.topAuthors.slice(0, 5).map((author: any, index: number) => (
                  <div key={author.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-medium text-gray-800">{author.name || "Anonymous"}</h3>
                        <p className="text-sm text-gray-500">{author.institution || "No institution"}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50 px-3 py-1 rounded-full text-emerald-700">
                      {author.publicationCount} publications
                    </div>
                  </div>
                ))}
                {stats.topAuthors.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No author data available</div>
                )}
              </div>
            )}
          </div>
          
          {/* Most Viewed Content */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Most Viewed Content</h2>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading...</div>
            ) : (
              <div className="space-y-4">
                {stats.mostViewed.slice(0, 5).map((journal: any, index: number) => (
                  <div key={journal.id} className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-medium text-gray-800">{journal.title.length > 40 ? `${journal.title.substring(0, 40)}...` : journal.title}</h3>
                        <p className="text-sm text-gray-500">By {journal.author?.name || "Anonymous"}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      {journal.viewCount}
                    </div>
                  </div>
                ))}
                {stats.mostViewed.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No view data available</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className={`transition-all duration-700 delay-200 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => router.push(link.href)}
                className="bg-white border border-emerald-100 hover:border-emerald-300 backdrop-blur-sm p-5 rounded-xl transition-all duration-300 hover:shadow-lg group text-left"
              >
                <div className={`bg-gradient-to-br ${link.color} p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {link.icon}
                </div>
                <h3 className="font-medium text-lg mb-1 text-gray-800">{link.title}</h3>
                <p className="text-gray-600 text-sm">{link.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AdminPage;
