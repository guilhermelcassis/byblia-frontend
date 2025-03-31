"use client";

import React from 'react';
import { FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScreen } from '@/hooks/useScreen';

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
  
  return (
    <header className="navbar-fixed w-full bg-white text-gray-800 flex items-center">
      <div className="max-w-4xl mx-auto flex flex-row items-center justify-between w-full px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center flex-1"
        >
          <Link 
            href="/" 
            className="flex items-center gap-2 text-bible-brown transition-colors hover:opacity-90 py-2"
            aria-label="Voltar para a página inicial"
          >
            {showBackButton && (
              <FaArrowLeft 
                size={14} 
                className="relative text-gray-500" 
                aria-hidden="true" 
              />
            )}
            <h1 className="font-semibold tracking-tight flex items-center">
              <span className="byblia-logo text-gray-900">Bybl.ia</span>
            </h1>
          </Link>
        </motion.div>
        
        <div className="flex-1 flex items-center justify-center">
          <h2 className={`${screen.isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-600 whitespace-nowrap text-center ${screen.isMobile ? 'hidden md:block' : ''}`} style={{ letterSpacing: '0.01em' }}>
            Seu conselheiro bíblico
          </h2>
        </div>
        
        {/* Botão do menu hamburger */}
        <div className="flex items-center justify-end flex-1">
          <motion.button 
            className="flex items-center justify-center text-gray-500 hover:text-bible-brown hover:bg-gray-50 rounded-full transition-all mobile-menu-button touch-area"
            style={{
              width: screen.isMobile ? '40px' : '44px',
              height: screen.isMobile ? '40px' : '44px'
            }}
            onClick={toggleMenu}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            whileTap={{ scale: 0.95 }}
          >
            {menuOpen ? (
              <FaTimes size={screen.isMobile ? 16 : 18} aria-hidden="true" />
            ) : (
              <FaBars size={screen.isMobile ? 16 : 18} aria-hidden="true" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header; 