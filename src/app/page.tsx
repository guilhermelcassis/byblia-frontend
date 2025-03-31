"use client";

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuestionCircle, FaGithub, FaBars, FaTimes, FaEnvelope } from 'react-icons/fa';
import ChatContainer from '@/components/ChatContainer';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

// Custom hook to use screen context
export const useScreen = () => useContext(ScreenContext);

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [screen, setScreen] = useState<ScreenDimensions>({
    width: 0,
    height: 0,
    isMobile: false,
    isLandscape: false
  });
  const headerRef = useRef<HTMLDivElement>(null);

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

  // Close mobile menu when screen changes
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [screen.isLandscape, screen.width]);

  const headerHeight = screen.isLandscape ? 44 : 52; // Must match the header height in Header.tsx

  return (
    <ScreenContext.Provider value={screen}>
      <main className={`flex min-h-screen flex-col items-center bg-white relative ${
        screen.isLandscape ? 'pb-4' : screen.isMobile ? 'pb-8' : 'pb-16'
      }`}>
        <div className="w-full relative" ref={headerRef}>
          <Header isMobile={screen.isMobile} showBackButton={false} />
          
          <button 
            className="absolute flex items-center justify-center w-10 h-10 text-gray-400 hover:text-bible-brown hover:bg-gray-50 rounded-full transition-all z-20"
            style={{ 
              top: `${headerHeight/2 - 20}px`, // Center vertically (20 is half button height)
              right: '16px'
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Semi-transparent backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black bg-opacity-10 z-10"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              
              {/* Menu */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute z-20 w-full px-2"
                style={{ top: `${headerHeight}px` }}
              >
                <div className="bg-white shadow-lg border-t border-gray-100 w-full rounded-2xl overflow-hidden mx-auto max-w-4xl" 
                     style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  <div className="py-4 px-3 md:px-6 flex flex-col space-y-2">
                    <Link 
                      href="/about" 
                      className="flex items-center gap-2.5 text-gray-600 hover:text-bible-brown transition-all py-3 px-4 hover:bg-gray-50 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FaQuestionCircle size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">Sobre</span>
                    </Link>
                    <Link 
                      href="/contact" 
                      className="flex items-center gap-2.5 text-gray-600 hover:text-bible-brown transition-all py-3 px-4 hover:bg-gray-50 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FaEnvelope size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">Contato</span>
                    </Link>
                    <a 
                      href="https://github.com/guilhermelcassis/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-gray-600 hover:text-bible-brown transition-all py-3 px-4 hover:bg-gray-50 rounded-xl"
                      aria-label="GitHub"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FaGithub size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <section className="flex-grow w-full max-w-4xl p-0 md:px-6 flex flex-col">
          <div 
            className={`flex-grow flex flex-col rounded-2xl ${
              screen.isLandscape 
                ? 'h-[calc(100vh-90px)]' 
                : 'h-[calc(100vh-170px)]'
            }`}
          >
            <ChatContainer />
          </div>
        </section>

        <Footer isMobile={screen.isMobile} showContactLink={!screen.isLandscape} />
      </main>
    </ScreenContext.Provider>
  );
}
