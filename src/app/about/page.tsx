"use client";

import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaGithub, FaQuestionCircle, FaFire, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';
import './about-mobile.css';

export default function About() {
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`flex items-center gap-2 ${isMobile ? 'absolute left-0' : ''}`}
          >
            <Link href="/" className="flex items-center gap-2 text-bible-brown transition-colors">
              <FaArrowLeft size={14} />
              <h1 className="text-lg font-semibold tracking-tight">Byblia</h1>
            </Link>
          </motion.div>
          
          <h2 className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap text-center overflow-hidden text-ellipsis flex-grow mx-auto">
            {isMobile ? "" : "Converse e receba orientação baseada nas Escrituras"}
          </h2>
        </div>
      </header>

      <section className="flex-grow w-full max-w-4xl p-4 md:p-6 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${isMobile ? 'prose-sm' : 'prose'} max-w-2xl mx-auto`}
          style={isMobile ? {
            fontSize: '0.9rem',
            lineHeight: '1.5'
          } : undefined}
        >
          <h1 
            className="text-center font-bold text-bible-brown mb-6"
            style={{ 
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              marginTop: isMobile ? '0.5rem' : '1rem',
              lineHeight: '1.3'
            }}
          >
            Sobre a Byblia
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-700 max-w-lg mx-auto" style={{ fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: '1.7' }}>
              Byblia é um agente bíblico alimentado por inteligência artificial que fornece orientação baseada nas Escrituras Sagradas para qualquer pergunta ou situação da vida.
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 
                  className="text-bible-brown font-medium mb-3"
                  style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
                >
                  O que é a Byblia?
                </h2>
                <p 
                  className="text-gray-700"
                  style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
                >
                  Diferente de outros assistentes virtuais, a Byblia utiliza exclusivamente a Bíblia como fonte de sabedoria, oferecendo respostas fundamentadas nas Escrituras para desafios cotidianos, dúvidas espirituais, ou questões teológicas.
                </p>
              </div>
              
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <h2 
                    className="text-bible-brown font-medium"
                    style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
                  >
                    Como utilizar
                  </h2>
                </div>
                <p 
                  className="text-gray-700 mb-4"
                  style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
                >
                  O uso da Byblia é simples e intuitivo. Basta digitar qualquer pergunta, dúvida ou situação no campo de mensagem e enviar. Aqui estão alguns exemplos de temas que você pode explorar:
                </p>
                
                <div className="space-y-2 mb-4">
                  {[
                    {
                      title: "Questões sobre sexualidade", 
                      question: "O que a Bíblia realmente ensina sobre homossexualidade e como devo me relacionar com pessoas LGBTQ+?"
                    },
                    {
                      title: "Casamento e divórcio", 
                      question: "É permissível um cristão se divorciar e se casar novamente? Quais são as bases bíblicas?"
                    },
                    {
                      title: "Ciência e fé", 
                      question: "Como conciliar o relato bíblico da criação com as teorias científicas modernas?"
                    }
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div 
                        className="font-medium mb-1 flex items-center gap-2 text-gray-800"
                        style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}
                      >
                        <FaQuestionCircle className="text-bible-brown" size={isMobile ? 12 : 14} />
                        <span>{item.title}</span>
                      </div>
                      <div 
                        className="italic text-gray-700"
                        style={{ fontSize: isMobile ? '0.8rem' : '0.85rem' }}
                      >
                        "{item.question}"
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                  <p className="text-gray-700 italic" style={{ fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
                    "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça."
                    <br />
                    <span className="font-medium text-bible-brown mt-1 inline-block">2 Timóteo 3:16</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 
                className="text-bible-brown font-medium mb-4"
                style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                Limitações
              </h2>
              <p 
                className="text-gray-700 mb-3"
                style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
              >
                É importante lembrar que a Byblia:
              </p>
              <ul 
                className="list-disc pl-5 text-gray-700 space-y-2"
                style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
              >
                <li>Não substitui aconselhamento profissional (psicológico, médico, legal, etc.)</li>
                <li>Baseia suas respostas na interpretação das Escrituras através da IA</li>
                <li>Pode não refletir todas as perspectivas teológicas existentes</li>
                <li>Aborda temas polêmicos com base nas Escrituras, sem assumir posições denominacionais específicas</li>
                <li>Serve como ferramenta de apoio e reflexão, não como autoridade final</li>
              </ul>
            </div>
          </div>

          <div className="text-center text-gray-500 mt-8 mb-16">
            <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
              Byblia é um projeto de código aberto desenvolvido para fornecer orientação bíblica através de IA.
            </p>
            <a 
              href="https://github.com/guilhermelcassis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-bible-brown transition-colors mt-3"
            >
              <FaGithub size={isMobile ? 16 : 18} />
              <span className="font-medium" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>github.com/guilhermelcassis</span>
            </a>
          </div>
        </motion.div>
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