import React, { useState } from 'react';
import { FormElement, Logic, Condition, ConditionOperator } from '../types';
import { getText } from '../utils/i18n';
import { operatorLabels as allOperatorLabels, getOperatorsForType } from '../utils/advancedLogic';

interface LogicBuilderProps {
  element: FormElement;
  allElements: FormElement[];
  currentLanguage: string;
  onSave: (logic: Logic | undefined) => void;
  onClose: () => void;
}

const LogicBuilder: React.FC<LogicBuilderProps> = ({ element, allElements, currentLanguage, onSave, onClose }) => {
  const [logic, setLogic] = useState<Logic>(element.logic || {
    combinator: 'AND',
    conditions: [],
    action: 'show'
  });

  const [action, setAction] = useState<'show' | 'hide'>(
    element.logic?.action || 'show'
  );

  // Get elements that can be used as conditions (before current element)
  const currentIndex = allElements.findIndex(el => el.id === element.id);
  const availableElements = allElements.slice(0, currentIndex).filter(el => 
    el.type !== 'image' && 
    el.type !== 'paragraph'
  );

  const operatorLabels: Record<ConditionOperator, string> = Object.fromEntries(
    Object.entries(allOperatorLabels).map(([k, v]) => [k, `${v.th} (${v.en})`])
  ) as Record<ConditionOperator, string>;

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      targetId: availableElements[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    setLogic({
      ...logic,
      conditions: [...logic.conditions, newCondition]
    });
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const newConditions = [...logic.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setLogic({ ...logic, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = logic.conditions.filter((_, i) => i !== index);
    setLogic({ ...logic, conditions: newConditions });
  };

  const handleSave = () => {
    if (logic.conditions.length === 0) {
      onSave(undefined);
    } else {
      onSave({ ...logic, action });
    }
    onClose();
  };

  const getElementOptions = (targetElement: FormElement): string[] => {
    if (targetElement.type === 'radio' || targetElement.type === 'checkbox' || targetElement.type === 'select') {
      return targetElement.options?.map(opt => typeof opt.label === 'string' ? opt.label : opt.label.th) || [];
    }
    return [];
  };

  const getTargetElement = (targetId: string): FormElement | undefined => {
    return availableElements.find(el => el.id === targetId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Conditional Logic Builder</h2>
              <p className="text-indigo-100 text-sm mt-0.5">
                <span className="opacity-75">Configure visibility rules for:</span> <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">{getText(element.label, currentLanguage)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/20 rounded-lg transition-all hover:rotate-90 duration-300"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableElements.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <svg className="w-20 h-20 mx-auto text-slate-300 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-slate-700 font-bold text-lg mb-2">No Fields Available</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto">Add fields before this element to create conditional logic. Fields will appear here once they are positioned above this element.</p>
            </div>
          ) : (
            <>
              {/* Action Selector */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border-2 border-indigo-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 text-base">Field Visibility Action</h3>
                    <p className="text-xs text-indigo-600 mt-0.5">Choose what happens when conditions are met</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAction('show')}
                    className={`relative px-4 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                      action === 'show'
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg ring-2 ring-emerald-400 ring-offset-2 scale-105'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm">Show Field</span>
                    </div>
                    {action === 'show' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setAction('hide')}
                    className={`relative px-4 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                      action === 'hide'
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg ring-2 ring-red-400 ring-offset-2 scale-105'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      <span className="text-sm">Hide Field</span>
                    </div>
                    {action === 'hide' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Conditions Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Conditions
                  {logic.conditions.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                      {logic.conditions.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={addCondition}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Condition
                </button>
              </div>

              {/* Conditions List */}
              {logic.conditions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-slate-500 text-sm">Click "Add Condition" to start building logic</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logic.conditions.map((condition, index) => {
                    const targetElement = getTargetElement(condition.targetId);
                    const hasOptions = targetElement && (targetElement.type === 'radio' || targetElement.type === 'checkbox' || targetElement.type === 'select');
                    const options = targetElement ? getElementOptions(targetElement) : [];

                    return (
                      <div key={condition.id} className="relative">
                        {/* Combinator Badge */}
                        {index > 0 && (
                          <div className="flex justify-center -mb-2 relative z-10">
                            <div className="bg-white px-3 py-1 rounded-full border-2 border-slate-300 shadow-sm">
                              <select
                                value={logic.combinator}
                                onChange={(e) => setLogic({ ...logic, combinator: e.target.value as 'AND' | 'OR' })}
                                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                              >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Condition Card */}
                        <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-md hover:shadow-xl transition-all hover:border-indigo-300 group">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform">
                                {index + 1}
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Target Field */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">When Field</label>
                                <select
                                  value={condition.targetId}
                                  onChange={(e) => updateCondition(index, 'targetId', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                  {availableElements.map(el => (
                                    <option key={el.id} value={el.id}>
                                      {getText(el.label, currentLanguage)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Operator */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Operator</label>
                                <select
                                  value={condition.operator}
                                  onChange={(e) => updateCondition(index, 'operator', e.target.value as ConditionOperator)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                  {getOperatorsForType(targetElement?.type || 'text').map(op => (
                                    <option key={op} value={op}>{operatorLabels[op]}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Value - hide for is_empty/is_not_empty */}
                              {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Value</label>
                                {hasOptions && options.length > 0 ? (
                                  <select
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                  >
                                    <option value="">-- Select --</option>
                                    {options.map((opt, i) => (
                                      <option key={i} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : targetElement?.type === 'number' || targetElement?.type === 'rating' ? (
                                  <input
                                    type="number"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    placeholder="Enter number..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                    placeholder="Enter value..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                )}
                              </div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => removeCondition(index)}
                              className="flex-shrink-0 mt-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove condition"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Condition Preview */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Preview:</span>
                              <code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                                IF "{getText(targetElement?.label || { th: '...', en: '...' }, currentLanguage)}" {condition.operator.replace('_', ' ')} "{condition.value || '...'}"
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {logic.conditions.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 mb-2 text-base flex items-center gap-2">
                        Logic Summary
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full font-bold">
                          {logic.conditions.length} condition{logic.conditions.length > 1 ? 's' : ''}
                        </span>
                      </h4>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-amber-200">
                        <p className="text-sm text-amber-900 leading-relaxed">
                          This field will be <span className={`font-bold px-2 py-0.5 rounded ${
                            action === 'show' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>{action === 'show' ? 'SHOWN' : 'HIDDEN'}</span> when{' '}
                          <span className="font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {logic.combinator === 'AND' ? 'ALL' : 'ANY'}
                          </span> of the above conditions are met.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tips */}
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <p className="font-semibold mb-1">💡 Tips:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Use <strong>AND</strong> when all conditions must be true</li>
                      <li>Use <strong>OR</strong> when any condition can be true</li>
                      <li>Test your logic in Preview mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all logic rules?')) {
                setLogic({ combinator: 'AND', conditions: [] });
                onSave(undefined);
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-white hover:bg-red-500 border-2 border-red-300 hover:border-red-500 rounded-lg font-semibold transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Logic
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-white hover:border-slate-400 transition-all font-semibold shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="group px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Logic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicBuilder;
