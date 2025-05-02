"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Journal as StoreJournal } from '@/store/useJournalStore';

export interface Journal {
  id: number;
  title: string;
  abstract: string;
  authorName?: string;
  authorInstitution?: string;
  publishedDate?: string;
  readTime?: string;
  thumbnailUrl?: string | null;
  isSaved?: boolean;
  reviewStatus: string;
  author?: {
    id: number;
    name: string;
    institution?: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

// Helper function to transform data
export const mapStoreJournalToCard = (storeJournal: StoreJournal): Journal => {
  console.log('Mapping store journal to card:', storeJournal);
  return {
    ...storeJournal,
    authorName: storeJournal.author?.name || 'Anonymous',
    authorInstitution: storeJournal.author?.institution || '',
    category: storeJournal.category || { id: 0, name: 'Uncategorized' },
    publishedDate: storeJournal.publicationDate || storeJournal.createdAt,
    readTime: storeJournal.pageCount ? `${Math.max(5, Math.ceil(storeJournal.pageCount / 2))} min read` : '5 min read',
    // Use a default image if none is provided
    thumbnailUrl: storeJournal.thumbnailUrl || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  };
};

interface JournalCardProps {
  journal: Journal;
  toggleSave?: (id: number) => void;
  isAuthenticated?: boolean;
  priority?: boolean;
  variant?: 'default' | 'featured' | 'compact';
  index?: number; // For staggered animations
}

export const JournalCard = ({ 
  journal,
  toggleSave,
  isAuthenticated = false,
  priority = false,
  variant = 'default',
  index = 0
}: JournalCardProps) => {
  // Log individual journal details
  console.log(`Journal card #${index} details:`, {
    id: journal.id,
    title: journal.title,
    abstract: journal.abstract?.substring(0, 50) + '...',
    reviewStatus: journal.reviewStatus,
    author: journal.author,
    authorName: journal.authorName,
    thumbnailUrl: journal.thumbnailUrl,
    isSaved: journal.isSaved,
    category: journal.category
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize handlers for performance
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleImageLoad = useCallback(() => setIsLoaded(true), []);
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave?.(journal.id);
  }, [journal.id, toggleSave]);

  // Format date
  const formattedDate = journal.publishedDate ? new Date(journal.publishedDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : 'Unknown date';

  // Fallback image for when the thumbnail fails to load
  const fallbackImageUrl = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80';

  // Animation variants - simplified for performance
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3), // Cap delay for better performance with many items
        ease: [0.22, 1, 0.36, 1]
      }
    },
    hover: {
      y: -4, // Reduced movement for better performance
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Star button animation variants - simplified
  const starVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 }, // Reduced scale for performance
    tap: { scale: 0.95 },
    saved: { 
      scale: [1, 1.2, 1], // Reduced scale values
      transition: { 
        duration: 0.3,
        times: [0, 0.5, 1]
      }
    }
  };

  // Get the appropriate classnames based on variant
  const getCardClasses = () => {
    switch(variant) {
      case 'featured':
        return 'col-span-2 grid grid-cols-1 md:grid-cols-2 h-full max-h-[400px]';
      case 'compact':
        return 'h-[280px] sm:h-[300px]';
      default:
        return 'h-full';
    }
  };

  // Use actual author info or defaults
  const authorName = journal.authorName || (journal.author?.name || 'Anonymous');
  const authorInstitution = journal.authorInstitution || (journal.author?.institution || '');
  const category = journal.category?.name || 'Uncategorized';
  const readTime = journal.readTime || '5 min read';

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-white/[0.07] to-transparent backdrop-blur-sm border group ${getCardClasses()}`}
      style={{
        borderColor: isHovered ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1), 0 0 10px 1px rgba(99, 102, 241, 0.15)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={cardVariants}
      layout="position"
    >
      {/* Animated gradient border effect - only render when hovered for performance */}
      {isHovered && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-indigo-400/20 to-blue-500/20 opacity-100 transition-opacity duration-500"
          style={{
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)'
          }}
        />
      )}
      
      {/* Image container - different layouts based on variant */}
      <div className={`
        relative overflow-hidden 
        ${variant === 'featured' 
            ? 'h-48 md:h-full rounded-t-xl md:rounded-l-xl md:rounded-tr-none' 
            : variant === 'compact' 
              ? 'h-28 sm:h-32' 
              : 'h-40 sm:h-48'}
        ${variant === 'featured' ? 'col-span-1' : ''}`}
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={isHovered ? {scale: 1.05} : {scale: 1}}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Image
            src={imageError || !journal.thumbnailUrl ? fallbackImageUrl : journal.thumbnailUrl}
            alt={journal.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-all duration-300 ${isLoaded ? 'blur-0' : 'blur-sm scale-105'}`}
            priority={priority}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={priority ? 'eager' : 'lazy'}
          />
        </motion.div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        
        {/* Category Badge with animated glow - simplified hover effect */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full bg-indigo-600 blur ${isHovered ? 'opacity-60' : 'opacity-0'} transition-opacity duration-300`} />
            <div className="relative px-2 sm:px-3 py-1 text-xs font-medium text-white rounded-full bg-indigo-600/90">
              {category}
            </div>
          </div>
        </div>
        
        {/* Review Status Badge */}
        {journal.reviewStatus && (
          <div className="absolute top-2 sm:top-4 right-10 sm:right-14 z-10">
            <div className={cn(
              "px-2 py-1 text-xs font-medium rounded-md shadow-sm",
              journal.reviewStatus === "PUBLISHED" && "bg-emerald-500/90 text-white",
              journal.reviewStatus === "UNDER_REVIEW" && "bg-blue-500/90 text-white",
              journal.reviewStatus === "DRAFT" && "bg-gray-500/90 text-white",
              journal.reviewStatus === "REJECTED" && "bg-red-500/90 text-white",
              journal.reviewStatus === "REVISIONS_NEEDED" && "bg-amber-500/90 text-white"
            )}>
              {journal.reviewStatus === "PUBLISHED" && "Published"}
              {journal.reviewStatus === "UNDER_REVIEW" && "In Review"}
              {journal.reviewStatus === "DRAFT" && "Draft"}
              {journal.reviewStatus === "REJECTED" && "Rejected"}
              {journal.reviewStatus === "REVISIONS_NEEDED" && "Needs Revision"}
            </div>
          </div>
        )}
        
        {/* Save Button - conditionally rendered to improve performance */}
        {isAuthenticated && toggleSave && (
          <motion.button
            onClick={handleSaveClick}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/60 transition-colors"
            whileHover="hover"
            whileTap="tap"
            animate={journal.isSaved ? "saved" : "initial"}
            variants={starVariants}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={journal.isSaved ? "currentColor" : "none"} 
              stroke={journal.isSaved ? "none" : "currentColor"}
              className={`w-4 h-4 sm:w-5 sm:h-5 ${journal.isSaved ? 'text-yellow-400' : 'text-white'}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.181.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.18-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </motion.button>
        )}
        
        {/* Date and Read Time for non-featured variants */}
        {variant !== 'featured' && (
          <div className="absolute bottom-1 sm:bottom-2 left-2 sm:left-4 right-2 sm:right-4 flex justify-between text-xs text-white/80 z-10">
            <span>{formattedDate}</span>
            <span>{readTime}</span>
          </div>
        )}
      </div>
      
      {/* Content container - different layouts based on variant */}
      <div className={`
        ${variant === 'featured' 
          ? 'col-span-1 p-4 sm:p-6 flex flex-col justify-between' 
          : 'p-3 sm:p-5'}
        ${variant === 'compact' ? 'h-[calc(100%-8rem)]' : 'flex-1'}`}
      >
        {/* Title with animated color transition */}
        <h3 
          className={`font-bold text-white mb-2 sm:mb-3 ${
            variant === 'featured' 
              ? 'text-xl sm:text-2xl' 
              : 'text-lg sm:text-xl'
          } line-clamp-2`}
          style={{
            color: isHovered ? 'rgb(129, 140, 248)' : 'rgb(255, 255, 255)',
            transition: 'color 0.3s ease'
          }}
        >
          {journal.title}
        </h3>
        
        {/* Abstract text */}
        <p className={`text-white/70 text-xs sm:text-sm mb-3 sm:mb-4 ${variant === 'compact' ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {journal.abstract}
        </p>
        
        {/* Date and Read Time for featured variant */}
        {variant === 'featured' && (
          <div className="flex justify-between text-xs text-white/80 mb-3 sm:mb-4">
            <span>{formattedDate}</span>
            <span>{readTime}</span>
          </div>
        )}
        
        {/* Author info */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm mr-2 sm:mr-3">
              {authorName.charAt(0)}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-white">{authorName}</p>
              <p className="text-xs text-white/60">{authorInstitution}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover overlay with read button - only render when needed for performance */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-indigo-900/80 backdrop-blur-sm z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Link 
                href={`/journals/${journal.id}`} 
                className="relative group/button"
              >
                <span className="absolute inset-0 rounded-lg bg-indigo-500 blur-md group-hover/button:blur-lg transition-all duration-300 opacity-70"></span>
                <span className="relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-indigo-800 bg-white rounded-lg group-hover/button:bg-white/90 transition-colors">
                View Details
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/button:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Export a list component that uses the cards
export const JournalsList = React.memo(({ 
  journals, 
  toggleSave,
  isAuthenticated,
  variant = 'default'
}: { 
  journals: Journal[] | StoreJournal[]; 
  toggleSave?: (id: number) => void;
  isAuthenticated?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}) => {
  // Log all journals received
  console.log('JournalsList received journals:', journals);
  
  // Format journals to ensure they have the correct structure
  const formattedJournals: Journal[] = journals.map(journal => {
    // Check if it's already a card-compatible journal
    if ('authorName' in journal || !('author' in journal)) {
      return journal as Journal;
    }
    // Otherwise convert from StoreJournal to Journal
    return mapStoreJournalToCard(journal as StoreJournal);
  });

  // Log formatted journals
  console.log('Formatted journals for display:', formattedJournals);
  
  if (formattedJournals.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <h3 className="text-xl font-semibold mb-2">No journals found</h3>
        <p className="text-white/70">Try adjusting your search or filters</p>
      </div>
    );
  }
  
  if (variant === 'featured' && formattedJournals.length >= 3) {
    // Featured layout - First item is featured (larger), rest are in grid
    const [featuredJournal, ...restJournals] = formattedJournals;
    
    return (
      <div className="space-y-6 sm:space-y-8">
        <JournalCard 
          journal={featuredJournal} 
          toggleSave={toggleSave}
          isAuthenticated={isAuthenticated}
          priority
          variant="featured"
          index={0}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {restJournals.map((journal, idx) => (
            <JournalCard 
              key={journal.id} 
              journal={journal} 
              toggleSave={toggleSave}
              isAuthenticated={isAuthenticated}
              variant="default"
              index={idx + 1}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Default grid layout
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {formattedJournals.map((journal, idx) => (
        <JournalCard 
          key={journal.id} 
          journal={journal} 
          toggleSave={toggleSave}
          isAuthenticated={isAuthenticated}
          variant={variant}
          index={idx}
        />
      ))}
    </div>
  );
});

JournalsList.displayName = 'JournalsList'; // For React.memo debugging 