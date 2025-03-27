"use client";

import React from 'react';
import { FaArrowLeft, FaGithub, FaQuestionCircle, FaFire } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function About() {
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
            <Link href="/" className="flex items-center gap-2 text-bible-darkbrown hover:text-bible-brown transition-colors">
              <FaArrowLeft size={16} />
              <h1 className="text-2xl font-bold tracking-tight">Byblia</h1>
            </Link>
          </motion.div>
        </div>
      </header>

      <section className="flex-grow w-full max-w-5xl p-6 md:p-8 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-lg max-w-none"
        >
          <h1 className="text-3xl font-bold text-bible-brown mb-8">Sobre a Byblia</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-medium text-bible-darkbrown mb-4">O que é a Byblia?</h2>
            <p className="text-gray-700 mb-4">
              Byblia é um agente bíblico alimentado por inteligência artificial que fornece orientação baseada nas Escrituras Sagradas para qualquer pergunta ou situação da vida.
            </p>
            <p className="text-gray-700">
              Diferente de outros assistentes virtuais, a Byblia utiliza exclusivamente a Bíblia como fonte de sabedoria, oferecendo respostas fundamentadas nas Escrituras para desafios cotidianos, dúvidas espirituais, ou questões teológicas.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-bible-darkbrown">Como utilizar</h2>
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <FaFire className="text-orange-600" />
                Temas desafiadores
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              O uso da Byblia é simples e intuitivo. Basta digitar qualquer pergunta, dúvida ou situação no campo de mensagem e enviar. Aqui estão alguns exemplos de temas desafiadores que você pode explorar:
            </p>
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
              {[
                {
                  title: "Questões sobre sexualidade", 
                  question: "O que a Bíblia realmente ensina sobre homossexualidade e como devo me relacionar com pessoas LGBTQ+?",
                  color: "bg-purple-50 border-purple-200"
                },
                {
                  title: "Casamento e divórcio", 
                  question: "É permissível um cristão se divorciar e se casar novamente? Quais são as bases bíblicas?",
                  color: "bg-blue-50 border-blue-200"
                },
                {
                  title: "Ciência e fé", 
                  question: "Como conciliar o relato bíblico da criação com as teorias científicas modernas sobre a origem do universo?",
                  color: "bg-green-50 border-green-200"
                },
                {
                  title: "Papel da mulher", 
                  question: "Qual é o posicionamento bíblico sobre mulheres em funções de liderança na igreja e o ensino de Paulo nesse tema?",
                  color: "bg-pink-50 border-pink-200"
                },
                {
                  title: "Predestinação vs. livre-arbítrio", 
                  question: "Deus já determinou tudo que vai acontecer ou temos livre-arbítrio para tomar nossas decisões?",
                  color: "bg-indigo-50 border-indigo-200"
                },
                {
                  title: "Sofrimento e mal", 
                  question: "Por que Deus permite o sofrimento e tragédias no mundo se Ele é amoroso e todo-poderoso?",
                  color: "bg-red-50 border-red-200"
                },
                {
                  title: "Política e fé", 
                  question: "Como um cristão deve se posicionar politicamente? Existe uma orientação bíblica para questões políticas atuais?",
                  color: "bg-amber-50 border-amber-200"
                }
              ].map((item, index) => (
                <div key={index} className={`p-4 border-b ${item.color} last:border-b-0`}>
                  <div className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <FaQuestionCircle className="text-bible-brown" size={14} />
                    {item.title}
                  </div>
                  <div className="text-gray-700 text-sm italic">"{item.question}"</div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 italic">
                "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça." — 2 Timóteo 3:16
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-medium text-bible-darkbrown mb-4">Limitações</h2>
            <p className="text-gray-700 mb-4">
              É importante lembrar que a Byblia:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li className="mb-2">Não substitui aconselhamento profissional (psicológico, médico, legal, etc.)</li>
              <li className="mb-2">Baseia suas respostas na interpretação das Escrituras através da IA</li>
              <li className="mb-2">Pode não refletir todas as perspectivas teológicas existentes</li>
              <li className="mb-2">Aborda temas polêmicos com base nas Escrituras, sem assumir posições denominacionais específicas</li>
              <li>Serve como ferramenta de apoio e reflexão, não como autoridade final</li>
            </ul>
          </div>

          <div className="text-center text-gray-600 text-sm mt-8">
            <p>
              Byblia é um projeto de código aberto desenvolvido para fornecer orientação bíblica através de IA.
            </p>
            <a 
              href="https://github.com/guilhermelcassis/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-bible-brown transition-colors mt-4"
            >
              <FaGithub size={18} />
              <span className="font-medium">github.com/guilhermelcassis</span>
            </a>
          </div>
        </motion.div>
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