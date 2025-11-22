
import React from 'react';
import { ElementType } from '../types';

interface ToolboxProps {
  onAdd: (type: ElementType) => void;
}

const tools: { type: ElementType; icon: string; label: string }[] = [
  { type: 'section', label: 'Section Group', icon: '❏' },
  { type: 'paragraph', label: 'Text Block', icon: '¶' },
  { type: 'text', label: 'Text Input', icon: 'T' },
  { type: 'number', label: 'Number Input', icon: '#' },
  { type: 'textarea', label: 'Text Area', icon: '≡' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'date', label: 'Date Picker', icon: '📅' },
  { type: 'time', label: 'Time Picker', icon: '⏰' },
  { type: 'radio', label: 'Radio Group', icon: '◉' },
  { type: 'checkbox', label: 'Checkbox Group', icon: '☑' },
  { type: 'file', label: 'File Upload', icon: '📎' },
  { type: 'rating', label: 'Star Rating', icon: '★' },
  { type: 'signature', label: 'Signature', icon: '✎' },
  { type: 'image', label: 'Image / Logo', icon: '🖼️' },
];

const Toolbox: React.FC<ToolboxProps> = ({ onAdd }) => {
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Components</h2>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onAdd(tool.type)}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group h-24"
          >
            <span className="text-2xl mb-2 text-slate-400 group-hover:text-indigo-500">{tool.icon}</span>
            <span className="text-xs font-medium text-center leading-tight">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbox;
