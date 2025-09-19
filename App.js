// BEGIN FILE: App.js
import React, { useEffect } from 'react';
import { ThemeProvider } from './src/theme';
import { I18nProvider } from './src/i18n/I18nProvider';
import CPRScreen from './src/screens/CPRScreen';

// IAP
import { initIAP, startIapListeners, stopIapListeners } from './src/features/payments/iap';
import { useEntitlement } from './src/features/pro/entitlement';


function AppInner() {
  // charge hasPro depuis AsyncStorage au démarrage
  const hydrate   = useEntitlement((s) => s.hydrate);
  const setHasPro = useEntitlement((s) => s.setHasPro);
  const hydrated  = useEntitlement((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // une seule init de la connexion IAP
  useEffect(() => {
    initIAP();
  }, []);

    // écoute les achats & ack/finish
    useEffect(() => {
      startIapListeners(() => setHasPro(true), (e) => console.warn('IAP', e));
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
