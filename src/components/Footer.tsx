"use client";

import React from 'react';
import { FaGithub, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';
import { useScreen } from '@/hooks/useScreen';

interface FooterProps {
  isMobile: boolean;
  showContactLink?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  isMobile,
  showContactLink = true 
}) => {
  // Use the shared screen context
  const screen = useScreen();
  
  return (
    <footer 
      className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-50 shadow-xs z-10 ${
        screen.isLandscape ? 'py-0.5' : isMobile ? 'py-1' : 'py-1.5'
      }`}
      style={{ 
        height: screen.isLandscape ? '22px' : (isMobile ? '28px' : 'auto'),
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div 
        className="max-w-4xl mx-auto px-4 flex flex-row justify-between items-center text-[10px] md:text-xs text-gray-400"
        style={{
          padding: screen.isLandscape ? '0 12px' : isMobile ? '0 16px' : undefined
        }}
      >
        <div className="flex items-center gap-2">
          <div>
            © {new Date().getFullYear()} Byblia
          </div>
          {showContactLink && !screen.isLandscape && (
            <>
              <span className="hidden md:inline">•</span>
              <Link href="/contact" className="text-gray-400 hover:text-bible-brown transition-colors hidden md:flex items-center">
                <FaEnvelope size={12} className="mr-1" />
                <span className="font-medium">Contato</span>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center">
          <a href="https://github.com/guilhermelcassis/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-bible-brown flex items-center transition-colors">
            <FaGithub size={screen.isLandscape ? 10 : 12} className="md:mr-1" />
            <span className="font-medium hidden md:inline">guilhermelcassis</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 