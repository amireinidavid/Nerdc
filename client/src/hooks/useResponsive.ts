import { useState, useEffect } from 'react';
import { Breakpoint, breakpoints, getActiveBreakpoint } from '@/lib/responsive';

/**
 * Hook to detect which breakpoint is currently active
 * @returns Current breakpoint information
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(
    typeof window !== 'undefined' ? getActiveBreakpoint() : 'lg'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setBreakpoint(getActiveBreakpoint());
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if the current viewport is at least a certain breakpoint
 * @param breakpoint Minimum breakpoint to check for
 * @returns Whether the current viewport is at least the specified breakpoint
 */
export function useMinBreakpoint(minBreakpoint: Breakpoint) {
  const [matches, setMatches] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoints[minBreakpoint] : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[minBreakpoint]}px)`);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define callback for matchMedia
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Older browsers support addListener
    else {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore - For older browsers
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [minBreakpoint]);

  return matches;
}

/**
 * Hook to check if the current viewport is at most a certain breakpoint
 * @param breakpoint Maximum breakpoint to check for
 * @returns Whether the current viewport is at most the specified breakpoint
 */
export function useMaxBreakpoint(maxBreakpoint: Breakpoint) {
  const [matches, setMatches] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoints[maxBreakpoint] : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoints[maxBreakpoint]}px)`);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define callback for matchMedia
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Older browsers support addListener
    else {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore - For older browsers
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [maxBreakpoint]);

  return matches;
}

/**
 * Hook that returns different values based on the current breakpoint
 * @param values Object mapping breakpoints to values
 * @param defaultValue Default value to use if no breakpoint matches
 * @returns The value for the current breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const breakpoint = useBreakpoint();
  
  // Check for direct match
  if (values[breakpoint] !== undefined) {
    return values[breakpoint] as T;
  }
  
  // Find the closest smaller breakpoint
  const breakpointOrder: Breakpoint[] = [
    'xs', 'sm', 'md', 'tablet', 'ipad', 'ipadPro', 
    'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'
  ];
  
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // Check all smaller breakpoints in descending order
  for (let i = currentIndex - 1; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }
  
  // Check all larger breakpoints in ascending order
  for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }
  
  // Return default value if no breakpoint matches
  return defaultValue;
}

/**
 * Hook to detect if the current device is touch-enabled
 * @returns Whether the current device is touch-enabled
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const touchDevice = (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      // @ts-ignore - For older browsers
      navigator.msMaxTouchPoints > 0
    );
    
    setIsTouch(touchDevice);
  }, []);

  return isTouch;
}

/**
 * Hook to detect orientation changes
 * @returns Current orientation ('portrait' or 'landscape')
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' 
      ? window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      : 'portrait'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
} 