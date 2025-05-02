"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUserProfile, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Load user data on initial mount
  useEffect(() => {
    // Only run if not already authenticated
    if (!isAuthenticated) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, isAuthenticated]);

  // Could add redirection logic here for protected routes if needed

  return <>{children}</>;
} 