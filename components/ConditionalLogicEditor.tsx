
import React from 'react';
import { FormElement, Condition, ConditionAction, ConditionOperator } from '../types';

interface ConditionalLogicEditorProps {
  element: FormElement;
  allElements: FormElement[];
  onUpdateConditions: (conditions: Condition[]) => void;
}

const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = ({ element, allElements, onUpdateConditions }) => {
  const possibleTargets = allElements.filter(el => el.id !== element.id && el.type !== 'heading' && el.type !== 'paragraph');

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      targetId: '',
      operator: 'equals',
      value: '',
      action: 'show',
    };
    onUpdateConditions([...element.conditions, newCondition]);
  };

  const updateCondition = (index: number, newProps: Partial<Condition>) => {
    const newConditions = [...element.conditions];
    newConditions[index] = { ...newConditions[index], ...newProps };
    onUpdateConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = element.conditions.filter((_, i) => i !== index);
    onUpdateConditions(newConditions);
  };
  
  const commonSelectClasses = "text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <div className="space-y-3">
      {element.conditions.map((condition, index) => (
        <div key={condition.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">RULE #{index + 1}</span>
            <button onClick={() => removeCondition(index)} className="text-red-500 hover:text-red-700 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
              <select
                value={condition.action}
                onChange={e => updateCondition(index, { action: e.target.value as ConditionAction })}
                className={commonSelectClasses}
              >
                <option value="show">Show</option>
                <option value="hide">Hide</option>
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <span className="self-center text-sm text-slate-600">this field if:</span>
          </div>

          <select
            value={condition.targetId}
            onChange={e => updateCondition(index, { targetId: e.target.value })}
            className={`${commonSelectClasses} w-full`}
          >
            <option value="">Select a field...</option>
            {possibleTargets.map(target => (
              <option key={target.id} value={target.id}>
                {target.label} ({target.id.substring(0, 8)})
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={e => updateCondition(index, { operator: e.target.value as ConditionOperator })}
            className={`${commonSelectClasses} w-full`}
          >
            <option value="equals">is equal to</option>
            <option value="not_equals">is not equal to</option>
            <option value="contains">contains</option>
          </select>
          
          <input
            type="text"
            placeholder="Value"
            value={condition.value}
            onChange={e => updateCondition(index, { value: e.target.value })}
            className={`w-full text-sm border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500`}
          />
        </div>
      ))}
      <button onClick={addCondition} className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium p-2 bg-blue-50 rounded-md border border-dashed border-blue-300 hover:bg-blue-100">
        + Add Rule
      </button>
    </div>
  );
};

export default ConditionalLogicEditor;
