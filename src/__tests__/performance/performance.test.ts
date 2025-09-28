/**
 * Performance tests for optimization validation
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RequestCache, apiCache, CacheKeys, CacheTTL } from '../../services/cache';
import { VirtualScrollList } from '../../components/VirtualScrollList';
import { lazyLoadService, preloadService, clearModuleCache } from '../../utils/lazyLoader';

// Mock data generators
const generateMockPRs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    title: `Test PR ${i + 1}`,
    user: {
      login: `user${i + 1}`,
      avatar_url: `https://github.com/user${i + 1}.png`,
    },
    created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
    head: { sha: `sha${i + 1}`, ref: `feature-${i + 1}` },
    base: { sha: 'main-sha', ref: 'main' },
  }));
};

const generateMockComments = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `comment-${i + 1}`,
    file: `src/file${(i % 10) + 1}.ts`,
    line: (i % 100) + 1,
    content: `This is a test comment ${i + 1}. `.repeat(Math.floor(Math.random() * 5) + 1),
    severity: ['error', 'warning', 'info'][i % 3] as 'error' | 'warning' | 'info',
    status: ['pending', 'accepted', 'rejected'][i % 3] as 'pending' | 'accepted' | 'rejected',
    category: `category-${(i % 5) + 1}`,
    createdAt: new Date(Date.now() - i * 1000 * 60).toISOString(),
  }));
};

describe('Performance Optimizations', () => {
  beforeEach(() => {
    // Clear caches before each test
    apiCache.clear();
    clearModuleCache();
    vi.clearAllMocks();
  });

  describe('Request Caching', () => {
    it('should cache API responses and return cached data on subsequent calls', async () => {
      const cache = new RequestCache({ ttl: 1000, maxSize: 10 });
      const mockFetch = vi.fn().mockResolvedValue({ data: 'test-data' });

      // First call should fetch data
      const result1 = await cache.getOrSet('test-key', mockFetch);
      expect(result1).toEqual({ data: 'test-data' });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should return cached data
      const result2 = await cache.getOrSet('test-key', mockFetch);
      expect(result2).toEqual({ data: 'test-data' });
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should expire cached data after TTL', async () => {
      const cache = new RequestCache({ ttl: 50, maxSize: 10 });
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ data: 'first-call' })
        .mockResolvedValueOnce({ data: 'second-call' });

      // First call
      const result1 = await cache.getOrSet('test-key', mockFetch);
      expect(result1).toEqual({ data: 'first-call' });

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      // Second call should fetch new data
      const result2 = await cache.getOrSet('test-key', mockFetch);
      expect(result2).toEqual({ data: 'second-call' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect cache size limits', () => {
      const cache = new RequestCache({ ttl: 10000, maxSize: 3 });

      // Fill cache to capacity
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      cache.set('key3', 'data3');

      expect(cache.getStats().totalEntries).toBe(3);

      // Adding one more should remove the oldest
      cache.set('key4', 'data4');
      expect(cache.getStats().totalEntries).toBe(3);
      expect(cache.get('key1')).toBeNull(); // Should be evicted
      expect(cache.get('key4')).toBe('data4'); // Should be present
    });

    it('should provide accurate cache statistics', () => {
      const cache = new RequestCache({ ttl: 1000, maxSize: 10 });
      
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.maxSize).toBe(10);
    });

    it('should clean up expired entries', async () => {
      const cache = new RequestCache({ ttl: 50, maxSize: 10 });
      
      cache.set('key1', 'data1');
      cache.set('key2', 'data2');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const removedCount = cache.cleanup();
      expect(removedCount).toBe(2);
      expect(cache.getStats().totalEntries).toBe(0);
    });
  });

  describe('Virtual Scrolling', () => {
    it('should render only visible items for large lists', () => {
      const items = generateMockPRs(1000);
      const renderItem = vi.fn((item: any, index: number) => 
        React.createElement('div', { 
          key: index, 
          'data-testid': `item-${index}` 
        }, item.title)
      );

      render(
        React.createElement(VirtualScrollList, {
          items,
          itemHeight: 100,
          containerHeight: 500,
          renderItem
        })
      );

      // Should only render visible items (approximately 5-15 items for 500px container with 100px items + overscan)
      expect(renderItem.mock.calls.length).toBeLessThan(50); // Much less than 1000
      expect(renderItem.mock.calls.length).toBeGreaterThan(0);
    });

    it('should update visible items when scrolling', async () => {
      const items = generateMockPRs(100);
      let scrollCallback: ((scrollTop: number) => void) | undefined;
      
      const renderItem = vi.fn((item: any, index: number) => 
        React.createElement('div', { 
          key: index, 
          'data-testid': `item-${index}` 
        }, item.title)
      );

      const { container } = render(
        React.createElement(VirtualScrollList, {
          items,
          itemHeight: 100,
          containerHeight: 300,
          renderItem,
          onScroll: (scrollTop: number) => scrollCallback?.(scrollTop)
        })
      );

      const initialCallCount = renderItem.mock.calls.length;

      // Simulate scroll
      const scrollContainer = container.firstChild as HTMLElement;
      scrollContainer.scrollTop = 500;
      scrollContainer.dispatchEvent(new Event('scroll'));

      await waitFor(() => {
        // Should have re-rendered with different items
        expect(renderItem.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should handle empty lists gracefully', () => {
      const renderItem = vi.fn();

      render(
        React.createElement(VirtualScrollList, {
          items: [],
          itemHeight: 100,
          containerHeight: 300,
          renderItem
        })
      );

      expect(renderItem).not.toHaveBeenCalled();
    });

    it('should handle overscan correctly', () => {
      const items = generateMockPRs(50);
      const renderItem = vi.fn((item: any, index: number) => 
        React.createElement('div', { key: index }, item.title)
      );

      render(
        React.createElement(VirtualScrollList, {
          items,
          itemHeight: 100,
          containerHeight: 300,
          renderItem,
          overscan: 10
        })
      );

      // With overscan of 10, should render more items than just visible ones
      const callCount = renderItem.mock.calls.length;
      expect(callCount).toBeGreaterThan(3); // More than just visible items
      expect(callCount).toBeLessThan(30); // But not all items
    });
  });

  describe('Lazy Loading', () => {
    it('should cache loaded modules', async () => {
      const mockModule = { default: { test: 'data' } };
      const mockImport = vi.fn().mockResolvedValue(mockModule);

      // First load
      const result1 = await lazyLoadService(mockImport, 'test-service');
      expect(result1).toEqual({ test: 'data' });
      expect(mockImport).toHaveBeenCalledTimes(1);

      // Second load should use cache
      const result2 = await lazyLoadService(mockImport, 'test-service');
      expect(result2).toEqual({ test: 'data' });
      expect(mockImport).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle import failures gracefully', async () => {
      const mockImport = vi.fn().mockRejectedValue(new Error('Import failed'));

      await expect(
        lazyLoadService(mockImport, 'failing-service')
      ).rejects.toThrow('Import failed');
    });

    it('should preload services in background', async () => {
      const mockModule = { default: { test: 'preloaded' } };
      const mockImport = vi.fn().mockResolvedValue(mockModule);

      // Preload (should not throw)
      preloadService(mockImport, 'preload-service');

      // Wait a bit for preload to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now loading should be instant (from cache)
      const result = await lazyLoadService(mockImport, 'preload-service');
      expect(result).toEqual({ test: 'preloaded' });
    });

    it('should clear module cache', async () => {
      const mockModule = { default: { test: 'data' } };
      const mockImport = vi.fn().mockResolvedValue(mockModule);

      // Load module
      await lazyLoadService(mockImport, 'clear-test');
      expect(mockImport).toHaveBeenCalledTimes(1);

      // Clear cache
      clearModuleCache();

      // Load again should call import function again
      await lazyLoadService(mockImport, 'clear-test');
      expect(mockImport).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should render large PR lists efficiently', () => {
      const startTime = performance.now();
      const items = generateMockPRs(1000);
      
      render(
        React.createElement(VirtualScrollList, {
          items,
          itemHeight: 120,
          containerHeight: 600,
          renderItem: (item: any, index: number) => 
            React.createElement('div', 
              { key: index, style: { height: 120 } },
              React.createElement('h3', null, item.title),
              React.createElement('p', null, item.user.login)
            )
        })
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in reasonable time (less than 100ms for 1000 items)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle cache operations efficiently', () => {
      const cache = new RequestCache({ maxSize: 1000 });
      const startTime = performance.now();

      // Perform many cache operations
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `data-${i}`);
      }

      for (let i = 0; i < 1000; i++) {
        cache.get(`key-${i}`);
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should complete operations in reasonable time
      expect(operationTime).toBeLessThan(50);
    });

    it('should measure memory usage of virtual scrolling vs regular rendering', () => {
      const items = generateMockComments(10000);
      
      // This is a conceptual test - in a real scenario you'd measure actual memory usage
      // For now, we just verify that virtual scrolling renders fewer DOM nodes
      
      const { container: virtualContainer } = render(
        React.createElement(VirtualScrollList, {
          items,
          itemHeight: 150,
          containerHeight: 600,
          renderItem: (item: any, index: number) => 
            React.createElement('div', 
              { key: index, 'data-testid': 'virtual-item' },
              item.content
            )
        })
      );

      const virtualItems = virtualContainer.querySelectorAll('[data-testid="virtual-item"]');
      
      // Virtual scrolling should render much fewer items than the total
      expect(virtualItems.length).toBeLessThan(50);
      expect(virtualItems.length).toBeGreaterThan(0);
      expect(items.length).toBe(10000); // Verify we have many items but render few
    });
  });

  describe('Code Splitting Performance', () => {
    it('should lazy load components without blocking', async () => {
      // Mock a lazy component
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => React.createElement('div', 
            { 'data-testid': 'lazy-component' }, 
            'Lazy Loaded'
          )
        })
      );

      const startTime = performance.now();
      
      render(
        React.createElement(React.Suspense, 
          { fallback: React.createElement('div', null, 'Loading...') },
          React.createElement(LazyComponent)
        )
      );

      // Should show loading state initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load reasonably quickly (increased threshold for test environment)
      expect(loadTime).toBeLessThan(500);
    });
  });
});

// Helper to measure component render performance
export const measureRenderPerformance = (
  renderFn: () => void,
  iterations: number = 10
): { average: number; min: number; max: number } => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
};

// Helper to measure memory usage (conceptual)
export const measureMemoryUsage = (): number => {
  // In a real browser environment, you could use:
  // return (performance as any).memory?.usedJSHeapSize || 0;
  
  // For testing, return a mock value
  return Math.random() * 1000000;
};