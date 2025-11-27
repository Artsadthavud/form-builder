import React, { memo, useCallback } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = memo(({ label, value, onChange }) => {
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={handleColorChange}
          className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
        />
      </div>
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
