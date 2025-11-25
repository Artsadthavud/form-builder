import { Language, TranslatableText } from '../types';

export function getText(text: string | TranslatableText | undefined, language: Language): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[language] || text.en || text.th || '';
}

export function isTranslatable(text: any): text is TranslatableText {
  return typeof text === 'object' && text !== null && ('th' in text || 'en' in text);
}

export function makeTranslatable(text: string): TranslatableText {
  return { th: text, en: text };
}
