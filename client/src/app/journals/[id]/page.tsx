"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Store
import useJournalStore from '@/store/useJournalStore';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/useCartStore';

// Icons & UI Components
import { 
  Calendar, Download, BookOpen, Eye, FileText, Tag, Copy, Clock, User, 
  Building, Award, Flag, ChevronRight, ExternalLink, Heart, Share2, Bookmark,
  Users, Check, Link2, Mail, Plus, MessageSquare, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Citation styles
const citationStyles = {
  apa: (journal: any) => {
    const author = journal?.author?.name || 'Unknown';
    const year = new Date(journal?.publicationDate || journal?.createdAt).getFullYear();
    return `${author}. (${year}). ${journal?.title}. Journal of Academic Research. doi: ${journal?.doi || 'N/A'}`;
  },
  mla: (journal: any) => {
    const author = journal?.author?.name || 'Unknown';
    const year = new Date(journal?.publicationDate || journal?.createdAt).getFullYear();
    return `${author}. "${journal?.title}." Journal of Academic Research, ${year}. doi: ${journal?.doi || 'N/A'}`;
  },
  chicago: (journal: any) => {
    const author = journal?.author?.name || 'Unknown';
    const year = new Date(journal?.publicationDate || journal?.createdAt).getFullYear();
    return `${author}. ${year}. "${journal?.title}." Journal of Academic Research. doi: ${journal?.doi || 'N/A'}`;
  }
};

const JournalDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { fetchJournalById, currentJournal, isLoading, error, fetchJournals, journals } = useJournalStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart, isSubmitting: isCartSubmitting } = useCartStore();
  const [hasPurchased, setHasPurchased] = useState(false);
  console.log(currentJournal, 'currentJournal');
  // UI states
  const [selectedCitation, setSelectedCitation] = useState('apa');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [activeTab, setActiveTab] = useState('abstract');
  
  // For likes/bookmarks (these would connect to real functionality later)
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // For PDF download tracking
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fetch journal data on component mount
  useEffect(() => {
    const journalId = parseInt(params?.id as string);
    if (!isNaN(journalId)) {
      fetchJournalById(journalId);
    }
  }, [params?.id, fetchJournalById]);
  
  // Fetch related journals when current journal loads
  useEffect(() => {
    if (currentJournal?.categoryId) {
      fetchJournals(1, 4, { category: currentJournal.categoryId });
    }
  }, [currentJournal?.categoryId, fetchJournals]);
  
  // Check if the user has purchased this journal
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (isAuthenticated && currentJournal) {
        try {
          // Make API call to check if journal is purchased
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nerdc-server.vercel.app'}/journals/check-purchase/${currentJournal.id}`, {
            credentials: 'include',
          });
          
          const data = await response.json();
          setHasPurchased(data.purchased);
        } catch (error) {
          console.error("Error checking purchase status:", error);
          setHasPurchased(false);
        }
      }
    };
    
    checkPurchaseStatus();
  }, [isAuthenticated, currentJournal]);
  
  // Handle citation copy
  const copyCitation = () => {
    if (!currentJournal) return;
    
    const citationText = citationStyles[selectedCitation as keyof typeof citationStyles](currentJournal);
    navigator.clipboard.writeText(citationText);
    toast.success('Citation copied to clipboard!');
  };
  
  // Updated download function with progress tracking
  const handleDownload = async () => {
    if (!currentJournal) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to download this journal');
      // Redirect to login or show login modal
      router.push('/signin');
      return;
    }
    
    // If it's a paid journal and user hasn't purchased
    if (currentJournal.price && typeof currentJournal.price === 'number' && currentJournal.price > 0) {
      // Redirect to checkout or add to cart
      toast.info('This journal requires purchase. Adding to cart...');
      // Implement add to cart functionality
      return;
    }
    
    // For free journals or if already purchased
    const url = currentJournal.pdfUrl;
    const filename = `${currentJournal.title.replace(/\s+/g, '-')}.pdf`;

    if (!url) {
      toast.error("No PDF URL available for download");
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Use fetch with a controller to be able to abort if needed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Fetch the PDF directly using the URL from database
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the total size for progress calculation
      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Create a reader from the response body
      const reader = response.body?.getReader();
      let receivedLength = 0;
      const chunks = [];
      
      // Process the data chunks
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Calculate and update progress
          if (total > 0) {
            const progress = Math.round((receivedLength / total) * 100);
            setDownloadProgress(progress);
          }
        }
      }
      
      // Concatenate the chunks into a single Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      // Create a blob from the array
      const blob = new Blob([chunksAll], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the object URL
      URL.revokeObjectURL(downloadUrl);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Download timed out. Please try again.");
      } else {
        toast.error("Failed to download PDF. Please try again.");
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };
  
  // Report issue
  const reportIssue = () => {
    toast.info('Report functionality will be implemented soon');
    // You would typically open a modal or redirect to a form
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
  
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };
  
  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentJournal) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to add this journal to your cart');
      router.push('/login');
      return;
    }
    
    const success = await addToCart(currentJournal.id);
    if (success) {
      toast.success('Journal added to cart');
    }
  };
  
  // Get related journals from the same category
  const getRelatedJournals = () => {
    if (!currentJournal || !journals.length) return [];
    
    return journals
      .filter(journal => 
        journal.id !== currentJournal.id && 
        journal.categoryId === currentJournal.categoryId &&
        journal.isPublished &&
        journal.reviewStatus === 'PUBLISHED'
      )
      .slice(0, 3);
  };
  
  // Truncate text helper
  const truncateText = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  };
  
  // Get related journals
  const relatedJournals = getRelatedJournals();
  
  // Get tag names array
  const tagNames = currentJournal?.tags ? currentJournal?.tags.map(t => t.tag.name) : [];
  
  // Format status badge
  const getStatusBadge = () => {
    switch(currentJournal?.reviewStatus) {
      case 'PUBLISHED':
        return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30">Published</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30">Under Review</Badge>;
      case 'DRAFT':
        return <Badge className="bg-slate-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-500/30">Draft</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-primary/20">{currentJournal?.reviewStatus}</Badge>;
    }
  };
  
  // Main content when journal is loaded
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white relative">
      {/* No custom background divs here - using globals.css background instead */}
      
      <motion.div 
        className="container max-w-6xl py-12 mx-auto space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Hero Section */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg p-6 md:p-10">
          {/* Category and Status */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentJournal?.category && (
              <Badge variant="outline" className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700">
                {currentJournal?.category?.name}
              </Badge>
            )}
            {getStatusBadge()}
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              <Eye className="h-3 w-3 mr-1" /> {currentJournal?.viewCount || 0} views
            </Badge>
          </div>
          
          {/* Title and Author */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900">
                {currentJournal?.title}
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-9 w-9 border border-emerald-100">
                  <AvatarImage src={currentJournal?.author?.profileImage || ''} alt={currentJournal?.author?.name || 'Author'} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600">
                    {currentJournal?.author?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/authors/${currentJournal?.authorId}`} className="font-medium hover:text-emerald-600 transition-colors">
                    {currentJournal?.author?.name || 'Anonymous'}
                  </Link>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(currentJournal?.publicationDate || currentJournal?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="md:col-span-1 flex flex-col md:items-end gap-2">
              <div className="flex gap-2 w-full md:w-auto">
              <Button 
                  onClick={hasPurchased ? handleDownload : handleAddToCart} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                size="lg"
                  disabled={isCartSubmitting || isDownloading}
              >
                  {isCartSubmitting || isDownloading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : hasPurchased ? (
                    <>
                <Download className="h-5 w-5" />
                      Download PDF
                    </>
                  ) : (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                      Add to Cart <span className="font-semibold">₦10,000</span>
                    </>
                  )}
              </Button>
              </div>
              
              <div className="flex gap-2 self-end">
                <Button variant="outline" size="icon" className="rounded-full border-gray-200 bg-white"
                  onClick={() => setIsBookmarked(!isBookmarked)}>
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-gray-200 bg-white"
                  onClick={() => setIsLiked(!isLiked)}>
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Main Content Grid: 2/3 for content, 1/3 for sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
            {/* Journal Cover/Preview */}
            {currentJournal?.thumbnailUrl && (
              <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-lg">
                <div className="relative h-72 sm:h-96 w-full">
                  <Image 
                    src={currentJournal.thumbnailUrl} 
                    alt={`Cover image for ${currentJournal.title}`}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/20 backdrop-blur-md text-white border-0">
                        {currentJournal.category?.name || 'Uncategorized'}
                      </Badge>
                      <div className="flex items-center gap-3 text-white">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{currentJournal.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content Tabs */}
            <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden shadow-lg">
              <Tabs defaultValue="abstract" className="w-full" onValueChange={setActiveTab}>
                <div className="border-b border-emerald-100">
                  <TabsList className="p-0 bg-transparent h-14 w-full flex justify-start rounded-none">
                    <TabsTrigger 
                      value="abstract" 
                      className="flex-1 data-[state=active]:bg-emerald-50 data-[state=active]:shadow-none rounded-none h-full text-gray-700 data-[state=active]:text-emerald-700"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Abstract
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="citation" 
                      className="flex-1 data-[state=active]:bg-emerald-50 data-[state=active]:shadow-none rounded-none h-full text-gray-700 data-[state=active]:text-emerald-700"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Citation
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="abstract" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                  <div className="space-y-6">
                    {/* Abstract Section */}
                    <div>
                      <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-emerald-700">
                        Abstract
                      </h2>
                      <div className="prose prose-emerald max-w-none">
                        <p className="text-gray-700">
                          {showFullAbstract 
                           ? (currentJournal?.abstract || '') 
                           : truncateText(currentJournal?.abstract || '', 500)}
                        </p>
                        {currentJournal?.abstract && currentJournal?.abstract.length > 500 && (
                          <Button 
                            variant="link" 
                            onClick={() => setShowFullAbstract(!showFullAbstract)}
                            className="px-0 mt-2 text-emerald-600"
                          >
                            {showFullAbstract ? 'Show less' : 'Read more'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Keywords/Tags Section */}
                    {currentJournal?.tags && currentJournal?.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-emerald-700">
                          <Tag className="h-4 w-4" />
                          Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {currentJournal?.tags.map((tagItem) => (
                            <Badge key={tagItem.tag.id} variant="secondary" className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                              #{tagItem.tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional content section if available */}
                    {currentJournal?.content && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-emerald-700">
                          <MessageSquare className="h-4 w-4" />
                          Additional Content
                        </h3>
                        <div className="prose prose-emerald max-w-none">
                          <p className="text-gray-700">{currentJournal?.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="citation" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-emerald-700">
                      Citation Information
                    </h2>
                    
                    {/* Citation format selector */}
                    <div className="bg-gray-50 border border-emerald-100 rounded-lg p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <Tabs defaultValue="apa" onValueChange={(value) => setSelectedCitation(value)} className="w-full sm:w-auto">
                          <TabsList className="bg-white border border-emerald-100">
                            <TabsTrigger value="apa">APA</TabsTrigger>
                            <TabsTrigger value="mla">MLA</TabsTrigger>
                            <TabsTrigger value="chicago">Chicago</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copyCitation}
                          className="gap-2 ml-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Citation
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <div className="p-4 bg-white rounded-lg border border-emerald-100 font-mono text-sm break-all text-gray-800">
                          {citationStyles[selectedCitation as keyof typeof citationStyles](currentJournal)}
                        </div>
                        <div className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center border border-white text-white text-xs font-medium">
                          {selectedCitation.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* DOI information if available */}
                      {currentJournal?.doi && (
                        <div className="mt-6 flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">DOI</Badge>
                          <code className="font-mono text-gray-700">{currentJournal?.doi}</code>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-emerald-600 hover:bg-emerald-50" 
                            onClick={() => {
                              navigator.clipboard.writeText(currentJournal?.doi || '');
                              toast.success('DOI copied to clipboard');
                            }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
          
          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Metadata Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-emerald-100 bg-white shadow-lg">
                <CardHeader className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                  <CardTitle className="text-lg font-semibold text-emerald-700">
                    Journal Information
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Publication Date</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(currentJournal?.publicationDate || currentJournal?.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">File Details</p>
                      <p className="text-sm text-gray-600">
                        PDF • {currentJournal?.pageCount ? `${currentJournal?.pageCount} pages` : 'Full document'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Eye className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Metrics</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {currentJournal?.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> {(currentJournal as any)?.downloadCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {currentJournal?.doi && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Link2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">DOI</p>
                        <p className="text-sm text-gray-600 font-mono break-all">
                          {currentJournal?.doi}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="px-5 py-4 border-t border-emerald-100 bg-emerald-50">
                  <div className="flex flex-col gap-2 w-full">
                  <Button 
                      onClick={hasPurchased ? handleDownload : handleAddToCart} 
                      className={`w-full gap-2 ${hasPurchased 
                        ? 'bg-emerald-700 hover:bg-emerald-800' 
                        : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                      disabled={isCartSubmitting || isDownloading}
                    >
                      {isCartSubmitting || isDownloading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          {isDownloading ? `${downloadProgress}%` : 'Processing...'}
                      </>
                      ) : hasPurchased ? (
                      <>
                    <Download className="h-5 w-5" />
                          Download PDF
                        </>
                      ) : (
                        <>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                            />
                          </svg>
                          Add to Cart • ₦10,000
                      </>
                    )}
                  </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
            
            {/* Author Information */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-emerald-100 bg-white shadow-lg">
                <CardHeader className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                  <CardTitle className="text-lg font-semibold text-emerald-700">
                    Author
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16 border border-emerald-100 shadow-md">
                      <AvatarImage src={currentJournal?.author?.profileImage || ''} alt={currentJournal?.author?.name || 'Author'} />
                      <AvatarFallback className="text-xl font-semibold bg-emerald-100 text-emerald-600">
                        {currentJournal?.author?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{currentJournal?.author?.name || 'Anonymous'}</h3>
                      {currentJournal?.author?.institution && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building className="h-3.5 w-3.5" />
                          {currentJournal?.author.institution}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {currentJournal?.author?.bio && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        {truncateText(currentJournal?.author.bio, 150)}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full gap-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700" asChild>
                      <Link href={`/authors/${currentJournal?.authorId}`}>
                        <User className="h-4 w-4" />
                        View Profile
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full gap-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700" asChild>
                      <Link href={`/journals?author=${currentJournal?.authorId}`}>
                        <FileText className="h-4 w-4" />
                        More Publications
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Report Issue */}
            <motion.div variants={itemVariants}>
              <Button 
                variant="ghost" 
                className="w-full gap-2 text-gray-500 hover:text-gray-700 hover:bg-emerald-50" 
                size="sm"
                onClick={reportIssue}
              >
                <Flag className="h-4 w-4" />
                Report an issue with this journal
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Related Journals Section */}
        {relatedJournals.length > 0 && (
          <motion.div variants={itemVariants} className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-emerald-700">Related Journals</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                <Link href={`/journals?category=${currentJournal?.categoryId}`}>
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedJournals.map((journal) => (
                <Card key={journal.id} className="group overflow-hidden border-emerald-100 bg-white shadow-md hover:shadow-lg transition-all duration-300">
                  <Link href={`/journals/${journal.id}`} className="block h-full">
                    {journal.thumbnailUrl && (
                      <div className="relative h-32 w-full overflow-hidden">
                        <Image 
                          src={journal.thumbnailUrl} 
                          alt={journal.title}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <CardHeader className={`px-4 py-3 ${journal.thumbnailUrl ? 'pt-2' : 'pt-4'}`}>
                      <CardTitle className="text-base line-clamp-2 text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {journal.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs mt-1 text-gray-600">
                        {truncateText(journal.abstract, 100)}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 text-xs text-gray-500 border-t border-emerald-50 flex justify-between">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {journal.author?.name || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(journal.publicationDate || journal.createdAt).split(' ')[0]}
                      </span>
                    </CardFooter>
                  </Link>
                </Card>
              ))}
              
              {relatedJournals.length < 3 && Array.from({ length: 3 - relatedJournals.length }).map((_, index) => (
                <Card key={`suggestion-${index}`} className="group overflow-hidden border-emerald-100 border-dashed bg-emerald-50/50 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Plus className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-medium text-gray-700">Discover More</h3>
                    <p className="text-xs text-gray-500 mt-1">Explore similar research in this field</p>
                    <Button variant="ghost" size="sm" className="mt-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                      <Link href="/journals">Browse Journals</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default JournalDetailsPage;
