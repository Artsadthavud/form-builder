
import React, { useMemo, useState } from 'react';
import { ElementType } from '../types';

interface ToolboxProps {
  onAdd: (type: ElementType) => void;
}

const groupedTools: Record<string, { type: ElementType; icon: string; label: string }[]> = {
  Basic: [
    { type: 'text', label: 'Text Input', icon: 'T' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'phone', label: 'Phone', icon: '📞' },
    { type: 'textarea', label: 'Text Area', icon: '≡' },
    { type: 'number', label: 'Number Input', icon: '#' },
    { type: 'paragraph', label: 'Text Block', icon: '¶' },
  ],
  Verification: [
    { type: 'phone_otp', label: 'Phone + OTP', icon: '📱' },
    { type: 'email_otp', label: 'Email + OTP', icon: '✉️' },
  ],
  Choice: [
    { type: 'select', label: 'Dropdown', icon: '▼' },
    { type: 'radio', label: 'Radio Group', icon: '◉' },
    { type: 'checkbox', label: 'Checkbox Group', icon: '☑' },
    { type: 'rating', label: 'Star Rating', icon: '★' },
  ],
  Layout: [
    { type: 'section', label: 'Section Group', icon: '❏' },
    { type: 'image', label: 'Image / Logo', icon: '🖼️' },
    { type: 'signature', label: 'Signature', icon: '✎' },
  ],
  Misc: [
    { type: 'date', label: 'Date Picker', icon: '📅' },
    { type: 'time', label: 'Time Picker', icon: '⏰' },
    { type: 'file', label: 'File Upload', icon: '📎' },
  ]
};

const Toolbox: React.FC<ToolboxProps> = ({ onAdd }) => {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => Object.keys(groupedTools), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return groupedTools;
    const q = query.toLowerCase().trim();
    const out: Record<string, { type: ElementType; icon: string; label: string }[]> = {};
    for (const cat of categories) {
      const items = groupedTools[cat].filter(t => t.label.toLowerCase().includes(q) || t.type.toLowerCase().includes(q));
      if (items.length) out[cat] = items;
    }
    return out;
  }, [query, categories]);

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-3 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Components</h2>
        <input
          placeholder="Search components..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full px-2 py-1 text-sm border border-slate-200 rounded bg-white"
        />
      </div>

      <div className="p-3 space-y-4">
        {Object.keys(filtered).map(cat => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-500 uppercase">{cat}</div>
              <button onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))} className="text-xs text-slate-400">{collapsed[cat] ? 'Expand' : 'Collapse'}</button>
            </div>
            {!collapsed[cat] && (
              <div className="grid grid-cols-2 gap-3">
                {filtered[cat].map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => onAdd(tool.type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('application/x-formflow-new', tool.type);
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group h-20"
                  >
                    <span className="text-2xl mb-1 text-slate-400 group-hover:text-indigo-500">{tool.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{tool.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbox;
