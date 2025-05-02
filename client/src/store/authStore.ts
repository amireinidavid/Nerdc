import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/utils/api';

// Define user types
export type UserRole = 'USER' | 'AUTHOR' | 'ADMIN';
export type ProfileStatus = 'INCOMPLETE' | 'COMPLETE';

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  profileStatus: ProfileStatus;
  profileImage: string | null;
  bio: string | null;
  institution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  planId: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: {
    id: number;
    name: string;
    price: number;
    duration: number;
    features: string;
  };
}

// Define auth store state and actions
interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresProfileCompletion: boolean;
  shouldAttemptRefresh: boolean; // Flag to control refresh attempts
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  hasActiveSubscription: () => boolean;
  isProfileComplete: () => boolean;
  isResearcher: () => boolean;
  isAdmin: () => boolean;
  disableRefreshAttempts: () => void; // New function to disable refresh attempts
}

// Create the store with persist middleware
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      subscription: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresProfileCompletion: false,
      shouldAttemptRefresh: true, // Default to true
      
      // Login action
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.login(email, password);
          const userData = response.data.data.user;
          
          set({ 
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            requiresProfileCompletion: userData.profileStatus === 'INCOMPLETE',
            shouldAttemptRefresh: true // Reset on successful login
          });
          
          // Fetch user profile with additional data like subscriptions
          get().fetchUserProfile();
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Login failed' 
          });
          throw error;
        }
      },
      
      // Register action
      register: async (userData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.register(userData);
          const newUser = response.data.data.user;
          const requiresCompletion = response.data.data.requiresProfileCompletion;
          
          set({ 
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            requiresProfileCompletion: requiresCompletion || newUser.profileStatus === 'INCOMPLETE',
            shouldAttemptRefresh: true // Reset on successful register
          });
          
          return requiresCompletion;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Registration failed' 
          });
          throw error;
        }
      },
      
      // Logout action
      logout: async () => {
        try {
          set({ isLoading: true });
          
          await authAPI.logout();
          
          set({ 
            user: null,
            subscription: null,
            isAuthenticated: false,
            isLoading: false,
            requiresProfileCompletion: false,
            shouldAttemptRefresh: false // Disable refresh attempts on logout
          });
        } catch (error: any) {
          set({ 
            isLoading: false,
            // Even if logout fails on the server, we clear the user data
            user: null,
            subscription: null,
            isAuthenticated: false,
            requiresProfileCompletion: false,
            shouldAttemptRefresh: false // Disable refresh attempts on logout
          });
        }
      },
      
      // Fetch user profile
      fetchUserProfile: async () => {
        // Don't attempt if we've explicitly disabled refresh attempts
        if (!get().shouldAttemptRefresh) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.getCurrentUser();
          const userData = response.data.data;
          
          set({ 
            user: userData,
            subscription: userData.subscriptions?.[0] || null,
            isAuthenticated: true,
            isLoading: false,
            requiresProfileCompletion: userData.profileStatus === 'INCOMPLETE'
          });
        } catch (error: any) {
          // If 401, user is not authenticated
          if (error.response?.status === 401) {
            set({ 
              user: null,
              subscription: null,
              isAuthenticated: false,
              isLoading: false,
              requiresProfileCompletion: false,
              shouldAttemptRefresh: false // Disable refresh attempts on auth failure
            });
          } else {
            set({ 
              isLoading: false, 
              error: error.response?.data?.message || 'Failed to fetch user profile' 
            });
          }
        }
      },
      
      // Change password
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await authAPI.changePassword(currentPassword, newPassword);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Failed to change password' 
          });
          throw error;
        }
      },
      
      // Request password reset
      requestPasswordReset: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await authAPI.requestPasswordReset(email);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Failed to request password reset' 
          });
          throw error;
        }
      },
      
      // Reset password
      resetPassword: async (token: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await authAPI.resetPassword(token, newPassword);
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Failed to reset password' 
          });
          throw error;
        }
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Disable refresh attempts
      disableRefreshAttempts: () => {
        set({ shouldAttemptRefresh: false });
      },
      
      // Check if user has active subscription
      hasActiveSubscription: () => {
        const { subscription } = get();
        return subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date();
      },
      
      // Check if profile is complete
      isProfileComplete: () => {
        const { user } = get();
        return user?.profileStatus === 'COMPLETE';
      },
      
      // Check if user is a researcher (AUTHOR role)
      isResearcher: () => {
        const { user } = get();
        return user?.role === 'AUTHOR';
      },
      
      // Check if user is an admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN';
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        // Don't persist everything, only what's necessary to restore a session
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        shouldAttemptRefresh: state.shouldAttemptRefresh, // Persist this flag
      }),
    }
  )
);

export default useAuthStore;
