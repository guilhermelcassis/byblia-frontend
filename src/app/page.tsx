"use client";

import React, { useEffect } from 'react';
import ChatContainer from '@/components/ChatContainer';
import { ScreenProvider, useScreen } from '@/hooks/useScreen';
import MainLayout from '@/components/layout/MainLayout';
import { useMouseEffect } from '@/hooks/useMouseEffect';
import { useTheme } from 'next-themes';
import WelcomeTitleEffect from '@/components/WelcomeTitleEffect';
import { motion, AnimatePresence } from 'framer-motion';
import { BookText, MessageSquareText, ChevronDown } from 'lucide-react';
import PWAInstallButton from '@/components/PWAInstallButton';

export default function Home() {
  return (
    <ScreenProvider>
      <HomeContent />
    </ScreenProvider>
  );
}

function HomeContent() {
  const screen = useScreen();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = React.useState(true);
  const [showWelcome, setShowWelcome] = React.useState(true);
  const [chatReady, setChatReady] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Scroll handler for mobile devices
  const handleScrollDown = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  };
  
  // Integrate mouse effect to improve desktop experience
  useMouseEffect();
  
  // Mark component as mounted to prevent hydration issues
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show welcome screen then fade to chat after a delay
  React.useEffect(() => {
    if (!isMounted) return;
    
    const timer = setTimeout(() => {
      setShowWelcome(false);
      // Prepare chat with short delay after welcome animation
      setTimeout(() => {
        setChatReady(true);
      }, 500);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isMounted]);

  // Simulate loading and reveal content
  React.useEffect(() => {
    if (!isMounted) return;
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isMounted]);

  // Control zoom and view to improve experience on mobile devices
  useEffect(() => {
    if (!isMounted) return;
    if (screen.isMobile) {
      // Function to ensure no automatic zoom
      const preventZoom = (e: TouchEvent) => {
        // Prevent zoom only when there are multiple touches (pinch zoom)
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Function to reset zoom when loading the page
      const resetZoom = () => {
        // Reset page zoom to ensure full visibility
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
          
          // Allow controlled zoom after a short period
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no');
          }, 500);
        }
      };
      
      // Reset zoom on load
      resetZoom();
      
      // Add input listeners for preventing zoom
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', resetZoom);
      });
      
      // Prevent pinch zoom
      document.addEventListener('touchstart', preventZoom, { passive: false });
      
      return () => {
        // Clean up all listeners
        document.removeEventListener('touchstart', preventZoom);
        
        // Remove listeners from existing inputs
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.removeEventListener('focus', resetZoom);
        });
      };
    }
  }, [screen.isMobile, isMounted]);

  // Only render client-side content after mounting to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <BookText size={48} className="text-gray-400 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Full height chat container with welcome screen */}
      <div className="h-full flex flex-col relative">
        {/* PWA Install Button - centered in the top */}
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center">
          <PWAInstallButton />
        </div>
        
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col items-center gap-4">
                <BookText size={48} className={`animate-pulse ${isDark ? 'text-white' : 'text-black'}`} />
                <p className="text-lg font-medium">Carregando...</p>
              </div>
            </motion.div>
          ) : showWelcome ? (
            <motion.div 
              key="welcome"
              className="h-full flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <WelcomeTitleEffect>
                <motion.h2 
                  className="text-3xl sm:text-4xl font-semibold mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Olá, sou a <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-black dark:from-gray-300 dark:to-white font-boldonse animate-gradient-text">Bybl.ia</span>
                </motion.h2>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 text-center max-w-md mx-auto text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Seu conselheiro bíblico
                </motion.p>
              </WelcomeTitleEffect>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              className="flex-grow overflow-hidden relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {!chatReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-200/80 z-10">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="animate-bounce" size={24} />
                    <p>Preparando chat...</p>
                  </div>
                </div>
              )}
              <ChatContainer />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Theme toggle button with animation */}
        <motion.button
          className="absolute bottom-4 right-4 p-2 rounded-full bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <div className={`p-2 rounded-full ${isDark ? 'bg-gray-300' : 'bg-gray-800'}`}>
            {isDark ? (
              <motion.svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </motion.svg>
            ) : (
              <motion.svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </motion.svg>
            )}
          </div>
        </motion.button>
      </div>
    </MainLayout>
  );
}
