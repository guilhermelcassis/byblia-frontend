"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define interface for screen dimensions
interface ScreenDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isLandscape: boolean;
}

// Create context for screen dimensions to avoid prop drilling
const ScreenContext = createContext<ScreenDimensions>({
  width: 0,
  height: 0,
  isMobile: false,
  isLandscape: false
});

export const ScreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<ScreenDimensions>({
    width: 0,
    height: 0,
    isMobile: false,
    isLandscape: false
  });

  useEffect(() => {
    const updateScreenDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;
      const isLandscape = width > height && width <= 1024;
      
      setScreen({
        width,
        height,
        isMobile,
        isLandscape
      });
    };
    
    // Check initially
    updateScreenDimensions();
    
    // Add listeners
    window.addEventListener('resize', updateScreenDimensions);
    window.addEventListener('orientationchange', updateScreenDimensions);
    
    // Clean up listeners when unmounting
    return () => {
      window.removeEventListener('resize', updateScreenDimensions);
      window.removeEventListener('orientationchange', updateScreenDimensions);
    };
  }, []);

  return (
    <ScreenContext.Provider value={screen}>
      {children}
    </ScreenContext.Provider>
  );
};

// Custom hook to use screen context
export const useScreen = () => useContext(ScreenContext); 