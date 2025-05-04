"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useJournalStore from '@/store/useJournalStore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { toast } from 'react-hot-toast';
import { ReviewStatus } from '@/types/enums';

// Components and UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// PDF Preview component
const PDFViewer = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [viewMethod, setViewMethod] = useState<'direct' | 'pdfjs'>('direct');
  
  // Reset the iframe key to force a refresh
  const refreshViewer = () => {
    setError(false);
    setIframeKey(Date.now());
  };
  
  // Toggle the view method
  const toggleViewMethod = () => {
    setViewMethod(prev => prev === 'direct' ? 'pdfjs' : 'direct');
    setError(false);
    setIframeKey(Date.now());
  };
  
  // If no URL is provided
  if (!url) return (
    <div className="flex items-center justify-center h-[500px] bg-background/40 border border-purple-500/20 rounded-md">
      <p className="text-muted-foreground">No PDF available</p>
    </div>
  );
  
  // If there was an error loading the PDF
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[500px] bg-background/40 border border-purple-500/20 rounded-md">
      <p className="text-red-500 mb-2">Failed to load PDF preview</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <Button variant="outline" onClick={refreshViewer} className="border-purple-500/20">
          Try Again
        </Button>
        <Button variant="outline" onClick={toggleViewMethod} className="border-purple-500/20">
          Try Alternative Viewer
        </Button>
        <Button 
          variant="default" 
          onClick={() => window.open(url, '_blank')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Open in New Tab
        </Button>
      </div>
    </div>
  );
  
  // Use direct iframe for Cloudinary URLs
  if (viewMethod === 'direct') {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleViewMethod}
            className="bg-background/70 border-purple-500/30 text-xs"
          >
            Switch Viewer
          </Button>
        </div>
        <iframe 
          key={iframeKey}
          src={url}
          className="w-full h-[500px] border border-gray-200 rounded-md"
          onError={() => setError(true)}
        />
      </div>
    );
  }
  
  // PDF.js viewer as alternative
  const pdfViewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleViewMethod}
          className="bg-background/70 border-purple-500/30 text-xs"
        >
          Switch Viewer
        </Button>
      </div>
      <iframe 
        key={iframeKey}
        src={pdfViewerUrl}
        className="w-full h-[500px] border border-gray-200 rounded-md"
        onError={() => setError(true)}
      />
    </div>
  );
};

// Form schema
const reviewFormSchema = z.object({
  reviewStatus: z.enum([
    ReviewStatus.APPROVED,
    ReviewStatus.REJECTED,
    ReviewStatus.PUBLISHED,
  ]),
  reviewNotes: z.string().optional(),
  price: z.coerce.number()
    .min(0, { message: "Price cannot be negative" })
    .optional()
    .nullable(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const JournalReviewPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { 
    currentJournal,
    fetchJournalById,
    reviewJournal,
    isLoading,
    isSubmitting,
    error,
    clearErrors
  } = useJournalStore();

  console.log('====================================');
  console.log(currentJournal);
  console.log('====================================');

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      reviewStatus: ReviewStatus.APPROVED,
      reviewNotes: "",
      price: null,
    },
  });

  // Download PDF function
  const downloadPDF = async (url: string, filename: string) => {
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
      a.download = filename || 'journal.pdf';
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

  // Fetch journal data
  useEffect(() => {
    if (id) {
      fetchJournalById(parseInt(id as string));
    }
    return () => {
      clearErrors();
    };
  }, [id, fetchJournalById, clearErrors]);

  // Handle form submission
  const onSubmit = async (values: ReviewFormValues) => {
    if (!currentJournal) return;

    try {
      // Convert price to appropriate format for backend
      const processedValues = {
        ...values,
        // Convert price to number for submission
        price: values.price !== null ? values.price : undefined,
        isPublished: values.reviewStatus === ReviewStatus.PUBLISHED,
      };

      const result = await reviewJournal(currentJournal.id, processedValues);
      
      if (result) {
        toast.success(`Journal has been ${values.reviewStatus.toLowerCase()}`);
        router.push('/admin/submissions');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/admin/submissions')}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentJournal) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Journal Not Found</CardTitle>
            <CardDescription>The journal you're looking for doesn't exist or you don't have permission to access it.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/admin/submissions')}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 bg-gradient-to-b from-white to-emerald-50 min-h-screen text-gray-800 pt-20 pb-16 relative">
      {/* Subtle page-specific glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" aria-hidden="true" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Review Journal Submission</h1>
          <p className="text-gray-600 mt-1">Evaluate and provide feedback on this journal submission</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/submissions')}
            className="border-emerald-300 hover:bg-emerald-50 text-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Journal Details Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-emerald-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-800">
                <span>Journal Details</span>
                <Badge variant={
                  currentJournal.reviewStatus === "UNDER_REVIEW" ? "secondary" :
                  currentJournal.reviewStatus === "PUBLISHED" ? "default" :
                  currentJournal.reviewStatus === "REJECTED" ? "destructive" : "outline"
                }>
                  {currentJournal.reviewStatus.replace("_", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{currentJournal.title}</h3>
                <div className="flex flex-wrap items-center mt-2 text-sm text-gray-600">
                  <span>Submitted on {new Date(currentJournal.createdAt).toLocaleDateString()}</span>
                  <span className="mx-2 hidden sm:inline">•</span>
                  <span>Category: {currentJournal.category?.name || "Uncategorized"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-emerald-700">Abstract</h4>
                <p className="text-sm text-gray-600">{currentJournal.abstract}</p>
              </div>

              {currentJournal.content && (
                <div>
                  <h4 className="font-medium mb-2 text-emerald-700">Content</h4>
                  <div className="text-sm text-gray-600 max-h-64 overflow-y-auto border border-emerald-200 rounded-md p-3 bg-emerald-50/50">
                    {currentJournal.content}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2 text-emerald-700">Author Information</h4>
                <div className="flex items-center">
                  {currentJournal.author?.profileImage ? (
                    <img 
                      src={currentJournal.author.profileImage} 
                      alt={currentJournal.author.name} 
                      className="w-10 h-10 rounded-full mr-3 border border-emerald-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 border border-emerald-200">
                      {currentJournal.author?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{currentJournal.author?.name}</p>
                    <p className="text-sm text-gray-600">{currentJournal.author?.institution || 'No institution provided'}</p>
                  </div>
                </div>
              </div>

              {currentJournal.tags && currentJournal.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-emerald-700">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentJournal.tags.map((tagItem) => (
                      <Badge key={tagItem.tag.id} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {tagItem.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {currentJournal.doi && (
                <div>
                  <h4 className="font-medium mb-1 text-emerald-700">DOI</h4>
                  <p className="text-sm text-gray-600">{currentJournal.doi}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Document Card */}
          <Card className="border-emerald-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Journal Document</CardTitle>
              <CardDescription>Review the submitted PDF document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentJournal.pdfUrl ? (
                <div className="rounded-md border border-dashed border-emerald-300 p-8 text-center bg-emerald-50/50">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-emerald-500 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">No PDF Document</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This submission does not include a PDF document
                    </p>
                  </div>
                </div>
              ) : showPDFPreview ? (
                <div className="space-y-4">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPDFPreview(false)}
                      className="border-emerald-200 hover:bg-emerald-50 text-gray-800"
                    >
                      Hide Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => downloadPDF(
                        currentJournal.pdfUrl,
                        `${currentJournal.title.replace(/\s+/g, '-')}.pdf`
                      )}
                      disabled={isDownloading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Save to Local Computer
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="border border-emerald-200 rounded-lg overflow-hidden">
                    <PDFViewer url={currentJournal.pdfUrl} />
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-emerald-300 p-8 text-center bg-emerald-50/50">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-emerald-500 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">Document Preview</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Click the button below to preview the document or download it for review
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => setShowPDFPreview(true)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Preview PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => downloadPDF(
                          currentJournal.pdfUrl,
                          `${currentJournal.title.replace(/\s+/g, '-')}.pdf`
                        )}
                        disabled={isDownloading}
                        className="border-emerald-300 hover:bg-emerald-50 text-gray-800"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Downloading {downloadProgress}%
                          </>
                        ) : (
                          'Download PDF'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Form Column */}
        <div className="space-y-6">
          <Card className="border-emerald-200 bg-white shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle className="text-gray-800">Review Decision</CardTitle>
              <CardDescription>
                Provide your decision and feedback for this journal submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reviewStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Review Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-emerald-200 bg-white">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-emerald-200">
                            <SelectItem value={ReviewStatus.APPROVED}>Approve</SelectItem>
                            <SelectItem value={ReviewStatus.REJECTED}>Reject</SelectItem>
                            <SelectItem value={ReviewStatus.PUBLISHED}>Publish</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-gray-500">
                          Choose the appropriate status for this journal submission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reviewNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Review Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide feedback to the author..."
                            className="min-h-[120px] border-emerald-200 bg-white resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          These notes will be shared with the author
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-700">Price (₦)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                              ₦
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-8 border-emerald-200 bg-white"
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Set the price for this journal in Naira (₦) - required if publishing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JournalReviewPage;
