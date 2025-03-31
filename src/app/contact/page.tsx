"use client";

import React, { useEffect } from 'react';
import { FaGithub, FaEnvelope, FaLinkedin, FaInstagram } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { ScreenProvider, useScreen } from '@/hooks/useScreen';
import { useMouseEffect } from '@/hooks/useMouseEffect';

export default function Contact() {
  return (
    <ScreenProvider>
      <ContactContent />
    </ScreenProvider>
  );
}

function ContactContent() {
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

  // Lista de contatos e redes sociais
  const contactInfo = [
    {
      icon: <FaEnvelope size={screen.isMobile ? 16 : 18} />,
      label: "Email",
      value: "guilhermelcassis@gmail.com",
      link: "mailto:guilhermelcassis@gmail.com"
    },
    {
      icon: <FaGithub size={screen.isMobile ? 16 : 18} />,
      label: "GitHub",
      value: "github.com/guilhermelcassis",
      link: "https://github.com/guilhermelcassis/"
    },
    {
      icon: <FaLinkedin size={screen.isMobile ? 16 : 18} />,
      label: "LinkedIn",
      value: "linkedin.com/in/guilcassis",
      link: "https://www.linkedin.com/in/guilcassis/"
    },
    {
      icon: <FaInstagram size={screen.isMobile ? 16 : 18} />,
      label: "Instagram",
      value: "instagram.com/guilhermelcassis",
      link: "https://www.instagram.com/guilhermelcassis/"
    }
  ];

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
            Contato
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-700 max-w-lg mx-auto" style={{ fontSize: screen.isMobile ? '0.9rem' : '1rem', lineHeight: '1.7' }}>
              Tem alguma dúvida, sugestão ou feedback? Entre em contato com o criador da Byblia através dos canais abaixo.
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden p-5">
              <h2 
                className="text-bible-brown font-medium mb-4 byblia-title-sm"
                style={{ fontSize: screen.isMobile ? '1.1rem' : '1.25rem' }}
              >
                Informações de Contato
              </h2>
              
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <a 
                    key={index}
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-200 text-bible-brown group-hover:text-white group-hover:bg-bible-brown transition-colors">
                      {contact.icon}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-sm text-gray-900">{contact.label}</p>
                      <p className="text-sm text-gray-600">{contact.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 
                className="text-bible-brown font-medium mb-3 byblia-title-sm"
                style={{ fontSize: screen.isMobile ? '1.1rem' : '1.25rem' }}
              >
                Envie uma Mensagem
              </h2>
              <p 
                className="text-gray-700 mb-3"
                style={{ fontSize: screen.isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
              >
                Sinta-se à vontade para enviar uma mensagem direta para qualquer um dos canais acima. Seu feedback é muito importante para a melhoria contínua da Byblia.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100 mt-4">
                <p className="text-gray-700 italic" style={{ fontSize: screen.isMobile ? '0.8rem' : '0.85rem' }}>
                  "Como o ferro afia o ferro, assim uma pessoa afia o entendimento da outra."
                  <br />
                  <span className="font-medium text-bible-brown mt-1 inline-block">Provérbios 27:17</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 mb-16">
            <Link 
              href="/" 
              className="px-6 py-3 bg-bible-brown text-white rounded-lg font-medium hover:bg-bible-darkbrown transition-colors shadow-sm"
            >
              Voltar para o Início
            </Link>
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
} 