import React from 'react';
import { FormElement, FormMetadata, Language, TranslatableText, Signer } from '../../types';
import { getText, isTranslatable } from '../../utils/i18n';

interface ElementGeneralSettingsProps {
  element: FormElement;
  allElements: FormElement[];
  formMetadata: FormMetadata;
  currentLanguage: Language;
  signers: Signer[];
  onUpdate: (element: FormElement) => void;
}

const ElementGeneralSettings: React.FC<ElementGeneralSettingsProps> = ({
  element,
  allElements,
  formMetadata,
  currentLanguage,
  signers,
  onUpdate
}) => {
  const handleChange = (field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  };

  const updateTranslatableField = (field: 'label' | 'placeholder' | 'content', lang: Language, value: string) => {
    const current = element[field];
    if (isTranslatable(current)) {
      onUpdate({ ...element, [field]: { ...current, [lang]: value } });
    } else {
      const translatable: TranslatableText = { th: '', en: '' };
      if (typeof current === 'string' && current) {
        translatable[formMetadata.defaultLanguage || 'th'] = current;
      }
      translatable[lang] = value;
      onUpdate({ ...element, [field]: translatable });
    }
  };

  return (
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
      
      {/* Label */}
      {element.type !== 'paragraph' && element.type !== 'image' && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Label ({currentLanguage === 'th' ? 'ไทย' : 'English'})
          </label>
          <input
            type="text"
            value={typeof element.label === 'string' ? element.label : (element.label?.[currentLanguage] || '')}
            onChange={(e) => updateTranslatableField('label', currentLanguage, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            placeholder={currentLanguage === 'th' ? 'ป้ายชื่อ (ไทย)' : 'Label (English)'}
          />
        </div>
      )}

      {/* Required */}
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

      {/* Signer Assignment */}
      {signers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">✍️</span>
            <span className="text-xs font-bold text-amber-700 uppercase">Signer Assignment</span>
          </div>
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
          {element.signerId && (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mt-2">
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
    </div>
  );
};

export default ElementGeneralSettings;
