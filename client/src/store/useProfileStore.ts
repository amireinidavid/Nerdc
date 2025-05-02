import { create } from 'zustand';
import { profileAPI } from '@/utils/api';
import useAuthStore, { User, UserRole } from './authStore';

// Define profile-specific types
export type ProfileStatus = 'INCOMPLETE' | 'COMPLETE';

export interface ResearcherProfile {
  institution: string;
  department: string;
  position: string;
  researchInterests?: string;
  academicDegrees?: string;
  orcidId?: string;
  googleScholarId?: string;
  researchGateUrl?: string;
  publicationsCount?: number;
  citationsCount?: number;
  hIndex?: number;
}

export interface ProfileUser extends User {
  profileStatus: ProfileStatus;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  profileStatus?: ProfileStatus;
  search?: string;
}

interface ProfileState {
  isLoading: boolean;
  error: string | null;
  requiresProfileCompletion: boolean;
  users: ProfileUser[]; // For admin use
  usersPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  
  // Profile actions
  getProfile: () => Promise<ProfileUser | null>;
  completeProfile: (profileData: any, isResearcher?: boolean) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  toggleResearcherStatus: (researcherData?: ResearcherProfile) => Promise<void>;
  
  // Admin actions
  getUsers: (params?: AdminUserListParams) => Promise<void>;
  getUserById: (id: number) => Promise<ProfileUser | null>;
  updateUser: (id: number, userData: any) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  isProfileComplete: () => boolean;
  isResearcher: () => boolean;
}

const useProfileStore = create<ProfileState>()((set, get) => ({
  isLoading: false,
  error: null,
  requiresProfileCompletion: false,
  users: [],
  usersPagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  
  // Get the current user's profile
  getProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.getProfile();
      const profileData = response.data.data;
      
      // Update auth store with fresh user data
      useAuthStore.setState({ 
        user: profileData,
        isAuthenticated: true
      });
      
      set({ 
        isLoading: false,
        requiresProfileCompletion: profileData.profileStatus === 'INCOMPLETE'
      });
      
      return profileData;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch profile' 
      });
      return null;
    }
  },
  
  // Complete profile for new user
  completeProfile: async (profileData: any, isResearcher = false) => {
    try {
      set({ isLoading: true, error: null });
      
      // Add researcher flag to request
      const dataToSend = {
        ...profileData,
        isResearcher
      };
      
      const response = await profileAPI.completeProfile(dataToSend);
      const updatedProfile = response.data.data;
      
      // Update auth store with the updated user data
      useAuthStore.setState({ 
        user: updatedProfile,
        isAuthenticated: true 
      });
      
      set({ 
        isLoading: false,
        requiresProfileCompletion: false
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to complete profile' 
      });
      throw error;
    }
  },
  
  // Update existing profile
  updateProfile: async (profileData: any) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.updateProfile(profileData);
      const updatedProfile = response.data.data;
      
      // Update auth store with the updated user data
      const authStore = useAuthStore.getState();
      useAuthStore.setState({ 
        user: { ...authStore.user, ...updatedProfile }
      });
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      });
      throw error;
    }
  },
  
  // Toggle between researcher and regular user
  toggleResearcherStatus: async (researcherData?: ResearcherProfile) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.toggleResearcherStatus(researcherData);
      const updatedProfile = response.data.data;
      
      // Update auth store with the updated user data (role will change)
      useAuthStore.setState({ user: updatedProfile });
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to update researcher status' 
      });
      throw error;
    }
  },
  
  // Admin: Get list of users
  getUsers: async (params: AdminUserListParams = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.getAllUsers(
        params.page || 1, 
        params.limit || 10, 
        {
          role: params.role,
          profileStatus: params.profileStatus,
          search: params.search
        }
      );
      
      const { users, pagination } = response.data.data;
      
      set({ 
        users,
        usersPagination: pagination,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch users' 
      });
      throw error;
    }
  },
  
  // Admin: Get a user by ID
  getUserById: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.getUserById(id);
      const userData = response.data.data;
      
      set({ isLoading: false });
      
      return userData;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch user' 
      });
      return null;
    }
  },
  
  // Admin: Update a user
  updateUser: async (id: number, userData: any) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await profileAPI.updateUser(id, userData);
      
      // If the updated user is in the users list, update it
      set(state => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...response.data.data } : user
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to update user' 
      });
      throw error;
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Check if profile is complete
  isProfileComplete: () => {
    const user = useAuthStore.getState().user as ProfileUser | null;
    return user?.profileStatus === 'COMPLETE';
  },
  
  // Check if user is a researcher
  isResearcher: () => {
    const user = useAuthStore.getState().user;
    return user?.role === 'AUTHOR';
  }
}));

export default useProfileStore;
