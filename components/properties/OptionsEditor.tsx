import React, { memo, useCallback, useState } from 'react';
import { FormElement, Option, Language, FormMetadata, TranslatableText } from '../../types';
import { isTranslatable } from '../../utils/i18n';

interface OptionsEditorProps {
  element: FormElement;
  currentLanguage: Language;
  formMetadata: FormMetadata;
  onUpdate: (element: FormElement) => void;
}

const OptionsEditor: React.FC<OptionsEditorProps> = memo(({
  element,
  currentLanguage,
  formMetadata,
  onUpdate
}) => {
  const [draggedOptionIdx, setDraggedOptionIdx] = useState<number | null>(null);

  const handleChange = useCallback((field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  }, [element, onUpdate]);

  const handleOptionDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedOptionIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleOptionDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedOptionIdx === null || draggedOptionIdx === index) return;
    if (element.options) {
      const newOptions = [...element.options];
      const [draggedItem] = newOptions.splice(draggedOptionIdx, 1);
      newOptions.splice(index, 0, draggedItem);
      handleChange('options', newOptions);
      setDraggedOptionIdx(index);
    }
  }, [draggedOptionIdx, element.options, handleChange]);

  const handleOptionDragEnd = useCallback(() => {
    setDraggedOptionIdx(null);
  }, []);

  const addOption = useCallback(() => {
    const newOptId = `opt_${Date.now()}`;
    const newOptions = [...(element.options || []), { 
      id: newOptId, 
      label: { th: 'ตัวเลือกใหม่', en: 'New Option' }, 
      value: 'new_value' 
    }];
    handleChange('options', newOptions);
  }, [element.options, handleChange]);

  const removeOption = useCallback((idx: number) => {
    if (!element.options) return;
    const newOptions = element.options.filter((_, i) => i !== idx);
    const remainingValues = newOptions.map(o => o.value);
    let nextDefault: string | string[] | undefined = element.defaultValue;
    if (typeof nextDefault === 'string') {
      if (!remainingValues.includes(nextDefault)) nextDefault = undefined;
    } else if (Array.isArray(nextDefault)) {
      nextDefault = (nextDefault as string[]).filter(v => remainingValues.includes(v));
    }
    handleChange('options', newOptions);
    handleChange('defaultValue', nextDefault);
  }, [element.options, element.defaultValue, handleChange]);

  const updateOptionLabel = useCallback((idx: number, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    const current = newOptions[idx].label;
    if (isTranslatable(current)) {
      newOptions[idx] = { ...newOptions[idx], label: { ...current, [currentLanguage]: value } };
    } else if (typeof current === 'string' && current) {
      const trans: TranslatableText = { th: '', en: '' };
      trans[formMetadata.defaultLanguage || 'th'] = current;
      trans[currentLanguage] = value;
      newOptions[idx] = { ...newOptions[idx], label: trans };
    } else {
      const trans: TranslatableText = { th: '', en: '' };
      trans[currentLanguage] = value;
      newOptions[idx] = { ...newOptions[idx], label: trans };
    }
    handleChange('options', newOptions);
  }, [element.options, currentLanguage, formMetadata.defaultLanguage, handleChange]);

  const updateOptionValue = useCallback((idx: number, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    newOptions[idx] = { ...newOptions[idx], value };
    handleChange('options', newOptions);
  }, [element.options, handleChange]);

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">Alignment</label>
      <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
        <button 
          className={`flex-1 py-1 text-xs rounded font-medium transition-all ${(!element.orientation || element.orientation === 'vertical') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} 
          onClick={() => handleChange('orientation', 'vertical')}
        >
          Vertical
        </button>
        <button 
          className={`flex-1 py-1 text-xs rounded font-medium transition-all ${element.orientation === 'horizontal' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} 
          onClick={() => handleChange('orientation', 'horizontal')}
        >
          Horizontal
        </button>
      </div>

      {/* Options Editor */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-700 mb-2">Options</label>
        <div className="space-y-2">
          {(element.options || []).map((opt, idx) => (
            <div
              key={opt.id}
              draggable
              onDragStart={(e) => handleOptionDragStart(e, idx)}
              onDragOver={(e) => handleOptionDragOver(e, idx)}
              onDragEnd={handleOptionDragEnd}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 text-slate-400 text-center text-xs cursor-move">≡</div>
                <input
                  type="text"
                  placeholder={currentLanguage === 'th' ? 'ป้ายชื่อ (ไทย)' : 'Label (English)'}
                  value={typeof opt.label === 'string' ? opt.label : (opt.label?.[currentLanguage] || '')}
                  onChange={(e) => updateOptionLabel(idx, e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={opt.value}
                  onChange={(e) => updateOptionValue(idx, e.target.value)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm bg-white font-mono text-xs"
                />
                {/* Default selector */}
                {element.type === 'radio' || element.type === 'select' ? (
                  <label className="flex items-center gap-1 text-xs" title="Default">
                    <input
                      type="radio"
                      name={`default-${element.id}`}
                      className="h-4 w-4"
                      checked={element.defaultValue === opt.value}
                      onChange={() => handleChange('defaultValue', opt.value)}
                    />
                  </label>
                ) : null}
                {element.type === 'checkbox' ? (
                  <label className="flex items-center gap-1 text-xs" title="Default checked">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Array.isArray(element.defaultValue) && (element.defaultValue as string[]).includes(opt.value)}
                      onChange={(e) => {
                        const cur = Array.isArray(element.defaultValue) ? [...(element.defaultValue as string[])] : [];
                        if (e.target.checked) {
                          if (!cur.includes(opt.value)) cur.push(opt.value);
                        } else {
                          const i = cur.indexOf(opt.value);
                          if (i >= 0) cur.splice(i, 1);
                        }
                        handleChange('defaultValue', cur);
                      }}
                    />
                  </label>
                ) : null}
                <button onClick={() => removeOption(idx)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">×</button>
              </div>
            </div>
          ))}

          <div>
            <button onClick={addOption} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-sm">+ Add Option</button>
          </div>
        </div>
      </div>
    </div>
  );
});

OptionsEditor.displayName = 'OptionsEditor';

export default OptionsEditor;
