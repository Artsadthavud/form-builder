import React, { useState } from 'react';
import { FormElement, FormPage, SkipRule, Condition, ConditionOperator } from '../types';
import { getText } from '../utils/i18n';
import { operatorLabels as allOperatorLabels, getOperatorsForType } from '../utils/advancedLogic';

interface SkipLogicBuilderProps {
  page: FormPage;
  allPages: FormPage[];
  allElements: FormElement[];
  currentLanguage: string;
  onSave: (skipRules: SkipRule[] | undefined) => void;
  onClose: () => void;
}

const SkipLogicBuilder: React.FC<SkipLogicBuilderProps> = ({
  page,
  allPages,
  allElements,
  currentLanguage,
  onSave,
  onClose
}) => {
  const [skipRules, setSkipRules] = useState<SkipRule[]>(page.skipRules || []);

  const operatorLabels: Record<ConditionOperator, string> = Object.fromEntries(
    Object.entries(allOperatorLabels).map(([k, v]) => [k, `${v.th} (${v.en})`])
  ) as Record<ConditionOperator, string>;

  // Get current page index
  const currentPageIndex = allPages.findIndex(p => p.id === page.id);
  
  // Pages that can be skipped to (after current page)
  const targetPages = allPages.slice(currentPageIndex + 1);

  // Elements on current page that can be used as conditions
  const availableElements = allElements.filter(el =>
    el.pageId === page.id &&
    el.type !== 'image' &&
    el.type !== 'paragraph' &&
    el.type !== 'section'
  );

  const addRule = () => {
    const newRule: SkipRule = {
      id: `skip_${Date.now()}`,
      conditions: [],
      combinator: 'AND',
      targetPageId: targetPages[0]?.id || ''
    };
    setSkipRules([...skipRules, newRule]);
  };

  const updateRule = (index: number, updates: Partial<SkipRule>) => {
    const newRules = [...skipRules];
    newRules[index] = { ...newRules[index], ...updates };
    setSkipRules(newRules);
  };

  const removeRule = (index: number) => {
    setSkipRules(skipRules.filter((_, i) => i !== index));
  };

  const addCondition = (ruleIndex: number) => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      targetId: availableElements[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    const newRules = [...skipRules];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      conditions: [...newRules[ruleIndex].conditions, newCondition]
    };
    setSkipRules(newRules);
  };

  const updateCondition = (ruleIndex: number, condIndex: number, field: keyof Condition, value: any) => {
    const newRules = [...skipRules];
    const conditions = [...newRules[ruleIndex].conditions];
    conditions[condIndex] = { ...conditions[condIndex], [field]: value };
    newRules[ruleIndex] = { ...newRules[ruleIndex], conditions };
    setSkipRules(newRules);
  };

  const removeCondition = (ruleIndex: number, condIndex: number) => {
    const newRules = [...skipRules];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      conditions: newRules[ruleIndex].conditions.filter((_, i) => i !== condIndex)
    };
    setSkipRules(newRules);
  };

  const getElementOptions = (targetElement: FormElement): string[] => {
    if (targetElement.type === 'radio' || targetElement.type === 'checkbox' || targetElement.type === 'select') {
      return targetElement.options?.map(opt => typeof opt.label === 'string' ? opt.label : opt.label.th) || [];
    }
    return [];
  };

  const handleSave = () => {
    const validRules = skipRules.filter(rule => 
      rule.conditions.length > 0 && rule.targetPageId
    );
    onSave(validRules.length > 0 ? validRules : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Skip Logic Builder</h2>
              <p className="text-cyan-100 text-sm mt-0.5">
                <span className="opacity-75">Configure page skipping for:</span>{' '}
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">{page.label}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/20 rounded-lg transition-all hover:rotate-90 duration-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {targetPages.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-slate-700 font-bold text-lg mb-2">No Pages to Skip To</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                This is the last page. Add more pages after this one to create skip logic.
              </p>
            </div>
          ) : availableElements.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-700 font-bold text-lg mb-2">No Fields on This Page</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Add input fields to this page to create skip logic based on user responses.
              </p>
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyan-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-cyan-800">
                    <p className="font-semibold mb-1">How Skip Logic Works</p>
                    <p>When conditions are met, the form will skip directly to the target page, bypassing intermediate pages.</p>
                  </div>
                </div>
              </div>

              {/* Add Rule Button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Skip Rules
                  {skipRules.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {skipRules.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Skip Rule
                </button>
              </div>

              {/* Rules List */}
              {skipRules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-slate-500 text-sm">Click "Add Skip Rule" to define when to skip pages</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {skipRules.map((rule, ruleIndex) => (
                    <div key={rule.id} className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                      {/* Rule Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {ruleIndex + 1}
                          </span>
                          <span className="font-semibold text-slate-700">Skip Rule</span>
                        </div>
                        <button
                          onClick={() => removeRule(ruleIndex)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Target Page */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                          Skip to Page
                        </label>
                        <select
                          value={rule.targetPageId}
                          onChange={(e) => updateRule(ruleIndex, { targetPageId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          {targetPages.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Conditions */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-600">When</label>
                          <button
                            onClick={() => addCondition(ruleIndex)}
                            className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                          >
                            + Add Condition
                          </button>
                        </div>

                        {rule.conditions.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">No conditions (click "Add Condition")</p>
                        ) : (
                          <div className="space-y-2">
                            {rule.conditions.map((condition, condIndex) => {
                              const targetElement = availableElements.find(el => el.id === condition.targetId);
                              const hasOptions = targetElement && ['radio', 'checkbox', 'select'].includes(targetElement.type);
                              const options = targetElement ? getElementOptions(targetElement) : [];

                              return (
                                <div key={condition.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                  {condIndex > 0 && (
                                    <select
                                      value={rule.combinator}
                                      onChange={(e) => updateRule(ruleIndex, { combinator: e.target.value as 'AND' | 'OR' })}
                                      className="w-16 px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                                    >
                                      <option value="AND">AND</option>
                                      <option value="OR">OR</option>
                                    </select>
                                  )}

                                  <select
                                    value={condition.targetId}
                                    onChange={(e) => updateCondition(ruleIndex, condIndex, 'targetId', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                                  >
                                    {availableElements.map(el => (
                                      <option key={el.id} value={el.id}>
                                        {getText(el.label, currentLanguage)}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    value={condition.operator}
                                    onChange={(e) => updateCondition(ruleIndex, condIndex, 'operator', e.target.value)}
                                    className="w-40 px-2 py-1 text-sm border border-slate-300 rounded"
                                  >
                                    {getOperatorsForType(targetElement?.type || 'text').map(op => (
                                      <option key={op} value={op}>{operatorLabels[op]}</option>
                                    ))}
                                  </select>

                                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                    hasOptions ? (
                                      <select
                                        value={condition.value}
                                        onChange={(e) => updateCondition(ruleIndex, condIndex, 'value', e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                                      >
                                        <option value="">-- Select --</option>
                                        {options.map((opt, i) => (
                                          <option key={i} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={targetElement?.type === 'number' ? 'number' : 'text'}
                                        value={condition.value}
                                        onChange={(e) => updateCondition(ruleIndex, condIndex, 'value', e.target.value)}
                                        placeholder="Value..."
                                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                                      />
                                    )
                                  )}

                                  <button
                                    onClick={() => removeCondition(ruleIndex, condIndex)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Rule Summary */}
                      {rule.conditions.length > 0 && rule.targetPageId && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Summary:</span> When{' '}
                            {rule.conditions.length === 1 ? 'condition is' : `${rule.combinator === 'AND' ? 'all' : 'any'} conditions are`}{' '}
                            met, skip to <span className="font-semibold">{targetPages.find(p => p.id === rule.targetPageId)?.label}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => setSkipRules([])}
            className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg font-semibold"
          >
            Save Skip Logic
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkipLogicBuilder;
