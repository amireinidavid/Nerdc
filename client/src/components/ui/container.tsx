import React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Set to true to use the max-width constraints 
   * (as configured in tailwind.config.js container)
   */
  maxWidth?: boolean;
  
  /**
   * Set to false to remove padding
   */
  padding?: boolean;

  /**
   * Centered content (horizontally)
   */
  centered?: boolean;

  /**
   * Variants to apply specific screen width constraints
   */
  variant?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "default";
}

/**
 * Container component with responsive padding and width constraints
 */
export function Container({
  className,
  maxWidth = true,
  padding = true,
  centered = true,
  variant = "default",
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        // Base styles
        "w-full",
        
        // Padding
        padding && "px-4 sm:px-6 md:px-8 ipad:px-10 xl:px-12",
        
        // Centering
        centered && "mx-auto",
        
        // Max width variants based on Tailwind container sizes
        maxWidth && variant === "default" && "max-w-[1400px]",
        maxWidth && variant === "sm" && "max-w-[640px]",
        maxWidth && variant === "md" && "max-w-[768px]",
        maxWidth && variant === "lg" && "max-w-[1024px]",
        maxWidth && variant === "xl" && "max-w-[1280px]",
        maxWidth && variant === "2xl" && "max-w-[1440px]",
        maxWidth && variant === "full" && "max-w-full",
        
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 