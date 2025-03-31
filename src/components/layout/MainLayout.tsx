"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { FaGithub } from 'react-icons/fa';
import Link from 'next/link';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const touchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      setIsTouchDevice(touchDevice);
      
      // Add/remove touch-device class to body
      if (touchDevice) {
        document.body.classList.add('touch-device');
      } else {
        document.body.classList.remove('touch-device');
      }
    };

    // Check for touch capability
    checkTouch();

    // Handle scroll detection
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled) {
        document.documentElement.setAttribute('data-scroll', 'true');
      } else {
        document.documentElement.setAttribute('data-scroll', 'false');
      }
    };

    // Initialize scroll state
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      document.body.classList.remove('touch-device');
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Prevent scrolling when menu is open
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [menuOpen]);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`app-container ${menuOpen ? 'menu-open' : ''}`}>
      {/* Navbar fixa - fica fora do contexto de rolagem */}
      <Header 
        isMobile={isMobile}
        menuOpen={menuOpen}
        toggleMenu={() => setMenuOpen(!menuOpen)}
      />
      
      {/* Menu Dropdown - também fica fora do contexto de rolagem */}
      <div 
        className={`menu-backdrop ${menuOpen ? 'visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      
      <div className={`menu-dropdown ${menuOpen ? 'visible' : ''}`}>
        <nav className="flex flex-col space-y-4 p-6">
          <Link
            href="/"
            className="menu-item touch-area text-gray-900 hover:text-bible-brown"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about"
            className="menu-item touch-area text-gray-900 hover:text-bible-brown"
            onClick={() => setMenuOpen(false)}
          >
            Sobre
          </Link>
          <Link
            href="/contact"
            className="menu-item touch-area text-gray-900 hover:text-bible-brown"
            onClick={() => setMenuOpen(false)}
          >
            Contato
          </Link>
          <a
            href="https://github.com/guilhermelcassis/byblia-frontend"
            target="_blank"
            className="menu-item touch-area text-gray-900 hover:text-bible-brown flex items-center gap-2"
            rel="noopener noreferrer"
          >
            <FaGithub /> GitHub
          </a>
        </nav>
      </div>
      
      {/* Conteúdo rolável */}
      <main className="page-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout; 