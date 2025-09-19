// BEGIN FILE: src/i18n/I18nProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization'
import { STRINGS } from './strings';

const I18nCtx = createContext(null);

function makeT(lang) {
  return (key, vars = {}) => {
    const fr = STRINGS.fr;
    const en = STRINGS.en;
    const dict = lang === 'fr' ? fr : (STRINGS[lang] || {});
    let msg = (dict?.[key] ?? en?.[key] ?? key);
    if (typeof msg !== 'string') msg = String(msg);
    for (const [k, v] of Object.entries(vars)) {
      msg = msg.replaceAll(`{${k}}`, String(v));
    }
    return msg;
  };
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('fr'); // valeur initiale

  // Détection auto à l'initialisation
  useEffect(() => {
    try {
      const locale = Localization.getLocales?.()[0]?.languageCode
        || Localization.locale?.split('-')[0]
        || 'fr';
      setLang(locale.toLowerCase().startsWith('fr') ? 'fr' : 'en');
    } catch {
      setLang('fr');
    }
  }, []);
  const t = useMemo(() => makeT(lang), [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang: () => setLang(prev => (prev === 'fr' ? 'en' : 'fr')),
    t,
  }), [lang, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
// END FILE
