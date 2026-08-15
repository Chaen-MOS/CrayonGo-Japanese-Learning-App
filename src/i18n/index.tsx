import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {loadLanguage, saveLanguage} from '../services/settings';
import {en} from './en';
import type {AppLanguage, Translation} from './types';
import {zh} from './zh';

const translations: Record<AppLanguage, Translation> = {zh, en};

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: Translation;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<AppLanguage>('zh');

  useEffect(() => {
    let mounted = true;
    loadLanguage().then(savedLanguage => {
      if (mounted) {
        setLanguageState(savedLanguage);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    saveLanguage(nextLanguage);
  };

  const value = useMemo<I18nContextValue>(() => ({language, setLanguage, t: translations[language]}), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return value;
}

export type {AppLanguage, Translation};
