import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'sonner';

// Define cart item type
export interface CartItem {
  id: number;
  cartId: number;
  journalId: number;
  price: number;
  createdAt: string;
  journal: {
    id: number;
    title: string;
    thumbnailUrl?: string;
    abstract: string;
    price?: number;
    categoryId: number;
    category?: {
      name: string;
    };
  };
}

// Define cart type
export interface Cart {
  id: number;
  userId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

// Define payment checkout info type
export interface CheckoutInfo {
  cart: Cart;
  payment: {
    merchantId: string;
    publicPortalUrl: string;
    orderId: string;
    amount: number;
    payerName: string;
    payerEmail: string;
    payerPhone?: string;
    description: string;
    returnUrl: string;
    portalRequestData: {
      serviceName: string;
      amount: number;
      payerName: string;
      payerEmail: string;
      payerPhone?: string;
      orderId: string;
    }
  };
}

// Define cart store state and actions
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  checkoutInfo: CheckoutInfo | null;
  
  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (journalId: number) => Promise<boolean>;
  removeFromCart: (cartItemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getCheckoutInfo: () => Promise<CheckoutInfo | null>;
  handleRemitaRedirect: () => Promise<string>;
  resetCartStore: () => void;
  clearErrors: () => void;
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nerdc-server.vercel.app';

// Create and export the store
const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  checkoutInfo: null,

  // Fetch the user's active cart
  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        set({ cart: response.data.cart });
      } else {
        set({ error: response.data.message || 'Failed to fetch cart' });
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'An error occurred while fetching your cart' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a journal to cart
  addToCart: async (journalId: number) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await axios.post(
        `${API_URL}/cart/add`,
        { journalId },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        set({ cart: response.data.cart });
        toast.success('Journal added to cart');
        return true;
      } else {
        set({ error: response.data.message || 'Failed to add to cart' });
        toast.error(response.data.message || 'Failed to add to cart');
        return false;
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while adding to cart';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Remove an item from cart
  removeFromCart: async (cartItemId: number) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await axios.delete(
        `${API_URL}/cart/item/${cartItemId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        set({ cart: response.data.cart });
        toast.success('Item removed from cart');
        return true;
      } else {
        set({ error: response.data.message || 'Failed to remove item' });
        toast.error(response.data.message || 'Failed to remove item');
        return false;
      }
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while removing item';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Clear the cart
  clearCart: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await axios.delete(
        `${API_URL}/cart/clear`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        set({ cart: response.data.cart });
        toast.success('Cart cleared');
        return true;
      } else {
        set({ error: response.data.message || 'Failed to clear cart' });
        toast.error(response.data.message || 'Failed to clear cart');
        return false;
      }
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while clearing cart';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Get checkout information for payment
  getCheckoutInfo: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await axios.get(
        `${API_URL}/cart/checkout`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const checkoutInfo = response.data.checkout;
        set({ checkoutInfo });
        return checkoutInfo;
      } else {
        set({ error: response.data.message || 'Failed to get checkout information' });
        toast.error(response.data.message || 'Failed to get checkout information');
        return null;
      }
    } catch (error: any) {
      console.error('Error getting checkout info:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while getting checkout information';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Handle Remita payment redirect
  handleRemitaRedirect: async () => {
    const checkoutInfo = get().checkoutInfo || await get().getCheckoutInfo();
    
    if (!checkoutInfo) {
      set({ error: 'Failed to get checkout information' });
      return '';
    }
    
    // For public portal integration, we'll open the portal URL directly
    // The user will need to manually enter some data in the portal
    const publicPortalUrl = checkoutInfo.payment.publicPortalUrl;
    
    // Store the checkout info in session storage to be used later
    sessionStorage.setItem('remitaCheckoutInfo', JSON.stringify({
      orderId: checkoutInfo.payment.orderId,
      amount: checkoutInfo.payment.amount,
      description: checkoutInfo.payment.description,
      payerName: checkoutInfo.payment.payerName,
      payerEmail: checkoutInfo.payment.payerEmail,
      payerPhone: checkoutInfo.payment.payerPhone,
      serviceName: checkoutInfo.payment.portalRequestData.serviceName
    }));
    
    return publicPortalUrl;
  },

  // Reset cart store
  resetCartStore: () => {
    set({ 
      cart: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      checkoutInfo: null
    });
  },

  // Clear errors
  clearErrors: () => {
    set({ error: null });
  }
}));

export default useCartStore; 