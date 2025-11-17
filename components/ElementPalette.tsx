import React from 'react';
import { FormFieldType } from '../types';

interface ElementPaletteProps {
  onAddElement: (type: FormFieldType) => void;
}

// Fix: Changed icon type from JSX.Element to React.ReactNode to resolve potential namespace issues.
const PaletteButton: React.FC<{ type: FormFieldType; label: string; icon: React.ReactNode; onAdd: () => void; }> = ({ label, icon, onAdd }) => (
  <button
    onClick={onAdd}
    className="w-full flex items-center p-2 text-left bg-white rounded-md border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150"
  >
    <div className="bg-blue-100 text-blue-600 rounded p-1 mr-3">{icon}</div>
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </button>
);

const ElementPalette: React.FC<ElementPaletteProps> = ({ onAddElement }) => {
  const elements = [
    { type: FormFieldType.HEADING, label: 'Heading', icon: <HeadingIcon /> },
    { type: FormFieldType.PARAGRAPH, label: 'Paragraph', icon: <ParagraphIcon /> },
    { type: FormFieldType.TEXT, label: 'Text Input', icon: <TextIcon /> },
    { type: FormFieldType.TEXTAREA, label: 'Text Area', icon: <TextareaIcon /> },
    { type: FormFieldType.NUMBER, label: 'Number Input', icon: <NumberIcon /> },
    { type: FormFieldType.CHECKBOX, label: 'Checkbox', icon: <CheckboxIcon /> },
    { type: FormFieldType.RADIO, label: 'Radio Group', icon: <RadioIcon /> },
    { type: FormFieldType.SELECT, label: 'Dropdown', icon: <SelectIcon /> },
  ];

  return (
    <aside className="w-64 bg-white p-4 border-r border-slate-200 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">Form Elements</h2>
      <div className="space-y-2">
        {elements.map(({ type, label, icon }) => (
          <PaletteButton
            key={type}
            type={type}
            label={label}
            icon={icon}
            onAdd={() => onAddElement(type)}
          />
        ))}
      </div>
    </aside>
  );
};

const IconWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="w-5 h-5">{children}</div>;
const HeadingIcon = () => <IconWrapper><strong>H</strong></IconWrapper>;
const ParagraphIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg></IconWrapper>;
const TextIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M8 7h8m-8 10h8" /></svg></IconWrapper>;
const TextareaIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 6h6m-6 12h6" /></svg></IconWrapper>;
const NumberIcon = () => <IconWrapper><strong>123</strong></IconWrapper>;
const CheckboxIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></IconWrapper>;
const RadioIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" /></svg></IconWrapper>;
const SelectIcon = () => <IconWrapper><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></IconWrapper>;

export default ElementPalette;