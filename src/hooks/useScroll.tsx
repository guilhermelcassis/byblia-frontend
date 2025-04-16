import { useCallback, useEffect, useRef, useState } from 'react';
import { useScreen } from '@/hooks/useScreen';

interface UseScrollOptions {
  /**
   * Whether content is currently streaming
   */
  isStreaming: boolean;
  /**
   * Total number of messages
   */
  messagesCount: number;
  /**
   * Whether there's pending content that should trigger a scroll
   */
  hasNewContent?: boolean;
  /**
   * Current response text
   */
  currentResponseText?: string;
}

// Further reduced max auto-scroll frequency for smoother experience
const MAX_AUTO_SCROLL_FREQUENCY_DESKTOP = 950; // Increased from 750ms to 950ms for even smoother scrolling
const MAX_AUTO_SCROLL_FREQUENCY_MOBILE = 1200; // Increased from 1000ms to 1200ms for mobile

// Interface to better define scroll behavior options
interface ScrollBehaviorOptions {
  behavior?: ScrollBehavior;
  force?: boolean;
  respectUserScrollPosition?: boolean;
}

// Define scroll state type for better typing
type ScrollState = {
  isUserScrolling: boolean;
  isAtBottom: boolean;
  lastScrollTop: number;
  lastScrollDirection: 'up' | 'down' | null;
  scrollActivity: number;
  lastScrollTime: number;
};

/**
 * Hook that ensures auto-scroll during streaming while respecting user manual scrolls
 */
export function useScroll({ 
  isStreaming, 
  messagesCount, 
  hasNewContent = false,
  currentResponseText = ''
}: UseScrollOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMounted = useRef<boolean>(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const lastContentLengthRef = useRef<number>(0);
  const lastScrollPositionRef = useRef<number>(0);
  const screen = useScreen();
  const autoScrollEnabledRef = useRef<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const streamingIdRef = useRef<number | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const userScrolledUpIntentionallyRef = useRef<boolean>(false);
  const [hasInvisibleNewContent, setHasInvisibleNewContent] = useState(false);
  const lastResponseLengthRef = useRef<number>(0);
  const scrollAnimationRef = useRef<number | null>(null);
  const contentChangesRef = useRef<boolean>(false);
  const lastScrollHeightRef = useRef<number>(0);
  // State to track if auto-scroll was disabled by user during streaming
  const manualScrollDuringStreamingRef = useRef<boolean>(false);
  // Add stabilization and user activity tracking
  const userActivityTimestampRef = useRef<number>(Date.now());
  const maxAutoScrollFrequencyRef = useRef<number>(MAX_AUTO_SCROLL_FREQUENCY_DESKTOP);
  const lastAutoScrollTimestampRef = useRef<number>(0);
  const scrollPositionStabilizationRef = useRef<number | null>(null);
  const touchScrollingRef = useRef<boolean>(false);
  
  // Update max scroll frequency based on device type
  useEffect(() => {
    // Less aggressive auto-scrolling on mobile and use longer debounce
    if (screen.isMobile) {
      maxAutoScrollFrequencyRef.current = MAX_AUTO_SCROLL_FREQUENCY_MOBILE;
    } else {
      maxAutoScrollFrequencyRef.current = MAX_AUTO_SCROLL_FREQUENCY_DESKTOP;
    }
  }, [screen.isMobile]);
  
  // Track content length changes to detect invisible new content
  useEffect(() => {
    if (isStreaming && currentResponseText) {
      const currentLength = currentResponseText.length;
      
      if (currentLength > lastResponseLengthRef.current) {
        // Content is growing
        lastResponseLengthRef.current = currentLength;
        contentChangesRef.current = true;
        
        // If user has scrolled up, show indicator that new content is streaming in
        if (userScrolledUpIntentionallyRef.current || manualScrollDuringStreamingRef.current) {
          setHasInvisibleNewContent(true);
        }
      }
    } else if (!isStreaming) {
      // Reset tracking when streaming stops
      lastResponseLengthRef.current = 0;
      contentChangesRef.current = false;
      setHasInvisibleNewContent(false);
      manualScrollDuringStreamingRef.current = false;
    }
  }, [isStreaming, currentResponseText]);
  
  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Reset auto-scroll state when streaming starts/stops
  useEffect(() => {
    if (isStreaming) {
      // New streaming started - create a new ID
      streamingIdRef.current = Date.now();
      
      // Reset invisible content flag at start of streaming
      setHasInvisibleNewContent(false);
      
      // Reset manual scroll flag at the start of streaming
      // but only if user is already at the bottom
      if (containerRef.current) {
        const container = containerRef.current;
        const currentScrollTop = container.scrollTop;
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        const distanceFromBottom = maxScrollTop - currentScrollTop;
        
        if (distanceFromBottom < 50) {
          manualScrollDuringStreamingRef.current = false;
          userScrolledUpIntentionallyRef.current = false;
        }
      }
      
      // Only auto-scroll if user hasn't explicitly scrolled up
      if (!userScrolledUpIntentionallyRef.current && !manualScrollDuringStreamingRef.current) {
        // Initial scroll to make content visible - use RAF for smooth animation
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
        
        // Don't scroll immediately, but after a small delay to let page stabilize
        setTimeout(() => {
          scrollAnimationRef.current = requestAnimationFrame(() => {
            scrollToBottom({ behavior: "smooth" });
            scrollAnimationRef.current = null;
            lastAutoScrollTimestampRef.current = Date.now();
          });
        }, 100);
      }
    } else {
      // Streaming ended - reset the ID
      streamingIdRef.current = null;
      
      // Reset invisible content flag
      setHasInvisibleNewContent(false);
      
      // If there are messages and user hasn't scrolled up, ensure a final scroll to bottom
      // with a longer delay to ensure all content is properly rendered
      if (messagesCount > 0 && !userScrolledUpIntentionallyRef.current) {
        // Longer delay to ensure rendering is complete and stabilized
        setTimeout(() => {
          scrollToBottom({ behavior: "smooth" });
        }, 200);
      }
      
      // Reset all scroll tracking at the end of streaming with delay
      setTimeout(() => {
        manualScrollDuringStreamingRef.current = false;
      }, 500);
    }
    
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      
      if (scrollPositionStabilizationRef.current) {
        clearTimeout(scrollPositionStabilizationRef.current);
        scrollPositionStabilizationRef.current = null;
      }
    };
  }, [isStreaming, messagesCount]);
  
  // More precise scroll state tracking with TypeScript interface
  const scrollState = useRef<ScrollState>({
    isUserScrolling: false,
    isAtBottom: true,
    lastScrollTop: 0,
    lastScrollDirection: null,
    scrollActivity: 0,
    lastScrollTime: 0,
  });
  
  // Throttle state for auto-scroll
  const throttleState = useRef({
    lastScrollTime: 0,
    scrollPending: false,
    mutationCount: 0,
    lastMutationTime: 0,
  });
  
  // Observer for tracking content changes
  const observerRef = useRef<MutationObserver | null>(null);
  
  /**
   * Determines if the container is scrolled to bottom with improved precision
   */
  const isScrolledToBottom = useCallback((container: HTMLDivElement, tolerance = 100): boolean => {
    if (!container) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPosition = Math.abs(scrollHeight - scrollTop - clientHeight);
    
    return scrollPosition <= tolerance;
  }, []);

  /**
   * Enhanced scroll to bottom with smooth animation and improved options
   */
  const scrollToBottom = useCallback((options: ScrollBehaviorOptions = {}) => {
    const { behavior = 'smooth', force = false, respectUserScrollPosition = true } = options;
    const container = containerRef.current;
    
    if (!container || !isMounted.current) return;
    
    // During streaming, use 'auto' to prevent animation stacking
    const finalBehavior: ScrollBehavior = isStreaming ? 'auto' : behavior;
    
    // Respect user's scroll position unless forced
    if (!autoScrollEnabledRef.current && respectUserScrollPosition && !force) {
      return;
    }
    
    // Check if throttling is needed based on device and streaming state
    const now = Date.now();
    const timeSinceLastScroll = now - throttleState.current.lastScrollTime;
    
    // Apply throttling for smoother experience
    if (timeSinceLastScroll < maxAutoScrollFrequencyRef.current && !force) {
      if (!throttleState.current.scrollPending) {
        throttleState.current.scrollPending = true;
        
        // Schedule the scroll for later to prevent too many scrolls
        setTimeout(() => {
          if (isMounted.current && containerRef.current) {
            throttleState.current.lastScrollTime = Date.now();
            throttleState.current.scrollPending = false;
            
            // Re-check if we should still scroll before executing
            if (autoScrollEnabledRef.current || force) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: finalBehavior
              });
            }
          }
        }, maxAutoScrollFrequencyRef.current - timeSinceLastScroll);
      }
      return;
    }
    
    // Immediate scroll when throttling not needed
    throttleState.current.lastScrollTime = now;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: finalBehavior
    });
  }, [containerRef, autoScrollEnabledRef, isStreaming, maxAutoScrollFrequencyRef]);

  /**
   * Enhanced scroll handler with improved user intent detection
   */
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isMounted.current) return;
    
    const { scrollTop } = container;
    const now = Date.now();
    
    // Calculate scroll speed and direction for better intent detection
    const timeDelta = now - scrollState.current.lastScrollTime;
    const scrollDelta = Math.abs(scrollTop - scrollState.current.lastScrollTop);
    const scrollSpeed = timeDelta > 0 ? scrollDelta / timeDelta : 0;
    
    // Determine scroll direction
    const scrollDirection = 
      scrollTop > scrollState.current.lastScrollTop ? 'down' : 
      scrollTop < scrollState.current.lastScrollTop ? 'up' : 
      scrollState.current.lastScrollDirection;
    
    // Increase activity counter for intentional scrolls
    if (scrollSpeed > 0.1) {
      scrollState.current.scrollActivity += 1;
    } else {
      // Gradually decrease activity counter during inactive periods
      scrollState.current.scrollActivity = Math.max(0, scrollState.current.scrollActivity - 0.2);
    }
    
    // Check if user is actively scrolling (with improved detection)
    const isIntentionalScroll = 
      scrollState.current.scrollActivity > 3 && // Require more consistent activity
      scrollSpeed > 0.15 && // Higher threshold for intentional scrolls
      timeDelta < 300; // Recent activity
    
    // Update scroll state
    scrollState.current.isUserScrolling = isIntentionalScroll;
    scrollState.current.lastScrollTop = scrollTop;
    scrollState.current.lastScrollTime = now;
    scrollState.current.lastScrollDirection = scrollDirection;
    
    // The key point: determine auto-scroll state based on user's position and activity
    const wasAtBottom = scrollState.current.isAtBottom;
    const isAtBottom = isScrolledToBottom(container);
    scrollState.current.isAtBottom = isAtBottom;
    
    // Update auto-scroll based on position and user activity
    if (!isAtBottom && wasAtBottom && isIntentionalScroll && scrollDirection === 'up') {
      // User intentionally scrolled away from bottom
      autoScrollEnabledRef.current = false;
    } else if (isAtBottom && !wasAtBottom && scrollDirection === 'down') {
      // User has scrolled back to bottom
      autoScrollEnabledRef.current = true;
    }
  }, [containerRef, isScrolledToBottom]);

  /**
   * Initialize scroll observation when component mounts
   */
  useEffect(() => {
    const container = containerRef.current;
    
    if (!container) return;
    
    // Set initial scroll position
    scrollToBottom({ behavior: 'auto', force: true });
    
    // Add scroll event listener
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Create mutation observer with improved batching logic
    const MUTATION_THRESHOLD = 10; // Increased threshold for better batching
    const BATCH_WINDOW = 300; // Increased window for smoother experience
    
    observerRef.current = new MutationObserver((mutations) => {
      if (!isMounted.current) return;
      
      // Count significant content mutations
      let hasSignificantChanges = false;
      
      // Check for actual content changes rather than just attribute changes
      for (const mutation of mutations) {
        if (
          mutation.type === 'childList' && 
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        ) {
          hasSignificantChanges = true;
          break;
        }
      }
      
      if (!hasSignificantChanges) return;
      
      // Increment mutation counter and update time
      throttleState.current.mutationCount += 1;
      const now = Date.now();
      
      // Reset batch if too much time has passed
      if (now - throttleState.current.lastMutationTime > BATCH_WINDOW) {
        throttleState.current.mutationCount = 1;
      }
      
      throttleState.current.lastMutationTime = now;
      
      // Scroll on content changes when appropriate
      if (autoScrollEnabledRef.current) {
        // For small batches, scroll immediately
        if (throttleState.current.mutationCount <= 3) {
          scrollToBottom({
            behavior: isStreaming ? 'auto' : 'smooth',
            respectUserScrollPosition: true
          });
        }
        // For larger batches, use the batch threshold
        else if (throttleState.current.mutationCount >= MUTATION_THRESHOLD) {
          throttleState.current.mutationCount = 0;
          scrollToBottom({
            behavior: 'auto', // Use auto for large batches to avoid animation stacking
            respectUserScrollPosition: true
          });
        }
      }
    });
    
    // Start observing with appropriate options
    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false, // Ignore attribute changes for better performance
    });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef, handleScroll, scrollToBottom, autoScrollEnabledRef, isStreaming]);

  // Scroll to bottom on streaming state change
  useEffect(() => {
    if (isStreaming && autoScrollEnabledRef.current) {
      scrollToBottom({ behavior: 'auto' });
    }
  }, [isStreaming, autoScrollEnabledRef, scrollToBottom]);
  
  // Monitor window resize events with improved handling
  useEffect(() => {
    const handleResize = () => {
      // Only adjust scroll on resize if user is at the bottom or hasn't scrolled up
      if ((!userScrolledUpIntentionallyRef.current && !manualScrollDuringStreamingRef.current) || isNearBottomRef.current) {
        // Cancel any pending animation frame
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
        
        // Better debounced resize handling
        scrollAnimationRef.current = requestAnimationFrame(() => {
          // Small delay to let layout stabilize after resize
          setTimeout(() => {
            scrollToBottom({ behavior: "auto" });
            scrollAnimationRef.current = null;
          }, 100);
        });
      }
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [scrollToBottom]);
  
  // Reset scroll position when component unmounts
  useEffect(() => {
    return () => {
      userScrolledUpIntentionallyRef.current = false;
      autoScrollEnabledRef.current = true;
      manualScrollDuringStreamingRef.current = false;
      touchScrollingRef.current = false;
      setHasInvisibleNewContent(false);
      
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      
      if (scrollPositionStabilizationRef.current) {
        clearTimeout(scrollPositionStabilizationRef.current);
      }
    };
  }, []);
  
  return {
    containerRef,
    userHasScrolled,
    scrollToBottom,
    isNearBottom: isNearBottomRef.current,
    hasInvisibleNewContent, // Return this so we can show an indicator
    resetAutoScroll: () => {
      manualScrollDuringStreamingRef.current = false;
      userScrolledUpIntentionallyRef.current = false;
      autoScrollEnabledRef.current = true;
      setHasInvisibleNewContent(false);
      
      // Use RAF + timeout to ensure UI has updated before scrolling
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom({ behavior: "smooth" });
        });
      }, 50);
    },
    shouldAutoScroll: autoScrollEnabledRef.current,
    setShouldAutoScroll: (value: boolean) => {
      autoScrollEnabledRef.current = value;
    },
    isScrolledToBottom: containerRef.current ? isScrolledToBottom(containerRef.current) : true,
    isUserScrolling: scrollState.current.isUserScrolling,
  };
} 