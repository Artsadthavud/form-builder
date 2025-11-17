
import React from 'react';
import { FormElement, FormFieldType, CheckboxElement, InputElement, RadioElement, SelectElement, TextAreaElement, HeadingElement, ParagraphElement } from '../types';

interface RenderedElementProps {
  element: FormElement;
  value: any;
  onChange: (value: any) => void;
  isPreview: boolean;
  isDisabled: boolean;
}

const RenderedElement: React.FC<RenderedElementProps> = ({ element, value, onChange, isPreview, isDisabled }) => {
  const commonInputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none";
  
  const renderLabel = (el: FormElement) => {
    if (el.type === FormFieldType.HEADING || el.type === FormFieldType.PARAGRAPH) return null;
    return (
        <label htmlFor={el.id} className="block text-sm font-medium text-slate-700">
            {el.label}
            {('required' in el && el.required) && <span className="text-red-500 ml-1">*</span>}
        </label>
    );
  };
  
  const switchElement = () => {
    switch (element.type) {
      case FormFieldType.TEXT:
      case FormFieldType.EMAIL:
      case FormFieldType.PASSWORD:
      case FormFieldType.NUMBER:
        const inputEl = element as InputElement;
        return (
          <>
            {renderLabel(inputEl)}
            <input
              type={inputEl.type}
              id={inputEl.id}
              name={inputEl.id}
              placeholder={inputEl.placeholder}
              required={inputEl.required}
              className={commonInputClasses}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isPreview || isDisabled}
            />
          </>
        );
      case FormFieldType.TEXTAREA:
        const textareaEl = element as TextAreaElement;
        return (
          <>
            {renderLabel(textareaEl)}
            <textarea
              id={textareaEl.id}
              name={textareaEl.id}
              placeholder={textareaEl.placeholder}
              required={textareaEl.required}
              rows={textareaEl.rows}
              className={commonInputClasses}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isPreview || isDisabled}
            />
          </>
        );
      case FormFieldType.CHECKBOX:
        const checkboxEl = element as CheckboxElement;
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={checkboxEl.id}
              name={checkboxEl.id}
              required={checkboxEl.required}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={!isPreview || isDisabled}
            />
            <label htmlFor={checkboxEl.id} className="ml-2 block text-sm text-slate-900">
              {checkboxEl.label}
              {checkboxEl.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );
      case FormFieldType.RADIO:
        const radioEl = element as RadioElement;
        return (
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
                {radioEl.label}
                {radioEl.required && <span className="text-red-500 ml-1">*</span>}
            </legend>
            <div className="mt-2 space-y-2">
              {radioEl.options.map(option => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`${radioEl.id}-${option.id}`}
                    name={radioEl.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!isPreview || isDisabled}
                  />
                  <label htmlFor={`${radioEl.id}-${option.id}`} className="ml-2 block text-sm text-slate-900">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        );
      case FormFieldType.SELECT:
        const selectEl = element as SelectElement;
        return (
          <>
            {renderLabel(selectEl)}
            <select
              id={selectEl.id}
              name={selectEl.id}
              required={selectEl.required}
              className={commonInputClasses}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isPreview || isDisabled}
            >
              <option value="">Select an option</option>
              {selectEl.options.map(option => (
                <option key={option.id} value={option.value}>{option.label}</option>
              ))}
            </select>
          </>
        );
      case FormFieldType.HEADING:
        const headingEl = element as HeadingElement;
        const Tag = headingEl.level;
        return <Tag className="font-bold text-slate-800">{headingEl.text}</Tag>;
      case FormFieldType.PARAGRAPH:
        const paragraphEl = element as ParagraphElement;
        return <p className="text-slate-600 text-sm">{paragraphEl.text}</p>;
      default:
        return <div>Unsupported element type</div>;
    }
  };

  return <div className={`${element.width}`}>{switchElement()}</div>;
};

export default RenderedElement;
