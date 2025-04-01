import { createContext, ReactNode, useContext, useState } from "react";

type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  formatDate: (date: Date | string | null | undefined) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>("ar-IQ");

  // Format date to Arabic locale
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, formatDate }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
