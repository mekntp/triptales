import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS, type Language, formatText } from './translations';

type TranslationKey = keyof typeof TRANSLATIONS.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatDuration: (minutes: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('triptales_language') as Language;
      if (saved && (saved === 'en' || saved === 'th' || saved === 'zh')) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'th';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('triptales_language', lang);
    } catch {
      // Ignore
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    const template = dict[key] || TRANSLATIONS.en[key] || String(key);
    if (!params) return template;
    return formatText(template, params);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      if (language === 'en') return `${minutes} min`;
      if (language === 'zh') return `${minutes} 分钟`;
      return `${minutes} นาที`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      if (language === 'en') return `${hours} hr`;
      if (language === 'zh') return `${hours} 小时`;
      return `${hours} ชม.`;
    }

    if (language === 'en') return `${hours} hr ${mins} min`;
    if (language === 'zh') return `${hours} 小时 ${mins} 分钟`;
    return `${hours} ชม. ${mins} นาที`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDuration }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
