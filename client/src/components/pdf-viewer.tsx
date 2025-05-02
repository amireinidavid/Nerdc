"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure pdf.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  maxPages?: number;
}

const PDFViewer = ({ pdfUrl, maxPages = 3 }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = () => {
    setError(true);
    setLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(prevPageNumber + offset, 1), 
      numPages ? Math.min(numPages, maxPages) : 1));
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-background/40 border border-white/10 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500 mb-2">Failed to load PDF</p>
          <p className="text-sm text-muted-foreground">The PDF document could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
        className="w-full"
      >
        {loading ? null : (
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="w-full flex justify-center"
            scale={1.2}
          />
        )}
      </Document>

      {numPages && numPages > 0 && (
        <div className="flex items-center justify-between w-full mt-4 max-w-md mx-auto">
          <Button 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <p className="text-sm">
            {pageNumber} of {Math.min(numPages, maxPages)} 
            {numPages > maxPages && ` (Preview - ${numPages} total pages)`}
          </p>
          
          <Button 
            onClick={nextPage} 
            disabled={pageNumber >= Math.min(numPages, maxPages)}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 