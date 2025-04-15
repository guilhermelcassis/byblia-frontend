export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
}

export const checkPWAStatus = (): PWAStatus => {
  if (typeof window === 'undefined') {
    return {
      isInstallable: false,
      isInstalled: false,
      isIOS: false
    };
  }

  // Check if the app is running in standalone mode (already installed)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;

  // Check if device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return {
    isInstallable: true, // This will be refined by the component based on event listeners
    isInstalled,
    isIOS
  };
};

export const getPWADisplayMode = (): string => {
  if (typeof window === 'undefined') return 'browser';
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  
  if ((window.navigator as any).standalone === true) {
    return 'standalone-ios';
  }
  
  return 'browser';
};

export const isStandalone = (): boolean => {
  return getPWADisplayMode() !== 'browser';
}; 