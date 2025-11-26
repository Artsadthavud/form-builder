import { Language, TranslatableText } from '../types';

export function getText(text: string | TranslatableText | undefined, language: Language, fallbackLanguages?: Language[]): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  
  // Try requested language first (and check if not empty)
  if (text[language] && text[language].trim()) return text[language];
  
  // Try fallback languages
  if (fallbackLanguages) {
    for (const fallback of fallbackLanguages) {
      if (text[fallback] && text[fallback].trim()) return text[fallback];
    }
  }
  
  // Try common fallbacks (find first non-empty value)
  return text.en?.trim() || text.th?.trim() || Object.values(text).find(v => v && v.trim()) || '';
}

export function isTranslatable(text: any): text is TranslatableText {
  return typeof text === 'object' && text !== null && ('th' in text || 'en' in text);
}

export function makeTranslatable(text: string): TranslatableText {
  return { th: text, en: text };
}

// Check translation completeness for a specific language
export function isTranslationComplete(text: string | TranslatableText | undefined, language: Language): boolean {
  if (!text) return false;
  if (typeof text === 'string') return true;
  return Boolean(text[language] && text[language].trim().length > 0);
}

// Get translation status for all available languages
export function getTranslationStatus(text: string | TranslatableText | undefined, availableLanguages: Language[]): Record<Language, boolean> {
  const status: Record<string, boolean> = {};
  for (const lang of availableLanguages) {
    status[lang] = isTranslationComplete(text, lang);
  }
  return status as Record<Language, boolean>;
}

// Calculate translation completeness percentage for a form
export function calculateTranslationCompleteness(elements: any[], availableLanguages: Language[], language: Language): number {
  if (elements.length === 0) return 100;
  
  let totalFields = 0;
  let completedFields = 0;
  
  elements.forEach(el => {
    // Count label
    if (el.label !== undefined) {
      totalFields++;
      if (isTranslationComplete(el.label, language)) completedFields++;
    }
    
    // Count placeholder
    if (el.placeholder !== undefined) {
      totalFields++;
      if (isTranslationComplete(el.placeholder, language)) completedFields++;
    }
    
    // Count content (paragraph)
    if (el.content !== undefined) {
      totalFields++;
      if (isTranslationComplete(el.content, language)) completedFields++;
    }
    
    // Count options
    if (el.options && Array.isArray(el.options)) {
      el.options.forEach(opt => {
        if (opt.label !== undefined) {
          totalFields++;
          if (isTranslationComplete(opt.label, language)) completedFields++;
        }
      });
    }
  });
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;
}
