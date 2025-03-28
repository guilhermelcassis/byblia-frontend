"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaQuestionCircle, FaGithub, FaBars, FaTimes, FaEnvelope } from 'react-icons/fa';
import ChatContainer from '@/components/ChatContainer';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
      <div className="w-full relative">
        <Header isMobile={isMobile} showBackButton={false} />
        
        <button 
          className={`absolute ${isMobile ? 'right-4 top-[12px]' : 'right-6 top-[0.925rem]'} flex items-center justify-center w-8 h-8 text-gray-400 hover:text-bible-brown hover:bg-gray-50 rounded-full transition-all z-20`}
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
          className="absolute top-[60px] left-0 right-0 bg-white shadow-sm border-b border-gray-50 z-20"
        >
          <div className="py-3 px-6 flex flex-col space-y-2">
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

      <section className="flex-grow w-full max-w-4xl p-4 md:p-6 flex flex-col">
        <div className="flex-grow flex flex-col h-[calc(100vh-180px)]">
          <ChatContainer />
        </div>
      </section>

      <Footer isMobile={isMobile} showContactLink={true} />
    </main>
  );
}
