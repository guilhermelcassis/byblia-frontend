"use client";

import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useScreen } from '@/app/page';

interface HeaderProps {
  showBackButton?: boolean;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showBackButton = true,
  isMobile 
}) => {
  // Use the shared screen context
  const screen = useScreen();
  
  return (
    <header 
      className="w-full bg-white text-gray-800 shadow-sm sticky top-0 z-10 flex items-center"
      style={{ 
        height: screen.isLandscape ? '44px' : '52px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-row items-center justify-between w-full h-full">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center h-full"
        >
          <Link href="/" className="flex items-center gap-2 text-bible-brown transition-colors">
            {showBackButton && <FaArrowLeft size={14} className="relative top-[-1px]" />}
            <h1 className={`${screen.isLandscape ? 'text-base' : 'text-lg'} font-semibold tracking-tight flex items-center`}>
              <span className="byblia-logo text-gray-900">Bybl.ia</span>
            </h1>
          </Link>
        </motion.div>
        
        <h2 className={`text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap text-center overflow-hidden text-ellipsis flex-grow mx-4 font-bolsonse ${screen.isLandscape ? 'hidden' : ''}`}>
          {isMobile ? "" : "Seu conselheiro bíblico."}
        </h2>
      </div>
    </header>
  );
};

export default Header; 