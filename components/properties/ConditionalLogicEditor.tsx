import React, { memo, useCallback } from 'react';
import { FormElement, Condition, Language } from '../../types';
import { getText } from '../../utils/i18n';

interface ConditionalLogicEditorProps {
  element: FormElement;
  allElements: FormElement[];
  currentLanguage: Language;
  onUpdate: (element: FormElement) => void;
}

const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = memo(({
  element,
  allElements,
  currentLanguage,
  onUpdate
}) => {
  const handleChange = useCallback((field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  }, [element, onUpdate]);

  const initLogic = useCallback(() => {
    if (!element.logic) handleChange('logic', { combinator: 'AND', conditions: [] });
  }, [element.logic, handleChange]);

  const addCondition = useCallback(() => {
    const currentLogic = element.logic || { combinator: 'AND', conditions: [] };
    const newCondition: Condition = { id: `cond_${Date.now()}`, targetId: '', operator: 'equals', value: '' };
    handleChange('logic', { ...currentLogic, conditions: [...currentLogic.conditions, newCondition] });
  }, [element.logic, handleChange]);

  const updateCondition = useCallback((idx: number, field: keyof Condition, value: any) => {
    if (!element.logic) return;
    const newConditions = [...element.logic.conditions];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    handleChange('logic', { ...element.logic, conditions: newConditions });
  }, [element.logic, handleChange]);

  const removeCondition = useCallback((idx: number) => {
    if (!element.logic) return;
    const newConditions = element.logic.conditions.filter((_, i) => i !== idx);
    handleChange('logic', { ...element.logic, conditions: newConditions });
  }, [element.logic, handleChange]);

  const potentialLogicTargets = allElements.filter(e => 
    e.id !== element.id && e.type !== 'section' && e.type !== 'image' && e.type !== 'paragraph'
  );

  return (
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
  );
});

ConditionalLogicEditor.displayName = 'ConditionalLogicEditor';

export default ConditionalLogicEditor;
