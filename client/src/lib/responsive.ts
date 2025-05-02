/**
 * Responsive utility functions and constants for consistent breakpoint management
 */

export const breakpoints = {
  // Mobile breakpoints
  xs: 320,
  sm: 375,
  md: 425,
  
  // Tablet breakpoints
  tablet: 640,
  ipad: 768,
  ipadPro: 834,
  
  // Desktop breakpoints
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
  '3xl': 1600,
  '4xl': 1920,
  '5xl': 2560,
  '6xl': 3440,
  '7xl': 3840,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Creates a media query string for the given breakpoint
 * @param breakpoint - The breakpoint to create a media query for
 * @param type - The type of media query (min or max width)
 * @returns Media query string
 */
export const createMediaQuery = (breakpoint: Breakpoint, type: 'min' | 'max' = 'min') => {
  const value = breakpoints[breakpoint];
  return `@media (${type}-width: ${value}px)`;
};

/**
 * Utility object with media queries for all breakpoints (min-width)
 * Usage: 
 * ```css
 * ${media.lg} {
 *   // Large screen styles here
 * }
 * ```
 */
export const media = Object.keys(breakpoints).reduce((acc, breakpoint) => {
  const bp = breakpoint as Breakpoint;
  acc[bp] = createMediaQuery(bp, 'min');
  return acc;
}, {} as Record<Breakpoint, string>);

/**
 * Utility object with max-width media queries for all breakpoints
 * Usage:
 * ```css
 * ${mediaMax.md} {
 *   // Styles for screens smaller than md breakpoint
 * }
 * ```
 */
export const mediaMax = Object.keys(breakpoints).reduce((acc, breakpoint) => {
  const bp = breakpoint as Breakpoint;
  acc[bp] = createMediaQuery(bp, 'max');
  return acc;
}, {} as Record<Breakpoint, string>);

/**
 * Determines if the current viewport is at least the specified breakpoint
 * @param breakpoint - The breakpoint to check against
 * @returns Whether the viewport is at least the specified breakpoint
 */
export const isMinWidth = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[breakpoint];
};

/**
 * Determines if the current viewport is at most the specified breakpoint
 * @param breakpoint - The breakpoint to check against
 * @returns Whether the viewport is at most the specified breakpoint
 */
export const isMaxWidth = (breakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= breakpoints[breakpoint];
};

/**
 * Determines if the current viewport is between the specified breakpoints
 * @param minBreakpoint - The minimum breakpoint (inclusive)
 * @param maxBreakpoint - The maximum breakpoint (inclusive) 
 * @returns Whether the viewport is between the specified breakpoints
 */
export const isBetween = (minBreakpoint: Breakpoint, maxBreakpoint: Breakpoint): boolean => {
  if (typeof window === 'undefined') return false;
  return isMinWidth(minBreakpoint) && isMaxWidth(maxBreakpoint);
};

/**
 * Hook to get the current breakpoint based on window width
 * @returns The current active breakpoint
 */
export const getActiveBreakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'lg'; // Default for SSR
  
  const width = window.innerWidth;
  
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.tablet) return 'md';
  if (width < breakpoints.ipad) return 'tablet';
  if (width < breakpoints.ipadPro) return 'ipad';
  if (width < breakpoints.lg) return 'ipadPro';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  if (width < breakpoints['3xl']) return '2xl';
  if (width < breakpoints['4xl']) return '3xl';
  if (width < breakpoints['5xl']) return '4xl';
  if (width < breakpoints['6xl']) return '5xl';
  if (width < breakpoints['7xl']) return '6xl';
  
  return '7xl';
}; 