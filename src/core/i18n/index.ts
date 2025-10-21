const translations = {
  en: {
    'pos.title': 'POS Terminal',
  },
};

export const t = (key: string, lang = 'en') => translations[lang as keyof typeof translations]?.[key as keyof typeof translations.en] || key;