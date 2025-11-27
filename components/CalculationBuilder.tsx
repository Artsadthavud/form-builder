import React, { useState } from 'react';
import { FormElement, Calculation, CalculationStep, CalculationOperator } from '../types';
import { getText } from '../utils/i18n';

interface CalculationBuilderProps {
  element: FormElement;
  allElements: FormElement[];
  currentLanguage: string;
  onSave: (calculation: Calculation | undefined) => void;
  onClose: () => void;
}

const operatorSymbols: Record<CalculationOperator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '%': '%'
};

const CalculationBuilder: React.FC<CalculationBuilderProps> = ({
  element,
  allElements,
  currentLanguage,
  onSave,
  onClose
}) => {
  const [calculation, setCalculation] = useState<Calculation>(element.calculation || {
    enabled: true,
    formula: [],
    decimalPlaces: 2,
    prefix: '',
    suffix: ''
  });

  // Get all numeric fields that can be used in calculation (excluding current element)
  const availableFields = allElements.filter(el =>
    el.id !== element.id && (el.type === 'number' || el.type === 'rating')
  );

  const addStep = (type: 'field' | 'constant') => {
    const newStep: CalculationStep = {
      operand: type === 'field' 
        ? { type: 'field', fieldId: availableFields[0]?.id || '' }
        : { type: 'constant', value: 0 },
      operator: calculation.formula.length > 0 ? '+' : undefined
    };
    
    // If adding to non-empty formula, need to set operator on previous step
    const newFormula = [...calculation.formula];
    if (newFormula.length > 0 && !newFormula[newFormula.length - 1].operator) {
      newFormula[newFormula.length - 1] = {
        ...newFormula[newFormula.length - 1],
        operator: '+'
      };
    }
    newFormula.push(newStep);
    
    setCalculation({ ...calculation, formula: newFormula });
  };

  const updateStep = (index: number, updates: Partial<CalculationStep>) => {
    const newFormula = [...calculation.formula];
    newFormula[index] = { ...newFormula[index], ...updates };
    setCalculation({ ...calculation, formula: newFormula });
  };

  const updateOperand = (index: number, field: 'type' | 'fieldId' | 'value', value: any) => {
    const newFormula = [...calculation.formula];
    newFormula[index] = {
      ...newFormula[index],
      operand: { ...newFormula[index].operand, [field]: value }
    };
    setCalculation({ ...calculation, formula: newFormula });
  };

  const removeStep = (index: number) => {
    const newFormula = calculation.formula.filter((_, i) => i !== index);
    // Clean up operators
    if (newFormula.length > 0) {
      newFormula[newFormula.length - 1] = {
        ...newFormula[newFormula.length - 1],
        operator: undefined
      };
    }
    setCalculation({ ...calculation, formula: newFormula });
  };

  const handleSave = () => {
    if (!calculation.enabled || calculation.formula.length === 0) {
      onSave(undefined);
    } else {
      onSave(calculation);
    }
    onClose();
  };

  const getPreviewFormula = (): string => {
    if (calculation.formula.length === 0) return 'No formula defined';
    
    return calculation.formula.map((step, i) => {
      let operandStr = '';
      if (step.operand.type === 'field') {
        const field = availableFields.find(f => f.id === step.operand.fieldId);
        operandStr = field ? `[${getText(field.label, currentLanguage)}]` : '[?]';
      } else {
        operandStr = String(step.operand.value ?? 0);
      }
      
      const opStr = step.operator ? ` ${operatorSymbols[step.operator]} ` : '';
      return operandStr + opStr;
    }).join('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Calculation Builder</h2>
              <p className="text-amber-100 text-sm mt-0.5">
                <span className="opacity-75">Auto-calculate value for:</span>{' '}
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">
                  {getText(element.label, currentLanguage)}
                </span>
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
          {availableFields.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-4">
                <svg className="w-20 h-20 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-slate-700 font-bold text-lg mb-2">No Numeric Fields Available</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Add Number or Rating fields before this element to create calculations.
              </p>
            </div>
          ) : (
            <>
              {/* Enable Toggle */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="calc-enabled"
                  checked={calculation.enabled}
                  onChange={(e) => setCalculation({ ...calculation, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="calc-enabled" className="text-sm font-medium text-slate-700">
                  Enable automatic calculation for this field
                </label>
              </div>

              {calculation.enabled && (
                <>
                  {/* Formula Preview */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                    <div className="text-xs font-semibold text-amber-700 mb-2">Formula Preview</div>
                    <div className="font-mono text-lg text-amber-900 bg-white/60 px-4 py-3 rounded-lg">
                      {calculation.prefix && <span className="text-amber-600">{calculation.prefix}</span>}
                      {getPreviewFormula()}
                      {calculation.suffix && <span className="text-amber-600">{calculation.suffix}</span>}
                    </div>
                  </div>

                  {/* Formula Steps */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Formula Steps
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addStep('field')}
                          className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          + Add Field
                        </button>
                        <button
                          onClick={() => addStep('constant')}
                          className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          + Add Constant
                        </button>
                      </div>
                    </div>

                    {calculation.formula.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <p className="text-slate-500 text-sm">Click "Add Field" or "Add Constant" to build your formula</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {calculation.formula.map((step, index) => (
                          <div key={index} className="flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl">
                            {/* Step Number */}
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>

                            {/* Operand Type */}
                            <select
                              value={step.operand.type}
                              onChange={(e) => updateOperand(index, 'type', e.target.value)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            >
                              <option value="field">Field</option>
                              <option value="constant">Constant</option>
                            </select>

                            {/* Value */}
                            {step.operand.type === 'field' ? (
                              <select
                                value={step.operand.fieldId || ''}
                                onChange={(e) => updateOperand(index, 'fieldId', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              >
                                {availableFields.map(field => (
                                  <option key={field.id} value={field.id}>
                                    {getText(field.label, currentLanguage)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                value={step.operand.value ?? 0}
                                onChange={(e) => updateOperand(index, 'value', parseFloat(e.target.value) || 0)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              />
                            )}

                            {/* Operator (if not last) */}
                            {index < calculation.formula.length - 1 && (
                              <select
                                value={step.operator || '+'}
                                onChange={(e) => updateStep(index, { operator: e.target.value as CalculationOperator })}
                                className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center"
                              >
                                {Object.entries(operatorSymbols).map(([op, symbol]) => (
                                  <option key={op} value={op}>{symbol}</option>
                                ))}
                              </select>
                            )}

                            {/* Remove */}
                            <button
                              onClick={() => removeStep(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formatting Options */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Decimal Places</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={calculation.decimalPlaces ?? 2}
                        onChange={(e) => setCalculation({ ...calculation, decimalPlaces: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Prefix (e.g. ฿)</label>
                      <input
                        type="text"
                        value={calculation.prefix || ''}
                        onChange={(e) => setCalculation({ ...calculation, prefix: e.target.value })}
                        placeholder="฿"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Suffix (e.g. บาท)</label>
                      <input
                        type="text"
                        value={calculation.suffix || ''}
                        onChange={(e) => setCalculation({ ...calculation, suffix: e.target.value })}
                        placeholder="บาท"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </>
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
            onClick={() => {
              setCalculation({ enabled: true, formula: [], decimalPlaces: 2, prefix: '', suffix: '' });
            }}
            className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg font-semibold"
          >
            Save Calculation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationBuilder;
