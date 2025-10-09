// BEGIN FILE: App.js
import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n/I18nProvider';
import CPRScreen from './src/screens/CPRScreen';

// IAP (inchangé)
import { initIAP, startIapListeners, stopIapListeners } from './src/features/payments/iap';
import { useEntitlement } from './src/features/pro/entitlement';

import * as SystemUI from 'expo-system-ui';   // +++
import { Platform, AppState } from 'react-native';



function AppInner() {
  // charge hasPro depuis AsyncStorage au démarrage
  const hydrate   = useEntitlement((s) => s.hydrate);
  const setHasPro = useEntitlement((s) => s.setHasPro);  // ← Ligne activée pour que les paiements fonctionnent
  const hydrated  = useEntitlement((s) => s.hydrated);
  const { theme } = useTheme();

  useEffect(() => {
        const bg = theme?.colors?.background ?? '#0B0F14';
        SystemUI.setBackgroundColorAsync(bg).catch(() => {});
      }, [theme?.colors?.background]);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

 
  // une seule init de la connexion IAP
  useEffect(() => {
        (async () => { await initIAP(); })();
        startIapListeners(
          () => setHasPro(true),           // onUnlocked
          (e) => console.warn('IAP', e)    // onError
        );
        return () => stopIapListeners();
      }, [setHasPro]);
  // Ne rends rien tant que le store n'est pas hydraté
  if (!hydrated) return null; // (ou un mini loader si tu veux)
  return <CPRScreen />;
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </I18nProvider>
  );
}
// END FILE
