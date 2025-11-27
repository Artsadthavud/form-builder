import React, { memo, useCallback } from 'react';
import { FormElement } from '../../types';

interface ValidationRulesProps {
  element: FormElement;
  onUpdate: (element: FormElement) => void;
  onOpenCalculation?: () => void;
}

const ValidationRules: React.FC<ValidationRulesProps> = memo(({
  element,
  onUpdate,
  onOpenCalculation
}) => {
  const handleChange = useCallback((field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  }, [element, onUpdate]);

  const showValidation = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'file'].includes(element.type);
  
  if (!showValidation) return null;

  return (
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
  );
});

ValidationRules.displayName = 'ValidationRules';

export default ValidationRules;
