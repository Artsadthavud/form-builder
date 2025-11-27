import React, { memo, useCallback } from 'react';
import { FormElement, Language, FormMetadata, TranslatableText } from '../../types';
import { getText, isTranslatable } from '../../utils/i18n';
import ColorPicker from './ColorPicker';

interface FormSettingsProps {
  formMetadata: FormMetadata;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateMetadata: (meta: FormMetadata) => void;
}

const FormSettings: React.FC<FormSettingsProps> = memo(({
  formMetadata,
  currentLanguage,
  onLanguageChange,
  onUpdateMetadata
}) => {
  const handleMetaChange = useCallback((field: keyof FormMetadata, value: any) => {
    onUpdateMetadata({ ...formMetadata, [field]: value });
  }, [formMetadata, onUpdateMetadata]);

  const updateTranslatableMetaField = useCallback((field: keyof FormMetadata, lang: Language, value: string) => {
    const current = formMetadata[field];
    if (isTranslatable(current)) {
      handleMetaChange(field, { ...current, [lang]: value });
    } else {
      const translatable: TranslatableText = { th: '', en: '' };
      translatable[lang] = value;
      handleMetaChange(field, translatable);
    }
  }, [formMetadata, handleMetaChange]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMetaChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [handleMetaChange]);

  const isHorizontalLayout = formMetadata.logoPlacement === 'left' || formMetadata.logoPlacement === 'right';

  return (
    <>
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
        
        <ColorPicker
          label="Background Color"
          value={formMetadata.headerBackgroundColor || '#ffffff'}
          onChange={(value) => handleMetaChange('headerBackgroundColor', value)}
        />

        <ColorPicker
          label="Text Color"
          value={formMetadata.headerTitleColor || '#1e293b'}
          onChange={(value) => handleMetaChange('headerTitleColor', value)}
        />

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

        <ColorPicker
          label="Background Color"
          value={formMetadata.footerBackgroundColor || '#ffffff'}
          onChange={(value) => handleMetaChange('footerBackgroundColor', value)}
        />

        <ColorPicker
          label="Text Color"
          value={formMetadata.footerTextColor || '#64748b'}
          onChange={(value) => handleMetaChange('footerTextColor', value)}
        />
      </div>
    </>
  );
});

FormSettings.displayName = 'FormSettings';

export default FormSettings;
