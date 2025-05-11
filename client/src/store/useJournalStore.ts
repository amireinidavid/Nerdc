import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { journalAPI } from '@/utils/api';
import { sendJournalPublishedNotification } from "@/utils/emailService";

// Journal types
export interface Journal {
  id: number;
  title: string;
  abstract: string;
  content: string;
  pdfUrl: string;
  thumbnailUrl?: string | null;
  publicationDate: string;
  doi?: string | null;
  viewCount: number;
  isSaved?: boolean;
  pageCount?: number | null;
  price?: number | null;
  isPublished: boolean;
  reviewStatus: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'REVISIONS_NEEDED';
  authorId: number;
  categoryId: number;
  reviewerId?: number | null;
  reviewNotes?: string | null;
  reviewDate?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    name: string;
    email?: string;
    institution?: string;
    profileImage?: string;
    bio?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  tags?: Array<{
    tag: {
      id: number;
      name: string;
    }
  }>;
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  journalId: number;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    profileImage?: string;
  };
  replies?: Comment[];
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

interface FilterOptions {
  category?: number;
  status?: string;
  search?: string;
  authorId?: number;
  tags?: number[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface JournalState {
  // Journal lists
  journals: Journal[];
  userJournals: Journal[];
  savedJournals: { journal: Journal }[];
  pendingReviews: Journal[];
  
  // Single journal
  currentJournal: Journal | null;
  
  // UI states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Pagination and filters
  pagination: Pagination;
  userJournalsPagination: Pagination;
  savedJournalsPagination: Pagination;
  pendingReviewsPagination: Pagination;
  filters: FilterOptions;
  
  // Stats (admin)
  journalStats: any;
  
  // Actions
  fetchJournals: (page?: number, limit?: number, filters?: FilterOptions) => Promise<void>;
  fetchPublishedJournals: (page?: number, limit?: number, filters?: FilterOptions) => Promise<void>;
  fetchJournalById: (id: number) => Promise<void>;
  createJournal: (journalData: FormData) => Promise<Journal | null>;
  updateJournal: (id: number, journalData: FormData) => Promise<Journal | null>;
  deleteJournal: (id: number) => Promise<boolean>;
  submitForReview: (id: number) => Promise<Journal | null>;
  reviewJournal: (id: number, reviewData: any) => Promise<Journal | null>;
  fetchPendingReviews: (page?: number, limit?: number) => Promise<void>;
  fetchUserJournals: (page?: number, limit?: number, status?: string) => Promise<void>;
  saveJournal: (id: number) => Promise<boolean>;
  unsaveJournal: (id: number) => Promise<boolean>;
  fetchSavedJournals: (page?: number, limit?: number) => Promise<void>;
  addComment: (journalId: number, content: string, parentId?: number) => Promise<Comment | null>;
  fetchJournalStats: () => Promise<void>;
  clearErrors: () => void;
  resetCurrentJournal: () => void;
  reviewJournalWithNotification: (journalId: number, reviewData: any) => Promise<{ success: boolean; data: Journal | null; error?: string }>;
}

const defaultPagination = {
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  hasMore: false,
};

const useJournalStore = create<JournalState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        journals: [],
        userJournals: [],
        savedJournals: [],
        pendingReviews: [],
        currentJournal: null,
        isLoading: false,
        isSubmitting: false,
        error: null,
        pagination: defaultPagination,
        userJournalsPagination: defaultPagination,
        savedJournalsPagination: defaultPagination,
        pendingReviewsPagination: defaultPagination,
        filters: {},
        journalStats: null,
        
        // Fetch all journals with pagination and filtering
        fetchJournals: async (page = 1, limit = 10, filters = {}) => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getAllJournals(page, limit, filters);
            set({ 
              journals: response.data.data,
              pagination: response.data.pagination,
              filters,
              isLoading: false
            });
          } catch (error: any) {
            console.error('Error fetching journals:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch journals', 
              isLoading: false 
            });
          }
        },
        
        // Fetch all published journals without authentication
        fetchPublishedJournals: async (page = 1, limit = 10, filters = {}) => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getPublishedJournals(page, limit, filters);
            set({ 
              journals: response.data.data,
              pagination: response.data.pagination,
              filters,
              isLoading: false
            });
          } catch (error: any) {
            console.error('Error fetching published journals:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch journals', 
              isLoading: false 
            });
          }
        },
        
        // Fetch a single journal by ID
        fetchJournalById: async (id: number) => {
          try {
            set({ isLoading: true, error: null, currentJournal: null });
            const response = await journalAPI.getJournalById(id);
            set({ currentJournal: response.data.data, isLoading: false });
          } catch (error: any) {
            console.error('Error fetching journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch journal', 
              isLoading: false 
            });
          }
        },
        
        // Create a new journal
        createJournal: async (journalData: FormData) => {
          try {
            set({ isSubmitting: true, error: null });
            const response = await journalAPI.createJournal(journalData);
            // Update user journals list if it's loaded
            if (get().userJournals.length > 0) {
              set(state => ({
                userJournals: [response.data.data, ...state.userJournals],
              }));
            }
            set({ isSubmitting: false });
            return response.data.data;
          } catch (error: any) {
            console.error('Error creating journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to create journal', 
              isSubmitting: false 
            });
            return null;
          }
        },
        
        // Update an existing journal
        updateJournal: async (id: number, journalData: FormData) => {
          try {
            set({ isSubmitting: true, error: null });
            const response = await journalAPI.updateJournal(id, journalData);
            // Update user journals list if it's loaded
            set(state => ({
              userJournals: state.userJournals.map(journal => 
                journal.id === id ? response.data.data : journal
              ),
              currentJournal: state.currentJournal?.id === id ? 
                response.data.data : state.currentJournal,
            }));
            set({ isSubmitting: false });
            return response.data.data;
          } catch (error: any) {
            console.error('Error updating journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to update journal', 
              isSubmitting: false 
            });
            return null;
          }
        },
        
        // Delete a journal
        deleteJournal: async (id: number) => {
          try {
            set({ isSubmitting: true, error: null });
            await journalAPI.deleteJournal(id);
            // Remove from user journals list if it's loaded
            set(state => ({
              userJournals: state.userJournals.filter(journal => journal.id !== id),
              currentJournal: state.currentJournal?.id === id ? null : state.currentJournal,
            }));
            set({ isSubmitting: false });
            return true;
          } catch (error: any) {
            console.error('Error deleting journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to delete journal', 
              isSubmitting: false 
            });
            return false;
          }
        },
        
        // Submit a journal for review
        submitForReview: async (id: number) => {
          try {
            set({ isSubmitting: true, error: null });
            const response = await journalAPI.submitForReview(id);
            // Update user journals list if it's loaded
            set(state => ({
              userJournals: state.userJournals.map(journal => 
                journal.id === id ? response.data.data : journal
              ),
              currentJournal: state.currentJournal?.id === id ? 
                response.data.data : state.currentJournal,
            }));
            set({ isSubmitting: false });
            return response.data.data;
          } catch (error: any) {
            console.error('Error submitting journal for review:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to submit journal for review', 
              isSubmitting: false 
            });
            return null;
          }
        },
        
        // Review a journal (admin)
        reviewJournal: async (id: number, reviewData: any) => {
          try {
            set({ isSubmitting: true, error: null });
            const response = await journalAPI.reviewJournal(id, reviewData);
            // Update pending reviews list if it's loaded
            set(state => ({
              pendingReviews: state.pendingReviews.filter(journal => journal.id !== id),
              currentJournal: state.currentJournal?.id === id ? 
                response.data.data : state.currentJournal,
            }));
            set({ isSubmitting: false });
            return response.data.data;
          } catch (error: any) {
            console.error('Error reviewing journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to review journal', 
              isSubmitting: false 
            });
            return null;
          }
        },
        
        // Fetch journals pending review (admin)
        fetchPendingReviews: async (page = 1, limit = 10) => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getPendingReviews(page, limit);
            set({ 
              pendingReviews: response.data.data,
              pendingReviewsPagination: response.data.pagination,
              isLoading: false 
            });
          } catch (error: any) {
            console.error('Error fetching pending reviews:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch pending reviews', 
              isLoading: false 
            });
          }
        },
        
        // Fetch user's own journals
        fetchUserJournals: async (page = 1, limit = 10, status) => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getUserJournals(page, limit, status);
            
            if (response.data.success) {
              set({ 
                userJournals: response.data.data,
                userJournalsPagination: response.data.pagination,
                isLoading: false 
              });
            } else {
              throw new Error(response.data.message || 'Failed to fetch your journals');
            }
          } catch (error: any) {
            console.error('Error fetching user journals:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch your journals', 
              isLoading: false 
            });
          }
        },
        
        // Save a journal for later reading
        saveJournal: async (id: number) => {
          try {
            set({ isSubmitting: true, error: null });
            await journalAPI.saveJournal(id);
            set({ isSubmitting: false });
            return true;
          } catch (error: any) {
            console.error('Error saving journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to save journal', 
              isSubmitting: false 
            });
            return false;
          }
        },
        
        // Unsave a journal
        unsaveJournal: async (id: number) => {
          try {
            set({ isSubmitting: true, error: null });
            await journalAPI.unsaveJournal(id);
            // Remove from saved journals list if it's loaded
            set(state => ({
              savedJournals: state.savedJournals.filter(item => item.journal.id !== id)
            }));
            set({ isSubmitting: false });
            return true;
          } catch (error: any) {
            console.error('Error unsaving journal:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to remove saved journal', 
              isSubmitting: false 
            });
            return false;
          }
        },
        
        // Fetch user's saved journals
        fetchSavedJournals: async (page = 1, limit = 10) => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getSavedJournals(page, limit);
            set({ 
              savedJournals: response.data.data,
              savedJournalsPagination: response.data.pagination,
              isLoading: false 
            });
          } catch (error: any) {
            console.error('Error fetching saved journals:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch saved journals', 
              isLoading: false 
            });
          }
        },
        
        // Add a comment to a journal
        addComment: async (journalId: number, content: string, parentId?: number) => {
          try {
            set({ isSubmitting: true, error: null });
            const response = await journalAPI.addComment(journalId, content, parentId);
            // Update comments in current journal
            if (get().currentJournal?.id === journalId) {
              const newComment = response.data.data;
              set(state => {
                if (!state.currentJournal) return state;
                
                let updatedComments = [...(state.currentJournal.comments || [])];
                
                if (parentId) {
                  // Add to replies if it's a nested comment
                  updatedComments = updatedComments.map(comment => {
                    if (comment.id === parentId) {
                      return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment]
                      };
                    }
                    return comment;
                  });
                } else {
                  // Add as a top-level comment
                  updatedComments.push(newComment);
                }
                
                return {
                  currentJournal: {
                    ...state.currentJournal,
                    comments: updatedComments
                  }
                };
              });
            }
            set({ isSubmitting: false });
            return response.data.data;
          } catch (error: any) {
            console.error('Error adding comment:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to add comment', 
              isSubmitting: false 
            });
            return null;
          }
        },
        
        // Fetch journal statistics (admin)
        fetchJournalStats: async () => {
          try {
            set({ isLoading: true, error: null });
            const response = await journalAPI.getJournalStats();
            set({ journalStats: response.data.data, isLoading: false });
          } catch (error: any) {
            console.error('Error fetching journal statistics:', error);
            set({ 
              error: error.response?.data?.message || 'Failed to fetch journal statistics', 
              isLoading: false 
            });
          }
        },
        
        // Utility functions
        clearErrors: () => set({ error: null }),
        resetCurrentJournal: () => set({ currentJournal: null }),
        
        /**
         * Review and update a journal's status, sending email notification if published
         * @param journalId - The ID of the journal to review
         * @param reviewData - The review data (status, notes, etc.)
         * @returns Promise with the result of the review operation
         */
        reviewJournalWithNotification: async (journalId: number, reviewData: any) => {
          set({ isSubmitting: true, error: null });
          try {
            // Use the existing API method instead of manual fetch with incorrect URL
            const response = await journalAPI.reviewJournal(journalId, reviewData);
            const data = response.data;

            if (!data.success) {
              throw new Error(data.message || "Failed to review journal");
            }

            set({ isSubmitting: false });
            
            // If the journal was published, send an email notification
            if (
              reviewData.reviewStatus === "PUBLISHED" ||
              (reviewData.isPublished && reviewData.reviewStatus)
            ) {
              const journal = data.data;
              
              console.log("Journal author data:", journal?.author);
              
              // Check if we have author information needed for the notification
              if (journal?.author) {
                // Log the exact author data we're working with
                console.log("Author email data:", {
                  email: journal.author.email,
                  name: journal.author.name,
                  emailType: typeof journal.author.email,
                  nameType: typeof journal.author.name
                });
                
                if (journal.author.email && typeof journal.author.email === 'string' && journal.author.email.trim() !== '') {
                  try {
                    const emailResult = await sendJournalPublishedNotification(
                      journal.author.email,
                      journal.author.name || 'Author',
                      journal.title || 'Your Journal',
                      journal.id
                    );
                    
                    if (!emailResult.success) {
                      console.warn(`Email notification failed: ${emailResult.error}`);
                      // You might want to display this error in your UI
                    } else {
                      console.log("Email notification sent successfully");
                    }
                  } catch (emailError) {
                    console.error("Failed to send email notification:", emailError);
                    // Continue with the journal review process even if email fails
                  }
                } else {
                  console.warn("Could not send publication notification: Invalid or missing author email", journal.author.email);
                }
              } else {
                console.warn("Could not send publication notification: Author information is completely missing");
              }
            }

            return { success: true, data: data.data as Journal };
          } catch (error) {
            console.error("Error reviewing journal:", error);
            set({
              isSubmitting: false,
              error: error instanceof Error ? error.message : "Failed to review journal",
            });
            return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),
      {
        name: 'journal-store',
        partialize: (state) => ({
          // Only persist these fields
          journals: state.journals,
          currentJournal: state.currentJournal,
          filters: state.filters,
        }),
      }
    )
  )
);

export default useJournalStore;
