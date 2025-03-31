"use client";

import React from 'react';
import ChatContainer from '@/components/ChatContainer';
import { ScreenProvider, useScreen } from '@/hooks/useScreen';
import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <ScreenProvider>
      <HomeContent />
    </ScreenProvider>
  );
}

function HomeContent() {
  const screen = useScreen();

  return (
    <MainLayout>
      <section className="w-full max-w-4xl p-2 md:px-6 mx-auto flex flex-col">
        <div className="flex-grow flex flex-col rounded-2xl h-[calc(100vh-80px)]">
          <ChatContainer />
        </div>
      </section>
    </MainLayout>
  );
}
