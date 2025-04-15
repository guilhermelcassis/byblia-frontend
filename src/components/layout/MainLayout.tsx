"use client";

import React, { useState, useEffect } from 'react';
import { 
  Menu,
  X,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { FaBible } from 'react-icons/fa';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Add the global declaration at the top level
declare global {
  interface Window {
    copyCodeToClipboard: (button: HTMLButtonElement) => void;
  }
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const checkTouch = () => {
      const touchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      
      if (touchDevice) {
        document.body.classList.add('touch-device');
        setIsTouchDevice(true);
      }
    };

    checkTouch();

    // Handle scroll detection with debouncing for better performance
    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const isScrolled = window.scrollY > 10;
        setScrolled(isScrolled);
        
        if (isScrolled) {
          document.documentElement.setAttribute('data-scroll', 'true');
          document.body.classList.add('is-scrolled');
        } else {
          document.documentElement.setAttribute('data-scroll', 'false');
          document.body.classList.remove('is-scrolled');
        }
      }, 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      document.body.classList.remove('touch-device');
      document.body.classList.remove('is-scrolled');
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
    }
  }, [menuOpen]);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add function to copy code blocks
  useEffect(() => {
    // Define the function globally so it can be called from inline handlers
    (window as Window).copyCodeToClipboard = (button: HTMLButtonElement) => {
      // Find the code element within the same code block
      const codeBlock = button.closest('.code-block');
      if (!codeBlock) return;
      
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;
      
      // Get the text content and clean it up
      const codeText = codeElement.textContent || '';
      
      // Copy to clipboard
      navigator.clipboard.writeText(codeText).then(() => {
        // Show success state
        const originalText = button.textContent;
        button.textContent = 'Copiado!';
        button.classList.add('text-green-400');
        
        // Reset after a delay
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('text-green-400');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        button.textContent = 'Erro!';
        button.classList.add('text-red-400');
        
        setTimeout(() => {
          button.textContent = 'Copiar';
          button.classList.remove('text-red-400');
        }, 2000);
      });
    };
    
    return () => {
      // Clean up
      delete (window as any).copyCodeToClipboard;
    };
  }, []);

  // No navigation links since there's only one page
  const navItems: any[] = [];

  const handleClose = () => {
    setMenuOpen(false);
  };

  // Menu animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25, ease: "easeInOut" } }
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeInOut" } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut", staggerChildren: 0.05 } }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-900 font-sans overflow-hidden m-0 p-0">
      {/* Main content com design moderno e clean */}
      <main className="flex-grow overflow-hidden flex flex-col w-full relative m-0 p-0">
        {/* Clean background with no decorative elements */}
        
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col overflow-hidden px-4 md:px-6 pb-6 pt-0 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout; 