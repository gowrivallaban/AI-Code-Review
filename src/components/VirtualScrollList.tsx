import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtual scrolling component for handling large lists efficiently
 */
export const VirtualScrollList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
}: VirtualScrollListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
        });
      }
    }
    return result;
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing virtual scroll state
 */
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
    offsetY,
  };
};

/**
 * Virtual scroll component with dynamic item heights
 */
interface DynamicVirtualScrollProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemHeight?: (index: number) => number;
  overscan?: number;
  className?: string;
}

export const DynamicVirtualScrollList = <T,>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  getItemHeight,
  overscan = 5,
  className = '',
}: DynamicVirtualScrollProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Measure item heights
  useEffect(() => {
    const newHeights = items.map((_, index) => {
      if (getItemHeight) {
        return getItemHeight(index);
      }
      const element = itemRefs.current[index];
      return element ? element.offsetHeight : estimatedItemHeight;
    });
    setItemHeights(newHeights);
  }, [items, estimatedItemHeight, getItemHeight]);

  // Calculate positions
  const itemPositions = useMemo(() => {
    const positions = [0];
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights[i] || estimatedItemHeight;
      positions.push(positions[i] + height);
    }
    return positions;
  }, [items.length, itemHeights, estimatedItemHeight]);

  // Find visible range
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    let left = 0;
    let right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (itemPositions[mid] <= scrollTop) {
        startIndex = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // Find end index
    const visibleBottom = scrollTop + containerHeight;
    for (let i = startIndex; i < items.length; i++) {
      if (itemPositions[i] >= visibleBottom) {
        endIndex = i;
        break;
      }
    }

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, containerHeight, itemPositions, items.length, overscan]);

  const totalHeight = itemPositions[items.length] || 0;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
          top: itemPositions[i],
        });
      }
    }
    return result;
  }, [items, visibleRange, itemPositions]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={index}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};