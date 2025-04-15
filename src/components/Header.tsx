"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Menu, 
  X
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  showBackButton?: boolean;
  isMobile: boolean;
  menuOpen?: boolean;
  toggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  showBackButton = false,
  isMobile,
  menuOpen = false,
  toggleMenu = () => {} 
}) => {
  // Use the shared screen context
  const screen = useScreen();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  
  // Track scroll position to add shadow and background changes
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // No navigation items since there's only one page
  const navItems: any[] = [];
  
  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled ? 'shadow-md' : 'bg-transparent'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className={`flex items-center justify-between w-full h-16 px-4 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800`}>
        {/* Logo and back button section */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 py-2 transition-all duration-300 hover:opacity-90"
            aria-label="Voltar para a página inicial"
          >
            {showBackButton && (
              <motion.div 
                className="flex items-center justify-center mr-1"
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowLeft 
                  size={14} 
                  className="text-gray-800 dark:text-white" 
                  aria-hidden="true" 
                />
              </motion.div>
            )}
            <h1 className="font-semibold tracking-tight flex items-center">
              <span className="byblia-logo font-boldonse">
                Bybl.ia
              </span>
            </h1>
          </Link>
        </div>
        
        {/* Tagline - Only visible on desktop */}
        {!isMobile && (
          <div className="flex-1 items-center justify-center px-4 hidden md:flex">
            <motion.h2 
              className="text-base font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap text-center" 
              style={{ letterSpacing: '0.01em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Seu conselheiro bíblico
            </motion.h2>
          </div>
        )}

        {/* Menu button with animation - only if we have navigation items */}
        {isMobile && navItems.length > 0 && (
          <div className="flex items-center justify-end">
            <motion.button 
              className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={toggleMenu}
              whileTap={{ scale: 0.95 }}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
            >
              <AnimatePresence mode="wait">
                {menuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={18} className="text-gray-800 dark:text-white" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={18} className="text-gray-800 dark:text-white" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default Header; 