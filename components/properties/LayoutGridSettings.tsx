import React from 'react';
import { FormElement } from '../../types';

interface LayoutGridSettingsProps {
  element: FormElement;
  onUpdate: (element: FormElement) => void;
}

const WidthButton: React.FC<{
  w: string;
  label: string;
  currentWidth: string;
  onClick: (w: string) => void;
}> = ({ w, label, currentWidth, onClick }) => {
  const isActive = currentWidth === w;
  return (
    <button
      onClick={() => onClick(w)}
      className={`flex-1 py-1.5 text-[10px] font-medium border rounded transition-all ${
        isActive
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'
      }`}
      title={`Set width to ${w === '100' ? '100%' : w + '%'}`}
    >
      {label}
    </button>
  );
};

const LayoutGridSettings: React.FC<LayoutGridSettingsProps> = ({ element, onUpdate }) => {
  const handleWidthChange = (width: string) => {
    onUpdate({ ...element, width });
  };

  const currentWidth = element.width || '100';

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
        </svg>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Layout & Grid</h3>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Width (Column Span)</label>
        <div className="space-y-1">
          <div className="flex gap-1">
            <WidthButton w="100" label="100%" currentWidth={currentWidth} onClick={handleWidthChange} />
          </div>
          <div className="flex gap-1">
            <WidthButton w="50" label="50%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="50" label="50%" currentWidth={currentWidth} onClick={handleWidthChange} />
          </div>
          <div className="flex gap-1">
            <WidthButton w="33" label="33%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="33" label="33%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="33" label="33%" currentWidth={currentWidth} onClick={handleWidthChange} />
          </div>
          <div className="flex gap-1">
            <WidthButton w="25" label="25%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="25" label="25%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="25" label="25%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="25" label="25%" currentWidth={currentWidth} onClick={handleWidthChange} />
          </div>
          <div className="flex gap-1">
            <WidthButton w="67" label="67%" currentWidth={currentWidth} onClick={handleWidthChange} />
            <WidthButton w="33" label="33%" currentWidth={currentWidth} onClick={handleWidthChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutGridSettings;
