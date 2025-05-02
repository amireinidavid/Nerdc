"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "group bg-slate-900/80 backdrop-blur-md text-white border border-white/10 p-4 rounded-lg shadow-lg",
            title: "text-white font-medium",
            description: "text-white/80 text-sm",
            success: "border-green-500/20 bg-green-700/10",
            error: "border-red-500/20 bg-red-700/10",
            info: "border-indigo-500/20 bg-indigo-700/10",
          },
          duration: 4000,
        }}
      />
      {children}
    </>
  );
} 