import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark as retrying
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await api.post('/auth/refresh-token');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData: any) => 
    api.post('/auth/register', userData),
  
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  logout: () => 
    api.post('/auth/logout'),
  
  refreshToken: () => 
    api.post('/auth/refresh-token'),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
  
  updateProfile: (profileData: any) => 
    api.put('/auth/update-profile', profileData),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  requestPasswordReset: (email: string) => 
    api.post('/auth/request-password-reset', { email }),
  
  resetPassword: (token: string, newPassword: string) => 
    api.post('/auth/reset-password', { token, newPassword }),
};

// Profile API endpoints
export const profileAPI = {
  getProfile: () => 
    api.get('/profile/me'),
  
  completeProfile: (profileData: any) => 
    api.post('/profile/complete', profileData),
  
  updateProfile: (profileData: any) => 
    api.put('/profile/update', profileData),
  
  toggleResearcherStatus: (researcherData?: any) => 
    api.put('/profile/toggle-researcher', researcherData),
  
  // Admin endpoints
  getAllUsers: (page = 1, limit = 10, filters = {}) => 
    api.get('/profile/users', { params: { page, limit, ...filters } }),
  
  getUserById: (id: number) => 
    api.get(`/profile/users/${id}`),
  
  updateUser: (id: number, userData: any) => 
    api.put(`/profile/users/${id}`, userData),
};

// Journal API endpoints
export const journalAPI = {
  // Get journals with pagination and filtering
  getAllJournals: (page = 1, limit = 10, filters = {}) => 
    api.get('/journals/get', { params: { page, limit, ...filters } }),
  
  // Get a specific journal by ID
  getJournalById: (id: number) => 
    api.get(`/journals/get/${id}`),
  
  // Create a new journal (for authors)
  createJournal: (journalData: FormData) => 
    api.post('/journals', journalData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Update an existing journal
  updateJournal: (id: number, journalData: FormData) => 
    api.put(`/journals/update/${id}`, journalData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Delete a journal
  deleteJournal: (id: number) => 
    api.delete(`/journals/delete/${id}`),
  
  // Submit a journal for review
  submitForReview: (id: number) => 
    api.post(`/journals/submit/${id}`),
  
  // Admin: Review a journal
  reviewJournal: (id: number, reviewData: any) => 
    api.post(`/journals/review/${id}/review`, reviewData),
  
  // Admin: Get journals pending review
  getPendingReviews: (page = 1, limit = 10) => 
    api.get('/journals/pending-reviews', { params: { page, limit } }),
  
  // Get user's own journals
  getUserJournals: (page = 1, limit = 10, status?: string) => 
    api.get('/journals/my-journals', { params: { page, limit, status } }),
  
  // Save a journal for later reading
  saveJournal: (id: number) => 
    api.post(`/journals/save/${id}`),
  
  // Remove a journal from saved items
  unsaveJournal: (id: number) => 
    api.delete(`/journals/save/${id}`),
  
  // Get user's saved journals
  getSavedJournals: (page = 1, limit = 10) => 
    api.get('/journals/saved', { params: { page, limit } }),
  
  // Download a journal
  downloadJournal: (id: number) => 
    api.post(`/journals/download/${id}`),
  
  // Add a comment to a journal
  addComment: (id: number, content: string, parentId?: number) => 
    api.post(`/journals/comment/${id}`, { content, parentId }),
  
  // Admin: Get journal statistics
  getJournalStats: () => 
    api.get('/journals/journal-stats'),
  
  // View journal PDF in browser
  viewJournalPDF: (id: number) => 
    api.get(`/journals/get/${id}/view-pdf`),
};

// Subscription API endpoints
export const subscriptionAPI = {
  getPlans: () => 
    api.get('/subscriptions/plans'),
  
  getCurrentSubscription: () => 
    api.get('/subscriptions/current'),
  
  subscribe: (planId: number, paymentInfo: any) => 
    api.post('/subscriptions/subscribe', { planId, paymentInfo }),
  
  cancelSubscription: (subscriptionId: number) => 
    api.post(`/subscriptions/${subscriptionId}/cancel`),
};

// For direct API access
export default api;
