import React from 'react';
import {
  FormElement, FormElementOption, FormFieldType, WidthOption,
  InputElement, TextAreaElement, RadioElement, SelectElement, Condition,
  HeadingElement, ParagraphElement,
} from '../types';
import ConditionalLogicEditor from './ConditionalLogicEditor';

interface PropertiesPanelProps {
  element: FormElement;
  onUpdate: (id: string, newProps: Partial<FormElement>) => void;
  onRemove: (id: string) => void;
  allElements: FormElement[];
}

const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdate, onRemove, allElements }) => {
  // Fix: Changed key type from `keyof FormElement` to `string` to allow updating element-specific properties.
  const updateProp = (key: string, value: any) => {
    onUpdate(element.id, { [key]: value } as Partial<FormElement>);
  };

  const renderCommonProps = () => (
    <>
      <div className="mb-4">
        <label htmlFor="element-id" className="block text-sm font-medium text-slate-600">
          Field ID
        </label>
        <input
          type="text"
          id="element-id"
          value={element.id}
          readOnly
          className={`${commonInputClasses} bg-slate-100 cursor-not-allowed`}
        />
      </div>
      {element.type !== 'heading' && element.type !== 'paragraph' && (
         <div className="mb-4">
            <label htmlFor="label" className="block text-sm font-medium text-slate-600">
              Label
            </label>
            <input
              type="text"
              id="label"
              value={element.label}
              onChange={(e) => updateProp('label', e.target.value)}
              className={commonInputClasses}
            />
          </div>
      )}
       <div className="mb-4">
        <label htmlFor="width" className="block text-sm font-medium text-slate-600">
          Width
        </label>
        <select
          id="width"
          value={element.width}
          onChange={(e) => updateProp('width', e.target.value as WidthOption)}
          className={commonInputClasses}
        >
          <option value="w-full">Full</option>
          <option value="w-1/2">1/2</option>
          <option value="w-1/3">1/3</option>
          <option value="w-2/3">2/3</option>
        </select>
      </div>
    </>
  );

  const renderSpecificProps = () => {
    switch (element.type) {
      case FormFieldType.HEADING:
          const headingEl = element as HeadingElement;
          return <>
              <div className="mb-4">
                  <label htmlFor="text" className="block text-sm font-medium text-slate-600">Text</label>
                  <input type="text" id="text" value={headingEl.text} onChange={(e) => updateProp('text', e.target.value)} className={commonInputClasses} />
              </div>
              <div className="mb-4">
                  <label htmlFor="level" className="block text-sm font-medium text-slate-600">Level</label>
                  <select id="level" value={headingEl.level} onChange={(e) => updateProp('level', e.target.value)} className={commonInputClasses}>
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                  </select>
              </div>
          </>;
      case FormFieldType.PARAGRAPH:
          const paragraphEl = element as ParagraphElement;
          return <div className="mb-4">
              <label htmlFor="text" className="block text-sm font-medium text-slate-600">Text</label>
              <textarea id="text" value={paragraphEl.text} rows={4} onChange={(e) => updateProp('text', e.target.value)} className={commonInputClasses} />
          </div>;
      case FormFieldType.TEXT:
      case FormFieldType.EMAIL:
      case FormFieldType.PASSWORD:
      case FormFieldType.NUMBER:
        const inputEl = element as InputElement;
        return <>
            <div className="mb-4">
                <label htmlFor="placeholder" className="block text-sm font-medium text-slate-600">Placeholder</label>
                <input type="text" id="placeholder" value={inputEl.placeholder} onChange={(e) => updateProp('placeholder', e.target.value)} className={commonInputClasses} />
            </div>
            <div className="flex items-center mb-4">
                <input type="checkbox" id="required" checked={inputEl.required} onChange={(e) => updateProp('required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="required" className="ml-2 block text-sm text-slate-900">Required</label>
            </div>
        </>;
      case FormFieldType.TEXTAREA:
        const textareaEl = element as TextAreaElement;
        return <>
            <div className="mb-4">
                <label htmlFor="placeholder" className="block text-sm font-medium text-slate-600">Placeholder</label>
                <input type="text" id="placeholder" value={textareaEl.placeholder} onChange={(e) => updateProp('placeholder', e.target.value)} className={commonInputClasses} />
            </div>
            <div className="mb-4">
                <label htmlFor="rows" className="block text-sm font-medium text-slate-600">Rows</label>
                <input type="number" id="rows" value={textareaEl.rows} onChange={(e) => updateProp('rows', parseInt(e.target.value, 10))} className={commonInputClasses} />
            </div>
            <div className="flex items-center mb-4">
                <input type="checkbox" id="required" checked={textareaEl.required} onChange={(e) => updateProp('required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="required" className="ml-2 block text-sm text-slate-900">Required</label>
            </div>
        </>;
      case FormFieldType.CHECKBOX:
          const checkboxEl = element;
          return <div className="flex items-center mb-4">
              <input type="checkbox" id="required" checked={checkboxEl.required} onChange={(e) => updateProp('required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="required" className="ml-2 block text-sm text-slate-900">Required</label>
          </div>;
      case FormFieldType.RADIO:
      case FormFieldType.SELECT:
        const optionEl = element as RadioElement | SelectElement;
        const updateOption = (index: number, prop: keyof FormElementOption, value: string) => {
            const newOptions = [...optionEl.options];
            newOptions[index] = { ...newOptions[index], [prop]: value };
            updateProp('options', newOptions);
        };
        const addOption = () => {
            const newOption: FormElementOption = { id: `opt-${Date.now()}`, label: 'New Option', value: 'new_option' };
            updateProp('options', [...optionEl.options, newOption]);
        };
        const removeOption = (index: number) => {
            const newOptions = optionEl.options.filter((_, i) => i !== index);
            updateProp('options', newOptions);
        };
        return <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600">Options</label>
                <div className="space-y-2 mt-2">
                    {optionEl.options.map((opt, index) => (
                        <div key={opt.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                            <input type="text" value={opt.label} onChange={(e) => updateOption(index, 'label', e.target.value)} placeholder="Label" className="flex-1 text-sm border-slate-300 rounded-md shadow-sm"/>
                            <input type="text" value={opt.value} onChange={(e) => updateOption(index, 'value', e.target.value)} placeholder="Value" className="flex-1 text-sm border-slate-300 rounded-md shadow-sm"/>
                            <button onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={addOption} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Option</button>
            </div>
             <div className="flex items-center mb-4">
                <input type="checkbox" id="required" checked={optionEl.required} onChange={(e) => updateProp('required', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="required" className="ml-2 block text-sm text-slate-900">Required</label>
            </div>
        </>;
      default:
        return null;
    }
  };

  return (
    <aside className="w-80 bg-white p-4 border-l border-slate-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Properties</h3>
        <button onClick={() => onRemove(element.id)} className="text-slate-500 hover:text-red-600 p-1 rounded-full transition-colors">
          <TrashIcon />
        </button>
      </div>
      <div className="divide-y divide-slate-200">
        <div className="py-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase mb-2">General</h4>
            {renderCommonProps()}
            {renderSpecificProps()}
        </div>
        <div className="py-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase mb-2">Conditional Logic</h4>
            <ConditionalLogicEditor 
                element={element} 
                allElements={allElements} 
                onUpdateConditions={(conditions) => updateProp('conditions', conditions)} 
            />
        </div>
      </div>
    </aside>
  );
};

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default PropertiesPanel;