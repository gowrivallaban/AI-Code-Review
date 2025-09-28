import React from 'react';

/**
 * Utility for lazy loading heavy services and components
 */

// Cache for loaded modules to avoid re-importing
const moduleCache = new Map<string, any>();

/**
 * Lazy load a service with caching
 */
export const lazyLoadService = async <T>(
  importFn: () => Promise<{ default: T } | T>,
  cacheKey: string
): Promise<T> => {
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey);
  }

  try {
    const module = await importFn();
    const service = 'default' in (module as any) ? (module as any).default : module as any;
    moduleCache.set(cacheKey, service);
    return service;
  } catch (error) {
    console.error(`Failed to lazy load service ${cacheKey}:`, error);
    throw error;
  }
};

/**
 * Preload a service in the background
 */
export const preloadService = <T>(
  importFn: () => Promise<{ default: T } | T>,
  cacheKey: string
): void => {
  // Only preload if not already cached
  if (!moduleCache.has(cacheKey)) {
    lazyLoadService(importFn, cacheKey).catch(error => {
      console.warn(`Failed to preload service ${cacheKey}:`, error);
    });
  }
};

/**
 * Clear the module cache (useful for testing or memory management)
 */
export const clearModuleCache = (): void => {
  moduleCache.clear();
};

/**
 * Get cache size for monitoring
 */
export const getCacheSize = (): number => {
  return moduleCache.size;
};

/**
 * Lazy load heavy components with error boundary
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => 
    React.createElement(React.Suspense, 
      { 
        fallback: fallback ? 
          React.createElement(fallback) : 
          React.createElement('div', 
            { className: 'flex justify-center items-center py-8' },
            React.createElement('div', 
              { className: 'animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500' }
            ),
            React.createElement('span', 
              { className: 'ml-2 text-gray-600' }, 
              'Loading...'
            )
          )
      },
      React.createElement(LazyComponent as any, { ...props, ref })
    )
  );
};