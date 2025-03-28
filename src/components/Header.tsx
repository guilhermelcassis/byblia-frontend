"use client";

import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeaderProps {
  showBackButton?: boolean;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showBackButton = true,
  isMobile 
}) => {
  return (
    <header className="w-full bg-white text-gray-800 py-3 px-4 shadow-sm border-b border-gray-50 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-row items-center justify-between">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center gap-2 text-bible-brown transition-colors">
            {showBackButton && <FaArrowLeft size={14} />}
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="byblia-logo text-gray-900">Bybl.ia</span>
            </h1>
          </Link>
        </motion.div>
        
        <h2 className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap text-center overflow-hidden text-ellipsis flex-grow mx-4 font-bolsonse">
          {isMobile ? "" : "Seu conselheiro bíblico."}
        </h2>
      </div>
    </header>
  );
};

export default Header; 