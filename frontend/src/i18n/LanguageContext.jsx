import { createContext, useContext, useState } from 'react';
import en from './en.json';
import ptBR from './pt-BR.json';

const LanguageContext = createContext();

const translations = {
  'en': en,
  'pt-BR': ptBR,
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('pt-BR');

  function t(key, vars) {
    let text = translations[language]?.[key] || translations['en']?.[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        text = text.replace(new RegExp(`\\{\\{${varKey}\\}\\}`, 'g'), varValue);
      });
    }
    return text;
  }

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
