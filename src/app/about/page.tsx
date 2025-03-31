"use client";

import React, { useEffect } from 'react';
import { FaGithub, FaQuestionCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './about-mobile.css';
import MainLayout from '@/components/layout/MainLayout';
import { ScreenProvider, useScreen } from '@/hooks/useScreen';
import { useMouseEffect } from '@/hooks/useMouseEffect';

export default function About() {
  return (
    <ScreenProvider>
      <AboutContent />
    </ScreenProvider>
  );
}

function AboutContent() {
  const screen = useScreen();
  
  // Integrar o efeito de mouse para melhorar a experiência em desktop
  useMouseEffect();

  // Controle de zoom e visualização para melhorar a experiência em dispositivos móveis
  useEffect(() => {
    if (screen.isMobile) {
      // Função para garantir que não haja zoom automático
      const preventZoom = (e: TouchEvent) => {
        // Previne zoom apenas quando há múltiplos toques (pinch zoom)
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Função para resetar o zoom ao carregar a página
      const resetZoom = () => {
        // Faz um reset no zoom da página para garantir visibilidade completa
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
          viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
          
          // Permite zoom controlado após um curto período
          setTimeout(() => {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no');
          }, 500);
        }
        
        // Aplicar uma transformação direta para garantir que não haja zoom
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = 'center top';
        
        // Reset completo de transformações que podem causar zoom
        setTimeout(() => {
          document.body.style.transform = 'none';
          document.documentElement.style.transform = 'none';
          // Forçar recálculo de layout para garantir que o zoom seja realmente resetado
          void document.body.offsetHeight;
        }, 50);
      };
      
      // Função para controlar zoom quando a visibilidade da página muda
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          resetZoom();
        }
      };
      
      // Resetar zoom ao carregar
      resetZoom();
      
      // Também resetar quando a tab ficar visível novamente
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Prevenir zoom por pinça (pinch zoom)
      document.addEventListener('touchstart', preventZoom, { passive: false });
      
      // Adicionar mais um nivel de garantia para prevenir zoom no iOS
      const handleOrientationChange = () => {
        setTimeout(resetZoom, 300); // Atraso para permitir que a mudança de orientação seja concluída
      };
      
      // Resetar zoom quando a orientação da tela mudar
      window.addEventListener('orientationchange', handleOrientationChange);
      
      return () => {
        // Limpar todos os listeners
        document.removeEventListener('touchstart', preventZoom);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('orientationchange', handleOrientationChange);
      };
    }
  }, [screen.isMobile]);

  return (
    <MainLayout>
      <section className="w-full max-w-4xl p-4 md:p-6 mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full ${screen.isMobile ? 'prose-sm' : 'prose'} max-w-2xl mx-auto`}
          style={screen.isMobile ? {
            fontSize: '0.9rem',
            lineHeight: '1.5'
          } : undefined}
        >
          <h1 
            className="text-center font-bold text-bible-brown mb-6 byblia-title-lg"
            style={{ 
              marginTop: screen.isMobile ? '0.5rem' : '1rem',
              lineHeight: '1.3'
            }}
          >
            Sobre a Byblia
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-700 max-w-lg mx-auto" style={{ fontSize: screen.isMobile ? '0.9rem' : '1rem', lineHeight: '1.7' }}>
              Byblia é um agente bíblico alimentado por inteligência artificial que fornece orientação baseada nas Escrituras Sagradas para qualquer pergunta ou situação da vida.
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 
                  className="text-bible-brown font-medium mb-3 byblia-title-sm"
                  style={{ fontSize: screen.isMobile ? '1.1rem' : '1.25rem' }}
                >
                  O que é a Byblia?
                </h2>
                <p 
                  className="text-gray-700"
                  style={{ fontSize: screen.isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
                >
                  Diferente de outros assistentes virtuais, a Byblia utiliza exclusivamente a Bíblia como fonte de sabedoria, oferecendo respostas fundamentadas nas Escrituras para desafios cotidianos, dúvidas espirituais, ou questões teológicas.
                </p>
              </div>
              
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <h2 
                    className="text-bible-brown font-medium byblia-title-sm"
                    style={{ fontSize: screen.isMobile ? '1.1rem' : '1.25rem' }}
                  >
                    Como utilizar
                  </h2>
                </div>
                <p 
                  className="text-gray-700 mb-4"
                  style={{ fontSize: screen.isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
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
                        style={{ fontSize: screen.isMobile ? '0.85rem' : '0.9rem' }}
                      >
                        <FaQuestionCircle className="text-bible-brown" size={screen.isMobile ? 12 : 14} />
                        <span>{item.title}</span>
                      </div>
                      <div 
                        className="italic text-gray-700"
                        style={{ fontSize: screen.isMobile ? '0.8rem' : '0.85rem' }}
                      >
                        "{item.question}"
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                  <p className="text-gray-700 italic" style={{ fontSize: screen.isMobile ? '0.8rem' : '0.85rem' }}>
                    "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça."
                    <br />
                    <span className="font-medium text-bible-brown mt-1 inline-block">2 Timóteo 3:16</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 
                className="text-bible-brown font-medium mb-4 byblia-title-sm"
                style={{ fontSize: screen.isMobile ? '1.1rem' : '1.25rem' }}
              >
                Limitações
              </h2>
              <p 
                className="text-gray-700 mb-3"
                style={{ fontSize: screen.isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
              >
                É importante lembrar que a Byblia:
              </p>
              <ul 
                className="list-disc pl-5 text-gray-700 space-y-2"
                style={{ fontSize: screen.isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
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
            <p style={{ fontSize: screen.isMobile ? '0.8rem' : '0.9rem' }}>
              Byblia é um projeto de código aberto desenvolvido para fornecer orientação bíblica através de IA.
            </p>
            <a 
              href="https://github.com/guilhermelcassis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-bible-brown transition-colors mt-3"
            >
              <FaGithub size={screen.isMobile ? 16 : 18} />
              <span className="font-medium" style={{ fontSize: screen.isMobile ? '0.8rem' : '0.9rem' }}>github.com/guilhermelcassis</span>
            </a>
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
} 