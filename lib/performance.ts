/**
 * Performance optimization utilities for theme switching and layout rendering
 */

/**
 * Temporarily disables transitions during theme changes to prevent jarring animations
 * Re-enables transitions after the theme has been applied
 */
export function optimizeThemeTransition(callback: () => void): void {
     // Add a class to disable transitions
     const root = document.documentElement;
     root.classList.add('disable-transitions');

     // Execute the theme change
     callback();

     // Force a reflow to ensure the class is applied
     void root.offsetHeight;

     // Re-enable transitions after a short delay
     requestAnimationFrame(() => {
          requestAnimationFrame(() => {
               root.classList.remove('disable-transitions');
          });
     });
}

/**
 * Optimizes icon loading by ensuring SVGs are rendered efficiently
 */
export function optimizeIconRendering(): void {
     if (typeof window === 'undefined') return;

     // Set shape-rendering optimization for all SVGs
     const svgs = document.querySelectorAll('svg');
     svgs.forEach((svg) => {
          if (!svg.hasAttribute('shape-rendering')) {
               svg.setAttribute('shape-rendering', 'geometricPrecision');
          }
     });
}

/**
 * Prevents layout shifts by ensuring critical dimensions are set before render
 */
export function preventLayoutShift(): void {
     if (typeof window === 'undefined') return;

     // Set explicit heights for layout containers to prevent shifts
     const sidebar = document.querySelector('aside[role="navigation"]');
     if (sidebar) {
          const currentWidth = sidebar.clientWidth;
          sidebar.setAttribute('style', `min-width: ${currentWidth}px`);
     }

     const header = document.querySelector('header');
     if (header) {
          header.setAttribute('style', 'min-height: 64px');
     }
}

/**
 * Optimizes responsive layout by using ResizeObserver with debouncing
 */
export function createOptimizedResizeObserver(
     callback: (width: number) => void,
     debounceMs: number = 150
): ResizeObserver | null {
     if (typeof window === 'undefined' || !('ResizeObserver' in window)) {
          return null;
     }

     let timeoutId: NodeJS.Timeout;

     return new ResizeObserver((entries) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
               for (const entry of entries) {
                    const width = entry.contentRect.width;
                    callback(width);
               }
          }, debounceMs);
     });
}

/**
 * Preloads critical resources to improve initial render performance
 */
export function preloadCriticalResources(): void {
     if (typeof window === 'undefined') return;

     // Preload theme preference to prevent FOUC
     try {
          const theme = localStorage.getItem('theme-preference');
          if (theme) {
               document.documentElement.classList.add(theme);
          }
     } catch (e) {
          // Silently fail if localStorage is not available
     }
}
