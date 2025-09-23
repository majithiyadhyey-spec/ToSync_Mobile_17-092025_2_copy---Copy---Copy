import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useFormworkData } from './FormworkDataContext';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil } from '../utils/dateUtils';

type Locale = 'en' | 'cs';
type TranslationsMap = Record<string, string>;
type AllTranslations = Record<Locale, TranslationsMap>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  loading: boolean;
  formatDate: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      return (localStorage.getItem('locale') as Locale) || 'en';
    } catch {
      return 'en';
    }
  });
  const [translations, setTranslations] = useState<AllTranslations | null>(null);
  const [loading, setLoading] = useState(true);
  const { integrations } = useFormworkData();
  const timezone = integrations.timezone;

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);
  useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const [enRes, csRes] = await Promise.all([
          fetch('./locales/en.json'),
          fetch('./locales/cs.json'),
        ]);
        const en = await enRes.json();
        const cs = await csRes.json();
        setTranslations({ en, cs });
      } catch (error) {
        console.error("Failed to load translation files", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslations();
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    if (!translations) {
      return key; // Return key if translations are not loaded yet
    }
    // Attempt to find translation in current locale, fallback to English
    let translation = translations[locale]?.[key] || translations.en[key];
    
    if (typeof translation !== 'string') {
        console.warn(`Translation key '${key}' not found for locale '${locale}'.`);
        return key;
    }
    
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            translation = translation.replace(regex, String(replacements[placeholder]));
        });
    }

    return translation;
  }, [locale, translations]);
  
  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString, timezone);
  }, [timezone]);

  const formatDateTime = useCallback((dateString: string) => {
    return formatDateTimeUtil(dateString, timezone);
  }, [timezone]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    loading,
    formatDate,
    formatDateTime
  }), [locale, setLocale, t, loading, formatDate, formatDateTime]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};