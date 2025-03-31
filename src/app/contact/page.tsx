"use client";

import React, { useEffect, useState } from 'react';
import { FaGithub, FaEnvelope, FaLinkedin, FaInstagram } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';

export default function Contact() {
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

  // Lista de contatos e redes sociais
  const contactInfo = [
    {
      icon: <FaEnvelope size={isMobile ? 16 : 18} />,
      label: "Email",
      value: "guilhermelcassis@gmail.com",
      link: "mailto:guilhermelcassis@gmail.com"
    },
    {
      icon: <FaGithub size={isMobile ? 16 : 18} />,
      label: "GitHub",
      value: "github.com/guilhermelcassis",
      link: "https://github.com/guilhermelcassis/"
    },
    {
      icon: <FaLinkedin size={isMobile ? 16 : 18} />,
      label: "LinkedIn",
      value: "linkedin.com/in/guilcassis",
      link: "https://www.linkedin.com/in/guilcassis/"
    },
    {
      icon: <FaInstagram size={isMobile ? 16 : 18} />,
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
          className={`w-full ${isMobile ? 'prose-sm' : 'prose'} max-w-2xl mx-auto`}
          style={isMobile ? {
            fontSize: '0.9rem',
            lineHeight: '1.5'
          } : undefined}
        >
          <h1 
            className="text-center font-bold text-bible-brown mb-6 byblia-title-lg"
            style={{ 
              marginTop: isMobile ? '0.5rem' : '1rem',
              lineHeight: '1.3'
            }}
          >
            Contato
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-700 max-w-lg mx-auto" style={{ fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: '1.7' }}>
              Tem alguma dúvida, sugestão ou feedback? Entre em contato com o criador da Byblia através dos canais abaixo.
            </p>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden p-5">
              <h2 
                className="text-bible-brown font-medium mb-4 byblia-title-sm"
                style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
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
                style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                Envie uma Mensagem
              </h2>
              <p 
                className="text-gray-700 mb-3"
                style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', lineHeight: '1.6' }}
              >
                Sinta-se à vontade para enviar uma mensagem direta para qualquer um dos canais acima. Seu feedback é muito importante para a melhoria contínua da Byblia.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100 mt-4">
                <p className="text-gray-700 italic" style={{ fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
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