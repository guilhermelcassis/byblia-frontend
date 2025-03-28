"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQuestionCircle, FaGithub, FaBars, FaTimes, FaEnvelope } from 'react-icons/fa';
import ChatContainer from '../components/ChatContainer';
import Link from 'next/link';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verificar inicialmente
    checkIsMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar listener ao desmontar
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <main className={`flex min-h-screen flex-col items-center bg-white relative ${isMobile ? 'pb-8' : 'pb-16'}`}>
      <header className={`w-full bg-white text-gray-800 ${isMobile ? 'py-4' : 'py-3'} px-4 shadow-sm border-b border-gray-50 sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto flex flex-row items-center justify-between relative">
          <Link href="/" className={`text-lg font-semibold tracking-tight text-bible-brown transition-colors ${isMobile ? 'absolute left-0' : ''}`}>
            Byblia
          </Link>
          
          <h2 className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap text-center overflow-hidden text-ellipsis flex-grow mx-auto">
            {isMobile ? "" : "Converse e receba orientação baseada nas Escrituras"}
          </h2>
          
          <button 
            className={`flex items-center justify-center w-8 h-8 text-gray-400 hover:text-bible-brown hover:bg-gray-50 rounded-full transition-all ${isMobile ? 'absolute right-0' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>
        
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-white shadow-sm border-b border-gray-50 z-20"
          >
            <div className="py-3 px-6 flex flex-col space-y-2">
              <p className="text-xs text-gray-500 pb-2 border-b border-gray-100">
                Converse e receba orientação baseada nas Escrituras
              </p>
              <Link 
                href="/about" 
                className="flex items-center gap-2 text-gray-600 hover:text-bible-brown transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaQuestionCircle size={15} />
                <span className="text-sm">Sobre</span>
              </Link>
              <Link 
                href="/contact" 
                className="flex items-center gap-2 text-gray-600 hover:text-bible-brown transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaEnvelope size={15} />
                <span className="text-sm">Contato</span>
              </Link>
              <a 
                href="https://github.com/guilhermelcassis/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-bible-brown transition-colors py-2"
                aria-label="GitHub"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaGithub size={15} />
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </header>

      <section className="flex-grow w-full max-w-4xl p-4 md:p-6 flex flex-col">
        <div className="flex-grow flex flex-col h-[calc(100vh-180px)]">
          <ChatContainer />
        </div>
      </section>

      <footer 
        className="fixed bottom-0 left-0 w-full bg-white py-1.5 border-t border-gray-50 shadow-xs z-10"
        style={{ 
          height: isMobile ? '28px' : 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div 
          className="max-w-4xl mx-auto px-4 flex flex-row justify-between items-center text-[10px] md:text-xs text-gray-400"
          style={{
            padding: isMobile ? '0 16px' : undefined
          }}
        >
          <div className="flex items-center gap-2">
            <div>© {new Date().getFullYear()} Byblia</div>
            <span className="hidden md:inline">•</span>
            <Link href="/contact" className="text-gray-400 hover:text-bible-brown transition-colors hidden md:flex items-center">
              <FaEnvelope size={12} className="mr-1" />
              <span className="font-medium">Contato</span>
            </Link>
          </div>
          <div className="flex items-center">
            <a href="https://github.com/guilhermelcassis/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-bible-brown flex items-center transition-colors">
              <FaGithub size={12} className="md:mr-1" />
              <span className="font-medium hidden md:inline">guilhermelcassis</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
