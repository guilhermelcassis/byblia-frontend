"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaQuestionCircle, FaGithub } from 'react-icons/fa';
import ChatContainer from '../components/ChatContainer';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white relative pb-16">
      <header className="w-full bg-white text-bible-darkbrown py-6 px-4 shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex flex-row items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <h1 className="text-2xl font-bold tracking-tight">Byblia</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden md:flex items-center"
          >
            <p className="text-center text-md max-w-xl font-light text-gray-600">
              Orientação bíblica para todas as questões da vida através de IA
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-5"
          >
            <a 
              href="https://github.com/guilhermelcassis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-bible-brown transition-colors"
              aria-label="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <Link 
              href="/about" 
              className="flex items-center gap-2 text-gray-500 hover:text-bible-brown transition-colors"
            >
              <FaQuestionCircle size={20} />
              <span className="hidden sm:inline text-sm font-medium">Sobre</span>
            </Link>
          </motion.div>
        </div>
      </header>

      <section className="flex-grow w-full max-w-5xl p-4 md:p-8 flex flex-col">
        <div className="flex-grow flex flex-col h-[calc(100vh-180px)]">
          <ChatContainer />
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 w-full bg-white py-4 border-t-2 border-gray-200 shadow-md z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="mb-2 md:mb-0">
            © {new Date().getFullYear()} Byblia - Agente Bíblico que utiliza IA para responder perguntas à luz das Escrituras Sagradas
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/guilhermelcassis/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-bible-brown flex items-center gap-1 transition-colors">
              <FaGithub size={14} />
              <span className="font-medium">guilhermelcassis</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
