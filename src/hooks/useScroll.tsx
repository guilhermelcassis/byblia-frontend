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
  
  // Track content length changes to detect invisible new content
  useEffect(() => {
    if (isStreaming && currentResponseText) {
      const currentLength = currentResponseText.length;
      
      if (currentLength > lastResponseLengthRef.current) {
        // Content is growing
        lastResponseLengthRef.current = currentLength;
        
        // If user has scrolled up, show indicator that new content is streaming in
        if (userScrolledUpIntentionallyRef.current) {
          setHasInvisibleNewContent(true);
        }
      }
    } else if (!isStreaming) {
      // Reset tracking when streaming stops
      lastResponseLengthRef.current = 0;
      setHasInvisibleNewContent(false);
    }
  }, [isStreaming, currentResponseText]);
  
  // Reset auto-scroll state when streaming starts/stops
  useEffect(() => {
    if (isStreaming) {
      // New streaming started - create a new ID
      streamingIdRef.current = Date.now();
      
      // Reset invisible content flag at start of streaming
      setHasInvisibleNewContent(false);
      
      // Only auto-scroll if user hasn't explicitly scrolled up
      if (!userScrolledUpIntentionallyRef.current) {
        // Initial scroll to make content visible
        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
      }
    } else {
      // Streaming ended - reset the ID
      streamingIdRef.current = null;
      
      // Reset invisible content flag
      setHasInvisibleNewContent(false);
      
      // If there are messages and user hasn't scrolled up, ensure a final scroll to bottom
      if (messagesCount > 0 && !userScrolledUpIntentionallyRef.current) {
        // Small delay to ensure rendering is complete
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 100);
      }
    }
  }, [isStreaming, messagesCount]);
  
  // Enhanced scroll to bottom with behavior options
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (!containerRef.current) return;
    
    // Don't scroll if user has intentionally scrolled up
    if (userScrolledUpIntentionallyRef.current && !isNearBottomRef.current) return;

    const container = containerRef.current;
    
    try {
      container.scrollTo({ 
        top: container.scrollHeight, 
        behavior 
      });
      
      // Clear invisible content indicator when scrolling to bottom
      if (hasInvisibleNewContent) {
        setHasInvisibleNewContent(false);
      }
      
      // For mobile support
      if (screen.isMobile) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior
        });
      }
    } catch (error) {
      // Fallback for older browsers that don't support ScrollToOptions
      container.scrollTop = container.scrollHeight;
      
      if (screen.isMobile) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }
  }, [screen.isMobile, hasInvisibleNewContent]);
  
  // Improved scroll detection to better respect user intentions
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    
    // Calculate distance from bottom (in pixels)
    const distanceFromBottom = maxScrollTop - currentScrollTop;
    
    // Update near-bottom state (within 100px of bottom)
    isNearBottomRef.current = distanceFromBottom < 100;
    
    // Detect if user scrolled up significantly
    if (lastScrollPositionRef.current > currentScrollTop + 50) {
      userScrolledUpIntentionallyRef.current = true;
      setUserHasScrolled(true);
      autoScrollEnabledRef.current = false;
    }
    
    // Detect if user scrolled to bottom manually
    if (distanceFromBottom < 50 && userScrolledUpIntentionallyRef.current) {
      // User scrolled back to bottom - re-enable auto-scroll
      userScrolledUpIntentionallyRef.current = false;
      autoScrollEnabledRef.current = true;
      
      // Clear invisible content indicator since user is now at bottom
      setHasInvisibleNewContent(false);
    }
    
    // When not streaming, update scroll state based on position
    if (!isStreaming) {
      if (distanceFromBottom > 150) {
        setUserHasScrolled(true);
      } else if (distanceFromBottom < 50) {
        setUserHasScrolled(false);
      }
    }
    
    // Update last scroll position
    lastScrollPositionRef.current = currentScrollTop;
  }, [isStreaming]);
  
  // Optimized mutation observer to detect content changes and scroll
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up existing observer
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
    }
    
    // Debounce variables to prevent too frequent scrolling
    let scrollTimeout: NodeJS.Timeout | null = null;
    let hasContentChanged = false;
    
    // Create improved observer with content change detection
    const observer = new MutationObserver((mutations) => {
      if (!isStreaming) return;
      
      // Check if relevant content changed
      hasContentChanged = mutations.some(mutation => 
        mutation.type === 'childList' || 
        mutation.type === 'characterData' ||
        (mutation.type === 'attributes' && 
         ['style', 'class'].includes(mutation.attributeName || ''))
      );
      
      if (hasContentChanged) {
        // If user has scrolled up, show indicator that there's new content
        if (userScrolledUpIntentionallyRef.current) {
          setHasInvisibleNewContent(true);
        }
        
        // Only auto-scroll if user hasn't scrolled up
        if (autoScrollEnabledRef.current && !userScrolledUpIntentionallyRef.current) {
          // Clear existing timeout
          if (scrollTimeout) clearTimeout(scrollTimeout);
          
          // Debounced scroll (50ms)
          scrollTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
              scrollToBottom("auto");
            });
            hasContentChanged = false;
          }, 50);
        }
      }
    });
    
    // Configure observer with expanded options
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'height']
    });
    
    // Save reference and clean up
    mutationObserverRef.current = observer;
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      observer.disconnect();
    };
  }, [isStreaming, scrollToBottom]);
  
  // Optimized scroll event listener with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Use throttled handler for better performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    container.addEventListener('scroll', throttledScrollHandler, { passive: true });
    return () => {
      container.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [handleScroll]);
  
  // Polling for continuous scroll during streaming - only if user hasn't scrolled up
  useEffect(() => {
    // Only auto-scroll if streaming and user hasn't scrolled up intentionally
    if (isStreaming && !userScrolledUpIntentionallyRef.current) {
      // Clear existing timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Setup regular interval for scroll updates - less frequent and only if auto-scroll is enabled
      timerRef.current = setInterval(() => {
        if (autoScrollEnabledRef.current && !userScrolledUpIntentionallyRef.current) {
          requestAnimationFrame(() => {
            scrollToBottom("auto");
          });
        }
      }, 500); // Reduced frequency to be less aggressive
    } else if (timerRef.current) {
      // Clear timer when not needed
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, scrollToBottom]);
  
  // Handle new messages - but respect user scroll position
  useEffect(() => {
    // When a new message is added (but not during streaming)
    if (!isStreaming && messagesCount > 0) {
      // Only scroll to bottom if user hasn't scrolled up
      if (!userScrolledUpIntentionallyRef.current) {
        setTimeout(() => {
          scrollToBottom("smooth");
        }, 100);
      }
    }
  }, [messagesCount, isStreaming, scrollToBottom]);
  
  // Monitor window resize events to ensure proper scroll
  useEffect(() => {
    const handleResize = () => {
      // Only adjust scroll on resize if user is at the bottom or hasn't scrolled up
      if (!userScrolledUpIntentionallyRef.current || isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
      }
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);
  
  // Reset scroll position when component unmounts
  useEffect(() => {
    return () => {
      userScrolledUpIntentionallyRef.current = false;
      autoScrollEnabledRef.current = true;
      setHasInvisibleNewContent(false);
    };
  }, []);
  
  return {
    containerRef,
    userHasScrolled,
    scrollToBottom,
    isNearBottom: isNearBottomRef.current,
    hasInvisibleNewContent // Return this so we can show an indicator
  };
} 