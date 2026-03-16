import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import {
  type Language,
  type TranslationKey,
  translations,
} from "../i18n/translations";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "vatavriksha_language";

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "mr") return stored;
  } catch {
    // ignore
  }
  return "mr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === "mr" ? "en" : "mr";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] as string;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
