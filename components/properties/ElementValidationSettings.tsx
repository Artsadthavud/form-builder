import React from 'react';
import { FormElement, Language } from '../../types';

interface ElementValidationSettingsProps {
  element: FormElement;
  currentLanguage: Language;
  onUpdate: (element: FormElement) => void;
  onOpenCalculation?: () => void;
}

const ElementValidationSettings: React.FC<ElementValidationSettingsProps> = ({
  element,
  currentLanguage,
  onUpdate,
  onOpenCalculation
}) => {
  const handleChange = (field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  };

  // Only show for certain types
  const validTypes = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'file'];
  if (!validTypes.includes(element.type)) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Validation Rules</h3>
      </div>

      {/* Input Format for text */}
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

      {/* Min/Max Length for text/textarea */}
      {(element.type === 'text' || element.type === 'textarea') && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Min Length</label>
            <input
              type="number"
              value={element.minLength || ''}
              onChange={(e) => handleChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Max Length</label>
            <input
              type="number"
              value={element.maxLength || ''}
              onChange={(e) => handleChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>
        </div>
      )}

      {/* Regex Pattern */}
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

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Quick Presets</label>
            <div className="flex flex-wrap gap-1">
              {element.type === 'text' && (
                <>
                  <PresetButton label="Letters Only" pattern="^[A-Za-z\\s]+$" onClick={handleChange} />
                  <PresetButton label="Numbers Only" pattern="^[0-9]+$" onClick={handleChange} />
                  <PresetButton label="Alphanumeric" pattern="^[A-Za-z0-9]+$" onClick={handleChange} />
                  <PresetButton label="Thai Only" pattern="^[ก-๙\\s]+$" onClick={handleChange} />
                  <PresetButton label="ID Card (13)" pattern="^[0-9]{13}$" onClick={handleChange} />
                </>
              )}
              {element.type === 'phone' && (
                <>
                  <PresetButton label="Thai Mobile (10)" pattern="^0[0-9]{9}$" onClick={handleChange} />
                  <PresetButton label="+66 Format" pattern="^\\+66[0-9]{9}$" onClick={handleChange} />
                  <PresetButton label="Mobile Only" pattern="^0[689][0-9]{8}$" onClick={handleChange} />
                </>
              )}
              {element.pattern && (
                <button
                  type="button"
                  onClick={() => handleChange('pattern', '')}
                  className="px-2 py-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Number Min/Max */}
      {element.type === 'number' && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">Min Value</label>
              <input
                type="number"
                value={element.min !== undefined ? element.min : ''}
                onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Value</label>
              <input
                type="number"
                value={element.max !== undefined ? element.max : ''}
                onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>
          </div>

          {/* Auto-Calculation */}
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
        <FileValidationSettings element={element} currentLanguage={currentLanguage} onUpdate={onUpdate} />
      )}

      {/* Custom Error Message */}
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
  );
};

// Helper Components
const PresetButton: React.FC<{
  label: string;
  pattern: string;
  onClick: (field: keyof FormElement, value: any) => void;
}> = ({ label, pattern, onClick }) => (
  <button
    type="button"
    onClick={() => onClick('pattern', pattern)}
    className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
  >
    {label}
  </button>
);

const FileValidationSettings: React.FC<{
  element: FormElement;
  currentLanguage: Language;
  onUpdate: (element: FormElement) => void;
}> = ({ element, currentLanguage, onUpdate }) => {
  const handleChange = (field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  };

  return (
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
          <FileTypePreset
            label={currentLanguage === 'th' ? '🖼️ รูปภาพ' : '🖼️ Images'}
            types={['image/*']}
            element={element}
            onUpdate={onUpdate}
          />
          <FileTypePreset
            label="📕 PDF"
            types={['.pdf']}
            element={element}
            onUpdate={onUpdate}
          />
          <FileTypePreset
            label={currentLanguage === 'th' ? '📄 เอกสาร' : '📄 Documents'}
            types={['.pdf', '.doc', '.docx', '.xls', '.xlsx']}
            element={element}
            onUpdate={onUpdate}
          />
          <FileTypePreset
            label={currentLanguage === 'th' ? '✨ ทุกประเภท' : '✨ All Types'}
            types={undefined}
            element={element}
            onUpdate={onUpdate}
          />
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
      </div>
    </div>
  );
};

const FileTypePreset: React.FC<{
  label: string;
  types: string[] | undefined;
  element: FormElement;
  onUpdate: (element: FormElement) => void;
}> = ({ label, types, element, onUpdate }) => {
  const isActive = types === undefined
    ? !element.validation?.acceptedFileTypes
    : element.validation?.acceptedFileTypes?.some(t => types.includes(t));

  return (
    <button
      type="button"
      onClick={() => onUpdate({ ...element, validation: { ...element.validation, acceptedFileTypes: types } })}
      className={`px-2 py-1 text-[10px] rounded border transition-colors ${
        isActive
          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
          : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
};

export default ElementValidationSettings;
