"use client";

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { checkPWAStatus, isStandalone } from '@/lib/pwaHelper';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showDebugButton, setShowDebugButton] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDev = process.env.NODE_ENV === 'development';
    
    const status = checkPWAStatus();
    setIsIOS(status.isIOS);
    
    if (isDev) {
      setIsInstalled(false);
      setShowDebugButton(true);
      console.log("PWA debug mode: button will be shown");
    } else {
      setIsInstalled(status.isInstalled);
      
      if (isStandalone()) {
        setIsInstallable(false);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log("💡 beforeinstallprompt event captured!", e);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log("✅ PWA has been installed");
    };

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
      if (e.matches) {
        setIsInstallable(false);
      }
      console.log("📱 Display mode changed", e.matches);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    console.log("PWA Status:", {
      isInstallable,
      isIOS: status.isIOS,
      isInstalled: status.isInstalled,
      isStandalone: isStandalone(),
      userAgent: navigator.userAgent,
      hasPrompt: !!deferredPrompt
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
          setIsInstalled(true);
        } else {
          console.log('❌ User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setIsInstallable(false);
      } catch (error) {
        console.error('⚠️ Error during installation:', error);
      }
    } else if (isIOS) {
      console.log("📱 iOS device detected, showing installation instructions");
    } else {
      console.log("⚠️ Installation prompt not available, but button was clicked");
      alert("Este aplicativo pode ser instalado apenas quando atender aos requisitos do navegador para aplicativos instaláveis. Tente novamente após navegar pelo site por mais tempo.");
    }
  };

  const shouldShowButton = showDebugButton || (isInstallable && !!deferredPrompt);

  return (
    <div className="install-button-container">
      {shouldShowButton ? (
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-black dark:from-gray-300 dark:to-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Download size={18} />
          <span>Instalar App</span>
        </button>
      ) : isIOS ? (
        <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
          <p className="mb-2">Para instalar no iOS:</p>
          <div className="flex items-center gap-1">
            <span>Toque em</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12h8M12 8v8" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span>e depois em "Adicionar à Tela de Início"</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PWAInstallButton; 