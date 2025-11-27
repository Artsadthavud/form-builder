import React, { memo, useCallback, useState } from 'react';
import { Language, FormMetadata } from '../../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  formMetadata: FormMetadata;
  onLanguageChange: (lang: Language) => void;
  onUpdateMetadata: (meta: FormMetadata) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = memo(({
  currentLanguage,
  formMetadata,
  onLanguageChange,
  onUpdateMetadata
}) => {
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [languageError, setLanguageError] = useState('');

  const handleMetaChange = useCallback((field: keyof FormMetadata, value: any) => {
    onUpdateMetadata({ ...formMetadata, [field]: value });
  }, [formMetadata, onUpdateMetadata]);

  const handleAddLanguage = useCallback(() => {
    const cleanLang = newLanguageCode.trim().toLowerCase();
    if (!cleanLang || cleanLang.length < 2) {
      setLanguageError('Please enter at least 2 characters');
      return;
    }
    const current = formMetadata.availableLanguages || ['th', 'en'];
    if (current.includes(cleanLang)) {
      setLanguageError(`"${cleanLang}" already exists!`);
      return;
    }
    handleMetaChange('availableLanguages', [...current, cleanLang]);
    setNewLanguageCode('');
    setLanguageError('');
    setShowAddLanguageModal(false);
  }, [newLanguageCode, formMetadata.availableLanguages, handleMetaChange]);

  const handleRemoveLanguage = useCallback((lang: string) => {
    const newLangs = (formMetadata.availableLanguages || ['th', 'en']).filter(l => l !== lang);
    handleMetaChange('availableLanguages', newLangs);
    if (currentLanguage === lang) onLanguageChange(newLangs[0] as Language);
  }, [formMetadata.availableLanguages, currentLanguage, onLanguageChange, handleMetaChange]);

  const availableLanguages = formMetadata.availableLanguages || ['th', 'en'];

  return (
    <>
      {/* Language Selector */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Editing Language</label>
        </div>
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
        >
          {availableLanguages.map(lang => (
            <option key={lang} value={lang}>
              {lang === 'th' ? '🇹🇭 ไทย (Thai)' : lang === 'en' ? '🇬🇧 EN (English)' : `${lang.toUpperCase()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Available Languages Management */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b-2 border-indigo-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">Available Languages</h3>
          </div>
          <span className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full shadow-sm">
            {availableLanguages.length}
          </span>
        </div>
        <div className="space-y-2">
          {availableLanguages.map((lang, idx) => (
            <div key={lang} className="flex items-center gap-2 bg-white rounded-lg p-2 border-2 border-indigo-200 shadow-sm hover:border-purple-300 transition-all">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-sm">
                {idx + 1}
              </span>
              <span className="flex-1 font-semibold text-sm text-slate-700">
                {lang === 'th' ? '🇹🇭 Thai' : lang === 'en' ? '🇬🇧 English' : lang.toUpperCase()}
              </span>
              {availableLanguages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="px-2 py-1 text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Inline Add Language Form */}
        {showAddLanguageModal && (
          <div className="bg-white rounded-lg p-3 border-2 border-indigo-300 shadow-md space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              New Language Code
            </label>
            <input
              type="text"
              value={newLanguageCode}
              onChange={(e) => {
                setNewLanguageCode(e.target.value);
                setLanguageError('');
              }}
              placeholder="e.g., zh, ja, ko"
              className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all ${
                languageError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
              }`}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddLanguage();
              }}
            />
            {languageError && (
              <p className="text-xs text-red-600 font-medium">
                ⚠️ {languageError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewLanguageCode('');
                  setLanguageError('');
                  setShowAddLanguageModal(false);
                }}
                className="flex-1 px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLanguage}
                disabled={!newLanguageCode.trim() || newLanguageCode.trim().length < 2}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs transition-all"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {!showAddLanguageModal && (
          <button
            type="button"
            onClick={() => setShowAddLanguageModal(true)}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2 group"
          >
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Language
          </button>
        )}
      </div>
    </>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
