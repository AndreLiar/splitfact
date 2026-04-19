'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      // Check for standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for iOS standalone
      const isIOSStandalone = (window.navigator as any).standalone === true;
      // Check for Android TWA
      const isAndroidTWA = document.referrer.includes('android-app://');
      
      return isStandalone || isIOSStandalone || isAndroidTWA;
    };

    setIsInstalled(checkIfInstalled());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log('Splitfact PWA a été installée avec succès!');
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Utilisateur a accepté l\'installation PWA');
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('Utilisateur a refusé l\'installation PWA');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}