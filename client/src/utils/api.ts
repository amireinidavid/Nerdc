import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Track failed refresh attempts to prevent loops
let refreshFailedRecently = false;
let refreshFailedTimeout: NodeJS.Timeout | null = null;

// Reset the refresh failed flag after 30 seconds
const resetRefreshFailed = () => {
  if (refreshFailedTimeout) {
    clearTimeout(refreshFailedTimeout);
  }
  refreshFailedTimeout = setTimeout(() => {
    refreshFailedRecently = false;
    refreshFailedTimeout = null;
  }, 30000); // 30 seconds
};

// Request interceptor to add token from localStorage if available
api.interceptors.request.use(
  (config) => {
    // Immediately pass through auth-related endpoints without token check
    if (config.url?.includes('/auth/login') || 
        config.url?.includes('/auth/register') || 
        config.url?.includes('/journals/public')) {
      return config;
    }
    
    // If in browser environment
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      
      // If token exists in localStorage and we're not adding it already
      if (accessToken && !config.headers['Authorization'] && !config.headers['Access-Token']) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        // Also add as a custom header for our server middleware
        config.headers['Access-Token'] = accessToken;
      }
      
      // For token refresh requests, include refresh token if available
      if (config.url?.includes('/auth/refresh-token')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          config.headers['Refresh-Token'] = refreshToken;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors and storing tokens from headers
api.interceptors.response.use(
  (response) => {
    // Check for tokens in headers
    if (typeof window !== 'undefined') {
      const accessToken = response.headers['access-token'];
      const refreshToken = response.headers['refresh-token'];
      
      // Store tokens in localStorage if they were sent in headers
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        console.log('Stored new access token');
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Stored new refresh token');
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle database connection errors (503 Service Unavailable)
    if (error.response?.status === 503 && 
        error.response?.data?.error === 'service_unavailable') {
      console.error('Database service unavailable:', error.response.data.message);
      
      // If this is a login attempt, show a specific error
      if (originalRequest.url?.includes('/auth/login')) {
        if (typeof window !== 'undefined') {
          // Alert the user about the database connection issue
          alert('Database service is currently unavailable. Please try again later.');
        }
        return Promise.reject(error);
      }
      
      // For other requests, just reject without triggering refresh attempts
      return Promise.reject(error);
    }
    
    // Check if this is a public endpoint that doesn't need authentication
    const isPublicEndpoint = originalRequest.url?.includes('/journals/public') || 
                            originalRequest.url?.includes('/auth/login') ||
                            originalRequest.url?.includes('/auth/register');
    
    // If public endpoint, just pass through the error
    if (isPublicEndpoint) {
      return Promise.reject(error);
    }
    
    // Avoid infinite retry loops and recent refresh failures
    if (originalRequest._retry || refreshFailedRecently) {
      return Promise.reject(error);
    }
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if we're already on login or refresh page
      if (typeof window !== 'undefined' && 
          (window.location.pathname === '/login' || 
           originalRequest.url?.includes('/auth/refresh-token'))) {
        return Promise.reject(error);
      }
      
      console.log('Token expired, attempting refresh');
      
      // Mark as retrying
      originalRequest._retry = true;
      
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.log('No refresh token available, cannot refresh');
          refreshFailedRecently = true;
          resetRefreshFailed();
          throw new Error('No refresh token available');
        }
        
        // Try to refresh
        const response = await api.post('/auth/refresh-token', { refreshToken });
        
        // Check for new tokens in headers
        const newAccessToken = response.headers['access-token'];
        const newRefreshToken = response.headers['refresh-token'];
        
        // Update localStorage if new tokens were provided
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Access-Token'] = newAccessToken;
          
          // Reset the failure flag on success
          refreshFailedRecently = false;
          if (refreshFailedTimeout) {
            clearTimeout(refreshFailedTimeout);
            refreshFailedTimeout = null;
          }
        }
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        console.log('Token refresh successful, retrying request');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Set flag to prevent repeated refresh attempts
        refreshFailedRecently = true;
        resetRefreshFailed();
        
        // Clear tokens and set auth state to unauthenticated
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // If on client side and not an API call or asset, redirect to login
          if (!originalRequest.url.startsWith('/api/') && 
              !originalRequest.url.includes('.') && 
              window.location.pathname !== '/login') {
            console.log('Redirecting to login due to authentication failure');
          window.location.href = '/login';
          }
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
    api.post('/auth/refresh-token')
      .then(response => {
        // Check if we received a 204 No Content response
        if (response.status === 204) {
          console.log('Refresh token not available or valid, silent failure');
          // Throw an error that will be caught by the caller
          throw new Error('Silent token refresh failure');
        }
        return response;
      }),
  
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
  
  // Get all published journals without authentication
  getPublishedJournals: (page = 1, limit = 10, filters = {}) => 
    api.get('/journals/public', { params: { page, limit, ...filters } }),
  
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
