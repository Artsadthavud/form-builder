
import React, { useState } from 'react';
import { FormElement, Option, Condition, Logic, FormMetadata, Language, TranslatableText, Calculation, OTPConfig, Signer } from '../types';
import { getText, isTranslatable, makeTranslatable } from '../utils/i18n';

interface PropertiesPanelProps {
  element?: FormElement;
  allElements: FormElement[];
  formMetadata: FormMetadata;
  currentLanguage: Language;
  signers?: Signer[];
  onLanguageChange: (lang: Language) => void;
  onUpdate: (element: FormElement) => void;
  onDelete: (id: string) => void;
  onUpdateMetadata: (meta: FormMetadata) => void;
  onRequestLabelChange: (id: string, newLabel: string) => void;
  onOpenCalculation?: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  element, 
  allElements, 
  formMetadata,
  currentLanguage,
  signers = [],
  onLanguageChange,
  onUpdate, 
  onDelete, 
  onUpdateMetadata,
  onRequestLabelChange,
  onOpenCalculation
}) => {
  const [draggedOptionIdx, setDraggedOptionIdx] = useState<number | null>(null);
  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [languageError, setLanguageError] = useState('');

  const handleMetaChange = (field: keyof FormMetadata, value: any) => {
    onUpdateMetadata({ ...formMetadata, [field]: value });
  };

  // Helper to update translatable fields
  const updateTranslatableMetaField = (field: keyof FormMetadata, lang: Language, value: string) => {
    const current = formMetadata[field];
    if (isTranslatable(current)) {
      handleMetaChange(field, { ...current, [lang]: value });
    } else {
      // Convert to translatable
      const translatable: TranslatableText = { th: '', en: '' };
      translatable[lang] = value;
      handleMetaChange(field, translatable);
    }
  };

  const updateTranslatableElementField = (field: 'label' | 'placeholder' | 'content', lang: Language, value: string) => {
    if (!element) return;
    const current = element[field];
    if (isTranslatable(current)) {
      onUpdate({ ...element, [field]: { ...current, [lang]: value } });
    } else {
      // Convert string to translatable object, preserving the old value
      const translatable: TranslatableText = { th: '', en: '' };
      if (typeof current === 'string' && current) {
        // Put old string value in the default language
        translatable[formMetadata.defaultLanguage || 'th'] = current;
      }
      translatable[lang] = value;
      onUpdate({ ...element, [field]: translatable });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMetaChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // If no element is selected, show Form Settings (Header/Footer configuration)
  if (!element) {
    const isHorizontalLayout = formMetadata.logoPlacement === 'left' || formMetadata.logoPlacement === 'right';
    
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-5 border-b-2 border-slate-200 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-lg text-slate-800">Form Settings</h2>
          </div>
          <p className="text-xs text-slate-600 ml-9">Header & Footer Configuration</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
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
              {(formMetadata.availableLanguages || ['th', 'en']).map(lang => (
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
                {(formMetadata.availableLanguages || ['th', 'en']).length}
              </span>
            </div>
            <div className="space-y-2">
              {(formMetadata.availableLanguages || ['th', 'en']).map((lang, idx) => (
                <div key={lang} className="flex items-center gap-2 bg-white rounded-lg p-2 border-2 border-indigo-200 shadow-sm hover:border-purple-300 transition-all">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-semibold text-sm text-slate-700">
                    {lang === 'th' ? '🇹🇭 Thai' : lang === 'en' ? '🇬🇧 English' : lang.toUpperCase()}
                  </span>
                  {(formMetadata.availableLanguages || ['th', 'en']).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newLangs = (formMetadata.availableLanguages || ['th', 'en']).filter(l => l !== lang);
                        handleMetaChange('availableLanguages', newLangs);
                        if (currentLanguage === lang) onLanguageChange(newLangs[0]);
                      }}
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
                    if (e.key === 'Enter') {
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
                    }
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
                    onClick={() => {
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
                    }}
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

          {/* General Header Settings */}
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Header Content</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Form Title ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={typeof formMetadata.title === 'string' ? formMetadata.title : (formMetadata.title?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableMetaField('title', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder={currentLanguage === 'th' ? 'ชื่อฟอร์ม (ไทย)' : 'Form Title (English)'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <textarea
                rows={3}
                value={typeof formMetadata.description === 'string' ? formMetadata.description : (formMetadata.description?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableMetaField('description', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder={currentLanguage === 'th' ? 'คำอธิบาย (ไทย)' : 'Description (English)'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo URL</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formMetadata.logoUrl || ''}
                  onChange={(e) => handleMetaChange('logoUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full py-1.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-200">
                    Upload Logo File
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Header Styling */}
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Header Styling</h3>
            </div>
            
            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Background Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.headerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('headerBackgroundColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.headerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('headerBackgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Text Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.headerTitleColor || '#1e293b'}
                    onChange={(e) => handleMetaChange('headerTitleColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.headerTitleColor || '#1e293b'}
                    onChange={(e) => handleMetaChange('headerTitleColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo Placement</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                 {(['top', 'bottom', 'left', 'right'] as const).map((place) => (
                    <button
                      key={place}
                      className={`py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.logoPlacement === place || (!formMetadata.logoPlacement && place === 'top') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      onClick={() => handleMetaChange('logoPlacement', place)}
                    >
                      {place}
                    </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo Size / Width (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formMetadata.logoWidth || 25}
                  onChange={(e) => handleMetaChange('logoWidth', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formMetadata.logoWidth || 25}
                  onChange={(e) => handleMetaChange('logoWidth', parseInt(e.target.value))}
                  className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                 {isHorizontalLayout ? 'Logo Vertical Align' : 'Logo Horizontal Align'}
              </label>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                {(['left', 'center', 'right'] as const).map((align) => {
                    let label: string = align;
                    // Adapt label based on orientation
                    if (isHorizontalLayout) {
                       if (align === 'left') label = 'top';
                       if (align === 'center') label = 'middle';
                       if (align === 'right') label = 'bottom';
                    }
                    return (
                      <button
                        key={align}
                        className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.logoAlignment === align || (!formMetadata.logoAlignment && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => handleMetaChange('logoAlignment', align)}
                      >
                        {label}
                      </button>
                    );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Text Alignment</label>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.headerTextAlignment === align || (!formMetadata.headerTextAlignment && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      onClick={() => handleMetaChange('headerTextAlignment', align)}
                    >
                      {align}
                    </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Settings */}
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Footer Content & Style</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Footer Text ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={typeof formMetadata.footerText === 'string' ? formMetadata.footerText : (formMetadata.footerText?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableMetaField('footerText', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder={currentLanguage === 'th' ? 'ข้อความท้ายฟอร์ม (ไทย)' : 'Footer Text (English)'}
              />
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Background Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.footerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('footerBackgroundColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.footerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('footerBackgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Text Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.footerTextColor || '#64748b'}
                    onChange={(e) => handleMetaChange('footerTextColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.footerTextColor || '#64748b'}
                    onChange={(e) => handleMetaChange('footerTextColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Element Properties Logic
  const handleChange = (field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  };

  const handleOptionChange = (idx: number, field: keyof Option, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    handleChange('options', newOptions);
  };

  const addOption = () => {
    const newOptId = `opt_${Date.now()}`;
    const newOptions = [...(element.options || []), { 
      id: newOptId, 
      label: { th: 'ตัวเลือกใหม่', en: 'New Option' }, 
      value: 'new_value' 
    }];
    handleChange('options', newOptions);
  };

  const removeOption = (idx: number) => {
    if (!element.options) return;
    const newOptions = element.options.filter((_, i) => i !== idx);
    // sanitize defaultValue if it referenced removed option(s)
    const remainingValues = newOptions.map(o => o.value);
    let nextDefault: string | string[] | undefined = element.defaultValue;
    if (typeof nextDefault === 'string') {
      if (!remainingValues.includes(nextDefault)) nextDefault = undefined;
    } else if (Array.isArray(nextDefault)) {
      nextDefault = (nextDefault as string[]).filter(v => remainingValues.includes(v));
    }
    handleChange('options', newOptions);
    handleChange('defaultValue', nextDefault);
  };

  // ... Drag and Drop options handlers from previous logic ...
  const handleOptionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedOptionIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleOptionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedOptionIdx === null || draggedOptionIdx === index) return;
    if (element.options) {
      const newOptions = [...element.options];
      const [draggedItem] = newOptions.splice(draggedOptionIdx, 1);
      newOptions.splice(index, 0, draggedItem);
      handleChange('options', newOptions);
      setDraggedOptionIdx(index);
    }
  };

  const handleOptionDragEnd = () => {
    setDraggedOptionIdx(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ... Logic Handlers (initLogic, addCondition, etc.) same as before ...
  const initLogic = () => {
    if (!element.logic) handleChange('logic', { combinator: 'AND', conditions: [] });
  };
  const addCondition = () => {
    const currentLogic = element.logic || { combinator: 'AND', conditions: [] };
    const newCondition: Condition = { id: `cond_${Date.now()}`, targetId: '', operator: 'equals', value: '' };
    handleChange('logic', { ...currentLogic, conditions: [...currentLogic.conditions, newCondition] });
  };
  const updateCondition = (idx: number, field: keyof Condition, value: any) => {
    if (!element.logic) return;
    const newConditions = [...element.logic.conditions];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    handleChange('logic', { ...element.logic, conditions: newConditions });
  };
  const removeCondition = (idx: number) => {
    if (!element.logic) return;
    const newConditions = element.logic.conditions.filter((_, i) => i !== idx);
    handleChange('logic', { ...element.logic, conditions: newConditions });
  };

  const potentialLogicTargets = allElements.filter(e => e.id !== element.id && e.type !== 'section' && e.type !== 'image' && e.type !== 'paragraph');

  // Helper to render width buttons
  const WidthButton = ({ w, label }: { w: string, label: string }) => {
    const isActive = (element.width || '100') === w;
    return (
      <button
        onClick={() => handleChange('width', w)}
        className={`flex-1 py-1.5 text-[10px] font-medium border rounded transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'}`}
        title={`Set width to ${w === '100' ? '100%' : w + '%'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
      <div className="p-5 border-b-2 border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-slate-800">Properties</h2>
        </div>
        <div className="flex items-center gap-2 ml-9">
          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono font-semibold rounded">{element.type.toUpperCase()}</span>
          <span className="text-xs text-slate-500 font-mono truncate">{element.id}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
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
            {(formMetadata.availableLanguages || ['th', 'en']).map(lang => (
              <option key={lang} value={lang}>
                {lang === 'th' ? '🇹🇭 ไทย (Thai)' : lang === 'en' ? '🇬🇧 EN (English)' : `${lang.toUpperCase()}`}
              </option>
            ))}
          </select>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">General</h3>
          </div>

          {/* Element ID */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Element ID
            </label>
            <input
              type="text"
              value={element.id}
              onChange={(e) => {
                const newId = e.target.value.trim();
                if (newId && !allElements.some(el => el.id === newId && el.id !== element.id)) {
                  onUpdate({ ...element, id: newId });
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              placeholder="unique-id"
            />
            <p className="mt-1 text-[10px] text-slate-500">Unique identifier for this element</p>
          </div>
          
          {element.type !== 'paragraph' && element.type !== 'image' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Label ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={typeof element.label === 'string' ? element.label : (element.label?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableElementField('label', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder={currentLanguage === 'th' ? 'ป้ายชื่อ (ไทย)' : 'Label (English)'}
              />
            </div>
          )}

          {element.type !== 'section' && element.type !== 'image' && element.type !== 'paragraph' && (
             <div className="flex items-center gap-2">
                <input
                  id="required"
                  type="checkbox"
                  checked={element.required || false}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                />
                <label htmlFor="required" className="text-sm text-slate-700">Required Field</label>
             </div>
          )}

          {/* Parent Group Selection */}
          {element.type !== 'section' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Parent Group</label>
              <select
                value={element.parentId || ''}
                onChange={(e) => onUpdate({ ...element, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">(Root)</option>
                {allElements.filter(e => e.type === 'section' && e.id !== element.id).map(sec => (
                    <option key={sec.id} value={sec.id}>{getText(sec.label, currentLanguage)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Layout / Grid System */}
        <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
            </svg>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Layout & Grid</h3>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Width (Column Span)</label>
            <div className="space-y-1">
               <div className="flex gap-1"><WidthButton w="100" label="100%" /></div>
               <div className="flex gap-1"><WidthButton w="50" label="50%" /><WidthButton w="50" label="50%" /></div>
               <div className="flex gap-1"><WidthButton w="33" label="33%" /><WidthButton w="33" label="33%" /><WidthButton w="33" label="33%" /></div>
               <div className="flex gap-1"><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /></div>
            </div>
          </div>
        </div>

        {/* Signer Assignment (Multi-Signer) */}
        {signers.length > 0 && (
          <div className="bg-white rounded-xl p-4 border-2 border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
              <span className="text-amber-600">✍️</span>
              <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide">Signer Assignment</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">กำหนดให้ผู้เซ็น</label>
              <select
                value={element.signerId || ''}
                onChange={(e) => handleChange('signerId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="">-- ทุกคนเห็น/กรอกได้ --</option>
                {signers.map(signer => (
                  <option key={signer.id} value={signer.id}>
                    {signer.order}. {signer.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                เลือกว่า element นี้เป็นของผู้เซ็นคนไหน (สำหรับแบ่งส่วนฟอร์ม)
              </p>
            </div>
            {element.signerId && (
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={element.signerRequired || false}
                  onChange={(e) => handleChange('signerRequired', e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                ผู้เซ็นคนนี้ต้องกรอก element นี้
              </label>
            )}
          </div>
        )}

        {/* Validation Rules */}
        {(element.type === 'text' || element.type === 'textarea' || element.type === 'number' || element.type === 'date' || element.type === 'email' || element.type === 'phone' || element.type === 'file') && (
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Validation Rules</h3>
            </div>
             
             {element.type === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Input Format</label>
                  <select
                    value={element.validationType || 'text'}
                    onChange={(e) => handleChange('validationType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  >
                    <option value="text">Free Text</option>
                    <option value="email">Email Address</option>
                  </select>
                </div>
             )}

             {(element.type === 'text' || element.type === 'textarea') && (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Min Length</label>
                      <input type="number" value={element.minLength || ''} onChange={(e) => handleChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Max Length</label>
                      <input type="number" value={element.maxLength || ''} onChange={(e) => handleChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                    </div>
                  </div>
                </>
             )}

             {/* Regex Pattern - for text, email, phone, textarea */}
             {(element.type === 'text' || element.type === 'textarea' || element.type === 'email' || element.type === 'phone') && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Regex Pattern</label>
                    <input 
                      type="text" 
                      value={element.pattern || ''} 
                      onChange={(e) => handleChange('pattern', e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
                      placeholder="e.g. ^[A-Za-z]+$" 
                    />
                  </div>
                  
                  {/* Preset Patterns */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Quick Presets</label>
                    <div className="flex flex-wrap gap-1">
                      {element.type === 'text' && (
                        <>
                          <button type="button" onClick={() => handleChange('pattern', '^[A-Za-z\\s]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Letters Only</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[0-9]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Numbers Only</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[A-Za-z0-9]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Alphanumeric</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[ก-๙\\s]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Thai Only</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[0-9]{13}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">ID Card (13)</button>
                        </>
                      )}
                      {element.type === 'email' && (
                        <>
                          <button type="button" onClick={() => handleChange('pattern', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Standard Email</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[a-zA-Z0-9._%+-]+@company\\.com$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Company Domain</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[a-zA-Z0-9._%+-]+@(gmail|hotmail|yahoo)\\.com$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Personal Email</button>
                        </>
                      )}
                      {element.type === 'phone' && (
                        <>
                          <button type="button" onClick={() => handleChange('pattern', '^0[0-9]{9}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Thai Mobile (10)</button>
                          <button type="button" onClick={() => handleChange('pattern', '^0[0-9]{8,9}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Thai Phone (9-10)</button>
                          <button type="button" onClick={() => handleChange('pattern', '^\\+66[0-9]{9}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">+66 Format</button>
                          <button type="button" onClick={() => handleChange('pattern', '^0[689][0-9]{8}$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Mobile Only</button>
                        </>
                      )}
                      {element.type === 'textarea' && (
                        <>
                          <button type="button" onClick={() => handleChange('pattern', '^[^<>]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">No HTML Tags</button>
                          <button type="button" onClick={() => handleChange('pattern', '^[\\w\\s.,!?-]+$')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors">Safe Text</button>
                        </>
                      )}
                      {element.pattern && (
                        <button type="button" onClick={() => handleChange('pattern', '')} className="px-2 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors">Clear</button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Regular expression for custom validation. Leave empty for default.</p>
                </div>
             )}

             {element.type === 'number' && (
               <>
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-xs font-medium text-slate-700 mb-1">Min Value</label>
                     <input type="number" value={element.min !== undefined ? element.min : ''} onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                   </div>
                   <div className="flex-1">
                     <label className="block text-xs font-medium text-slate-700 mb-1">Max Value</label>
                     <input type="number" value={element.max !== undefined ? element.max : ''} onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                   </div>
                 </div>
                 
                 {/* Auto-Calculation Section */}
                 <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                       </svg>
                       <span className="text-xs font-bold text-amber-800">Auto-Calculate</span>
                       {element.calculation?.enabled && (
                         <span className="px-1.5 py-0.5 bg-amber-200 text-amber-700 text-[10px] font-bold rounded">ON</span>
                       )}
                     </div>
                     <button
                       onClick={() => onOpenCalculation?.()}
                       className="px-3 py-1 text-xs font-semibold bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                     >
                       {element.calculation?.enabled ? 'Edit' : 'Setup'}
                     </button>
                   </div>
                   {element.calculation?.enabled && element.calculation.formula.length > 0 && (
                     <p className="text-xs text-amber-700 mt-2">
                       Formula: {element.calculation.formula.length} step(s)
                     </p>
                   )}
                 </div>
               </>
             )}

             {/* File Upload Settings */}
             {element.type === 'file' && (
               <div className="space-y-3">
                 {/* Allow Multiple */}
                 <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={element.allowMultiple || false}
                     onChange={(e) => handleChange('allowMultiple', e.target.checked)}
                     className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                   />
                   {currentLanguage === 'th' ? 'อนุญาตหลายไฟล์' : 'Allow Multiple Files'}
                 </label>

                 {/* Max File Size */}
                 <div>
                   <label className="block text-xs font-medium text-slate-700 mb-1">
                     {currentLanguage === 'th' ? 'ขนาดไฟล์สูงสุด (MB)' : 'Max File Size (MB)'}
                   </label>
                   <input
                     type="number"
                     min="1"
                     max="100"
                     value={element.maxFileSize || 10}
                     onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value) || 10)}
                     className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                   />
                 </div>

                 {/* Accepted File Types */}
                 <div>
                   <label className="block text-xs font-medium text-slate-700 mb-2">
                     {currentLanguage === 'th' ? 'ประเภทไฟล์ที่อนุญาต' : 'Allowed File Types'}
                   </label>
                   
                   {/* Preset buttons */}
                   <div className="flex flex-wrap gap-1 mb-2">
                     <button
                       type="button"
                       onClick={() => handleChange('validation', { ...element.validation, acceptedFileTypes: ['image/*'] })}
                       className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                         element.validation?.acceptedFileTypes?.includes('image/*')
                           ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                           : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                       }`}
                     >
                       🖼️ {currentLanguage === 'th' ? 'รูปภาพ' : 'Images'}
                     </button>
                     <button
                       type="button"
                       onClick={() => handleChange('validation', { ...element.validation, acceptedFileTypes: ['.pdf'] })}
                       className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                         element.validation?.acceptedFileTypes?.includes('.pdf')
                           ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                           : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                       }`}
                     >
                       📕 PDF
                     </button>
                     <button
                       type="button"
                       onClick={() => handleChange('validation', { ...element.validation, acceptedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'] })}
                       className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                         element.validation?.acceptedFileTypes?.some(t => ['.doc', '.docx'].includes(t))
                           ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                           : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                       }`}
                     >
                       📄 {currentLanguage === 'th' ? 'เอกสาร' : 'Documents'}
                     </button>
                     <button
                       type="button"
                       onClick={() => handleChange('validation', { ...element.validation, acceptedFileTypes: ['video/*'] })}
                       className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                         element.validation?.acceptedFileTypes?.includes('video/*')
                           ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                           : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                       }`}
                     >
                       🎬 {currentLanguage === 'th' ? 'วิดีโอ' : 'Videos'}
                     </button>
                     <button
                       type="button"
                       onClick={() => handleChange('validation', { ...element.validation, acceptedFileTypes: undefined })}
                       className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                         !element.validation?.acceptedFileTypes
                           ? 'bg-green-100 border-green-300 text-green-700'
                           : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                       }`}
                     >
                       ✨ {currentLanguage === 'th' ? 'ทุกประเภท' : 'All Types'}
                     </button>
                   </div>

                   {/* Custom types input */}
                   <input
                     type="text"
                     value={(element.validation?.acceptedFileTypes || []).join(', ')}
                     onChange={(e) => {
                       const types = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                       handleChange('validation', { ...element.validation, acceptedFileTypes: types.length > 0 ? types : undefined });
                     }}
                     placeholder={currentLanguage === 'th' ? 'เช่น .pdf, .jpg, image/*' : 'e.g., .pdf, .jpg, image/*'}
                     className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white"
                   />
                   <p className="text-[10px] text-slate-500 mt-1">
                     {currentLanguage === 'th' 
                       ? 'แยกด้วยเครื่องหมายจุลภาค เช่น .pdf, .jpg, image/*, video/*' 
                       : 'Separate with commas, e.g., .pdf, .jpg, image/*, video/*'}
                   </p>
                 </div>
               </div>
             )}

             {/* Custom Validation Message */}
             <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Custom Error Message</label>
                <input
                  type="text"
                  value={element.customErrorMsg || ''}
                  onChange={(e) => handleChange('customErrorMsg', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  placeholder="e.g. Please enter a valid value"
                />
             </div>
          </div>
        )}

        {/* Field-Specific Settings */}
        {element.placeholder !== undefined && (
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Placeholder</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Placeholder ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={typeof element.placeholder === 'string' ? element.placeholder : (element.placeholder?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableElementField('placeholder', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder={currentLanguage === 'th' ? 'ข้อความตัวอย่าง (ไทย)' : 'Placeholder (English)'}
              />
              {/* Default value for simple input types */}
              {(['text','email','phone','number','textarea','date','time'] as const).includes(element.type as any) && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default Value</label>
                  {element.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
                      onChange={(e) => handleChange('defaultValue', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    />
                  ) : element.type === 'number' ? (
                    <input
                      type="number"
                      value={typeof element.defaultValue === 'string' ? element.defaultValue : (typeof element.defaultValue === 'number' ? String(element.defaultValue) : '')}
                      onChange={(e) => handleChange('defaultValue', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    />
                  ) : element.type === 'date' ? (
                    <input type="date" value={typeof element.defaultValue === 'string' ? element.defaultValue : ''} onChange={(e) => handleChange('defaultValue', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                  ) : element.type === 'time' ? (
                    <input type="time" value={typeof element.defaultValue === 'string' ? element.defaultValue : ''} onChange={(e) => handleChange('defaultValue', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                  ) : (
                    <input type="text" value={typeof element.defaultValue === 'string' ? element.defaultValue : ''} onChange={(e) => handleChange('defaultValue', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {element.type === 'paragraph' && (
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Content</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Content ({currentLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <textarea
                rows={5}
                value={typeof element.content === 'string' ? element.content : (element.content?.[currentLanguage] || '')}
                onChange={(e) => updateTranslatableElementField('content', currentLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono"
                placeholder={currentLanguage === 'th' ? 'เนื้อหา (ไทย)' : 'Content (English)'}
              />
            </div>
          </div>
        )}

        {/* Specifics */}
        {(element.type === 'radio' || element.type === 'checkbox' || element.type === 'select' || element.type === 'image' || element.type === 'signature' || element.type === 'rating') && (
          <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Specifics</h3>
            </div>
             
             {element.type === 'rating' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Stars</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={element.ratingMax || 5}
                    onChange={(e) => handleChange('ratingMax', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  />
                </div>
             )}

             {(element.type === 'radio' || element.type === 'checkbox' || element.type === 'select') && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Alignment</label>
                  <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                    <button className={`flex-1 py-1 text-xs rounded font-medium transition-all ${(!element.orientation || element.orientation === 'vertical') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('orientation', 'vertical')}>Vertical</button>
                    <button className={`flex-1 py-1 text-xs rounded font-medium transition-all ${element.orientation === 'horizontal' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('orientation', 'horizontal')}>Horizontal</button>
                  </div>

                  {/* Options Editor */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Options</label>
                    <div className="space-y-2">
                      {(element.options || []).map((opt, idx) => (
                        <div
                          key={opt.id}
                          draggable
                          onDragStart={(e) => handleOptionDragStart(e, idx)}
                          onDragOver={(e) => handleOptionDragOver(e, idx)}
                          onDragEnd={handleOptionDragEnd}
                          className="space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 text-slate-400 text-center text-xs">≡</div>
                            <input
                              type="text"
                              placeholder={currentLanguage === 'th' ? 'ป้ายชื่อ (ไทย)' : 'Label (English)'}
                              value={typeof opt.label === 'string' ? opt.label : (opt.label?.[currentLanguage] || '')}
                              onChange={(e) => {
                                if (!element.options) return;
                                const newOptions = [...element.options];
                                const current = newOptions[idx].label;
                                if (isTranslatable(current)) {
                                  newOptions[idx] = { ...newOptions[idx], label: { ...current, [currentLanguage]: e.target.value } };
                                } else if (typeof current === 'string' && current) {
                                  // Convert string to translatable, preserve old value
                                  const trans: TranslatableText = { th: '', en: '' };
                                  trans[formMetadata.defaultLanguage || 'th'] = current;
                                  trans[currentLanguage] = e.target.value;
                                  newOptions[idx] = { ...newOptions[idx], label: trans };
                                } else {
                                  const trans: TranslatableText = { th: '', en: '' };
                                  trans[currentLanguage] = e.target.value;
                                  newOptions[idx] = { ...newOptions[idx], label: trans };
                                }
                                handleChange('options', newOptions);
                              }}
                              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                            />
                            <input
                              type="text"
                              placeholder="value"
                              value={opt.value}
                              onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                              className="w-24 px-2 py-1 border border-slate-300 rounded text-sm bg-white font-mono text-xs"
                            />
                            {/* Default selector */}
                            {element.type === 'radio' || element.type === 'select' ? (
                              <label className="flex items-center gap-1 text-xs" title="Default">
                                <input
                                  type="radio"
                                  name={`default-${element.id}`}
                                  className="h-4 w-4"
                                  checked={element.defaultValue === opt.value}
                                  onChange={() => handleChange('defaultValue', opt.value)}
                                />
                              </label>
                            ) : null}
                            {element.type === 'checkbox' ? (
                              <label className="flex items-center gap-1 text-xs" title="Default checked">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={Array.isArray(element.defaultValue) && (element.defaultValue as string[]).includes(opt.value)}
                                  onChange={(e) => {
                                    const cur = Array.isArray(element.defaultValue) ? [...(element.defaultValue as string[])] : [];
                                    if (e.target.checked) {
                                      if (!cur.includes(opt.value)) cur.push(opt.value);
                                    } else {
                                      const i = cur.indexOf(opt.value);
                                      if (i >= 0) cur.splice(i, 1);
                                    }
                                    handleChange('defaultValue', cur);
                                  }}
                                />
                              </label>
                            ) : null}
                            <button onClick={() => removeOption(idx)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">×</button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <button onClick={addOption} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-sm">+ Add Option</button>
                      </div>
                    </div>
                  </div>
                </div>
             )}

             {element.type === 'signature' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Height (px)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="100" max="600" step="10" value={element.signatureHeight || 150} onChange={(e) => handleChange('signatureHeight', parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <input type="number" min="100" max="600" step="10" value={element.signatureHeight || 150} onChange={(e) => handleChange('signatureHeight', parseInt(e.target.value))} className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white" />
                  </div>
                </div>
             )}

             {element.type === 'image' && (
                <div className="space-y-3">
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Image Source</label>
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="https://example.com/image.png" value={element.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <button className="w-full py-1.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-200">Upload File</button>
                        </div>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Width (%)</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="10" max="100" value={element.imageWidth || 100} onChange={(e) => handleChange('imageWidth', parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <input type="number" min="10" max="100" value={element.imageWidth || 100} onChange={(e) => handleChange('imageWidth', parseInt(e.target.value))} className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alignment</label>
                      <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                        {(['left', 'center', 'right'] as const).map((align) => (
                           <button key={align} className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${element.imageAlign === align || (!element.imageAlign && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('imageAlign', align)}>{align}</button>
                        ))}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alt Text</label>
                      <input type="text" value={element.imageAlt || ''} onChange={(e) => handleChange('imageAlt', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                   </div>
                </div>
             )}
          </div>
        )}

        {/* OTP Configuration Section - for phone_otp and email_otp */}
        {(element.type === 'phone_otp' || element.type === 'email_otp') && (
          <div className="space-y-3 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-emerald-200 shadow-md">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-200">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">OTP Configuration</h3>
                <p className="text-[10px] text-slate-600 mt-0.5">API endpoints & settings</p>
              </div>
            </div>
            
            {/* API Endpoints */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                API Endpoints
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Send OTP Endpoint *</label>
                <input 
                  type="text" 
                  value={element.otpConfig?.sendOtpEndpoint || ''} 
                  onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, sendOtpEndpoint: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
                  placeholder="https://api.example.com/send-otp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Verify OTP Endpoint *</label>
                <input 
                  type="text" 
                  value={element.otpConfig?.verifyOtpEndpoint || ''} 
                  onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, verifyOtpEndpoint: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
                  placeholder="https://api.example.com/verify-otp"
                />
              </div>
            </div>

            {/* Field Mapping */}
            <div className="space-y-3 pt-2 border-t border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Request Field Names
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">{element.type === 'phone_otp' ? 'Phone' : 'Email'} Field</label>
                  <input 
                    type="text" 
                    value={element.otpConfig?.valueFieldName || (element.type === 'phone_otp' ? 'phone' : 'email')} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, valueFieldName: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
                    placeholder={element.type === 'phone_otp' ? 'phone' : 'email'}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">OTP Field</label>
                  <input 
                    type="text" 
                    value={element.otpConfig?.otpFieldName || 'otp'} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, otpFieldName: e.target.value })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
                    placeholder="otp"
                  />
                </div>
              </div>
            </div>

            {/* OTP Settings */}
            <div className="space-y-3 pt-2 border-t border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                OTP Settings
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">OTP Length</label>
                  <select 
                    value={element.otpConfig?.otpLength || 6} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, otpLength: parseInt(e.target.value) })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  >
                    <option value={4}>4 digits</option>
                    <option value={6}>6 digits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expire (sec)</label>
                  <input 
                    type="number" 
                    value={element.otpConfig?.expireSeconds || 300} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, expireSeconds: parseInt(e.target.value) || 300 })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
                    min={60}
                    max={600}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Resend Delay (sec)</label>
                  <input 
                    type="number" 
                    value={element.otpConfig?.resendDelaySeconds || 60} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, resendDelaySeconds: parseInt(e.target.value) || 60 })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
                    min={30}
                    max={300}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Attempts</label>
                  <input 
                    type="number" 
                    value={element.otpConfig?.maxAttempts || 3} 
                    onChange={(e) => handleChange('otpConfig', { ...element.otpConfig, maxAttempts: parseInt(e.target.value) || 3 })} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </div>

            {/* Custom Headers (Advanced) */}
            <details className="pt-2 border-t border-emerald-200">
              <summary className="text-xs font-semibold text-emerald-700 cursor-pointer flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Advanced Options
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Custom Headers (JSON)</label>
                  <textarea 
                    value={element.otpConfig?.requestHeaders ? JSON.stringify(element.otpConfig.requestHeaders, null, 2) : ''} 
                    onChange={(e) => {
                      try {
                        const headers = e.target.value ? JSON.parse(e.target.value) : undefined;
                        handleChange('otpConfig', { ...element.otpConfig, requestHeaders: headers });
                      } catch { /* ignore parse errors while typing */ }
                    }} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-white h-20" 
                    placeholder='{"Authorization": "Bearer xxx"}'
                  />
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Conditional Logic Section - Available for ALL element types */}
        <div className="space-y-3 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-md">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Conditional Logic</h3>
                <p className="text-[10px] text-slate-600 mt-0.5">Control field visibility</p>
              </div>
              {element.logic && element.logic.conditions && element.logic.conditions.length > 0 && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                  {element.logic.conditions.length} rule{element.logic.conditions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {!element.logic && (
              <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 mb-1">No logic rules configured</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Create conditional rules to show/hide this field based on other fields</p>
                  </div>
                </div>
                <button 
                  onClick={initLogic} 
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2 group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Enable Logic
                </button>
              </div>
            )}

            {element.logic && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border-2 border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-700">Combinator</span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg border-2 border-slate-300 shadow-sm">
                      <button 
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          element.logic.combinator === 'AND' 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
                            : 'text-slate-600 hover:bg-slate-200'
                        }`} 
                        onClick={() => handleChange('logic', { ...element.logic!, combinator: 'AND' })}
                      >
                        AND
                      </button>
                      <button 
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          element.logic.combinator === 'OR' 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
                            : 'text-slate-600 hover:bg-slate-200'
                        }`} 
                        onClick={() => handleChange('logic', { ...element.logic!, combinator: 'OR' })}
                      >
                        OR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {(element.logic.conditions || []).map((cond, idx) => (
                    <div key={cond.id} className="bg-white rounded-lg p-3 border-2 border-slate-200 shadow-sm hover:border-purple-300 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs font-bold shadow-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <button 
                          onClick={() => removeCondition(idx)} 
                          className="ml-auto px-2 py-1 text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <select 
                          value={cond.targetId} 
                          onChange={(e) => updateCondition(idx, 'targetId', e.target.value)} 
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium"
                        >
                          <option value="">-- Select Field --</option>
                          {potentialLogicTargets.map(t => (
                            <option key={t.id} value={t.id}>{getText(t.label, currentLanguage)}</option>
                          ))}
                        </select>

                        <select 
                          value={cond.operator} 
                          onChange={(e) => updateCondition(idx, 'operator', e.target.value)} 
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium"
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="not_contains">not contains</option>
                        </select>

                        <input 
                          type="text" 
                          value={cond.value} 
                          onChange={(e) => updateCondition(idx, 'value', e.target.value)} 
                          placeholder="Value" 
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-slate-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium" 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={addCondition} 
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-2 border-purple-300 rounded-lg hover:from-purple-200 hover:to-indigo-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Condition
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
    </>
  );
};

export default PropertiesPanel;
