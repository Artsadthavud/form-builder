
import React, { useState } from 'react';
import { FormElement, Option, Condition, Logic, FormMetadata, Language, TranslatableText } from '../types';
import { getText, isTranslatable, makeTranslatable } from '../utils/i18n';

interface PropertiesPanelProps {
  element?: FormElement;
  allElements: FormElement[];
  formMetadata: FormMetadata;
  onUpdate: (element: FormElement) => void;
  onDelete: (id: string) => void;
  onUpdateMetadata: (meta: FormMetadata) => void;
  onRequestLabelChange: (id: string, newLabel: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  element, 
  allElements, 
  formMetadata,
  onUpdate, 
  onDelete, 
  onUpdateMetadata,
  onRequestLabelChange
}) => {
  const [draggedOptionIdx, setDraggedOptionIdx] = useState<number | null>(null);
  const [editLanguage, setEditLanguage] = useState<Language>(formMetadata.defaultLanguage || 'th');

  const handleMetaChange = (field: keyof FormMetadata, value: any) => {
    onUpdateMetadata({ ...formMetadata, [field]: value });
  };

  // Helper to update translatable fields
  const updateTranslatableMetaField = (field: keyof FormMetadata, lang: Language, value: string) => {
    const current = formMetadata[field];
    if (isTranslatable(current)) {
      handleMetaChange(field, { ...current, [lang]: value });
    } else {
      // Convert to translatable
      const translatable: TranslatableText = { th: '', en: '' };
      translatable[lang] = value;
      handleMetaChange(field, translatable);
    }
  };

  const updateTranslatableElementField = (field: 'label' | 'placeholder' | 'content', lang: Language, value: string) => {
    if (!element) return;
    const current = element[field];
    if (isTranslatable(current)) {
      onUpdate({ ...element, [field]: { ...current, [lang]: value } });
    } else {
      const translatable: TranslatableText = { th: '', en: '' };
      translatable[lang] = value;
      onUpdate({ ...element, [field]: translatable });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleMetaChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // If no element is selected, show Form Settings (Header/Footer configuration)
  if (!element) {
    const isHorizontalLayout = formMetadata.logoPlacement === 'left' || formMetadata.logoPlacement === 'right';
    
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Form Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Header & Footer Configuration</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Language Selector */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
            <label className="block text-xs font-semibold text-indigo-700 uppercase tracking-wider">Editing Language</label>
            <div className="flex gap-2">
              {(formMetadata.availableLanguages || ['th', 'en']).map(lang => (
                <button
                  key={lang}
                  onClick={() => setEditLanguage(lang)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                    editLanguage === lang 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'bg-white text-slate-700 hover:bg-indigo-100'
                  }`}
                >
                  {lang === 'th' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
                </button>
              ))}
            </div>
          </div>

          {/* General Header Settings */}
          <div className="space-y-3">
             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Header Content</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Form Title ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={getText(formMetadata.title, editLanguage)}
                onChange={(e) => updateTranslatableMetaField('title', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <textarea
                rows={3}
                value={getText(formMetadata.description, editLanguage)}
                onChange={(e) => updateTranslatableMetaField('description', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo URL</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formMetadata.logoUrl || ''}
                  onChange={(e) => handleMetaChange('logoUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full py-1.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-200">
                    Upload Logo File
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Header Styling */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Header Styling</h3>
            
            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Background Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.headerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('headerBackgroundColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.headerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('headerBackgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Text Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.headerTitleColor || '#1e293b'}
                    onChange={(e) => handleMetaChange('headerTitleColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.headerTitleColor || '#1e293b'}
                    onChange={(e) => handleMetaChange('headerTitleColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo Placement</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                 {(['top', 'bottom', 'left', 'right'] as const).map((place) => (
                    <button
                      key={place}
                      className={`py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.logoPlacement === place || (!formMetadata.logoPlacement && place === 'top') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      onClick={() => handleMetaChange('logoPlacement', place)}
                    >
                      {place}
                    </button>
                 ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo Size / Width (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={formMetadata.logoWidth || 25}
                  onChange={(e) => handleMetaChange('logoWidth', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formMetadata.logoWidth || 25}
                  onChange={(e) => handleMetaChange('logoWidth', parseInt(e.target.value))}
                  className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                 {isHorizontalLayout ? 'Logo Vertical Align' : 'Logo Horizontal Align'}
              </label>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                {(['left', 'center', 'right'] as const).map((align) => {
                    let label: string = align;
                    // Adapt label based on orientation
                    if (isHorizontalLayout) {
                       if (align === 'left') label = 'top';
                       if (align === 'center') label = 'middle';
                       if (align === 'right') label = 'bottom';
                    }
                    return (
                      <button
                        key={align}
                        className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.logoAlignment === align || (!formMetadata.logoAlignment && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => handleMetaChange('logoAlignment', align)}
                      >
                        {label}
                      </button>
                    );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Text Alignment</label>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${formMetadata.headerTextAlignment === align || (!formMetadata.headerTextAlignment && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                      onClick={() => handleMetaChange('headerTextAlignment', align)}
                    >
                      {align}
                    </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Settings */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Footer Content & Style</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Footer Text ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={getText(formMetadata.footerText, editLanguage)}
                onChange={(e) => updateTranslatableMetaField('footerText', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Background Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.footerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('footerBackgroundColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.footerBackgroundColor || '#ffffff'}
                    onChange={(e) => handleMetaChange('footerBackgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-700 mb-1">Text Color</label>
               <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={formMetadata.footerTextColor || '#64748b'}
                    onChange={(e) => handleMetaChange('footerTextColor', e.target.value)}
                    className="w-8 h-8 p-0 border border-slate-300 rounded cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={formMetadata.footerTextColor || '#64748b'}
                    onChange={(e) => handleMetaChange('footerTextColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm uppercase"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Element Properties Logic
  const handleChange = (field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  };

  const handleOptionChange = (idx: number, field: keyof Option, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    handleChange('options', newOptions);
  };

  const addOption = () => {
    const newOptId = `opt_${Date.now()}`;
    const newOptions = [...(element.options || []), { 
      id: newOptId, 
      label: { th: 'ตัวเลือกใหม่', en: 'New Option' }, 
      value: 'new_value' 
    }];
    handleChange('options', newOptions);
  };

  const removeOption = (idx: number) => {
    if (!element.options) return;
    const newOptions = element.options.filter((_, i) => i !== idx);
    handleChange('options', newOptions);
  };

  // ... Drag and Drop options handlers from previous logic ...
  const handleOptionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedOptionIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleOptionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedOptionIdx === null || draggedOptionIdx === index) return;
    if (element.options) {
      const newOptions = [...element.options];
      const [draggedItem] = newOptions.splice(draggedOptionIdx, 1);
      newOptions.splice(index, 0, draggedItem);
      handleChange('options', newOptions);
      setDraggedOptionIdx(index);
    }
  };

  const handleOptionDragEnd = () => {
    setDraggedOptionIdx(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ... Logic Handlers (initLogic, addCondition, etc.) same as before ...
  const initLogic = () => {
    if (!element.logic) handleChange('logic', { combinator: 'AND', conditions: [] });
  };
  const addCondition = () => {
    const currentLogic = element.logic || { combinator: 'AND', conditions: [] };
    const newCondition: Condition = { id: `cond_${Date.now()}`, targetId: '', operator: 'equals', value: '' };
    handleChange('logic', { ...currentLogic, conditions: [...currentLogic.conditions, newCondition] });
  };
  const updateCondition = (idx: number, field: keyof Condition, value: any) => {
    if (!element.logic) return;
    const newConditions = [...element.logic.conditions];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    handleChange('logic', { ...element.logic, conditions: newConditions });
  };
  const removeCondition = (idx: number) => {
    if (!element.logic) return;
    const newConditions = element.logic.conditions.filter((_, i) => i !== idx);
    handleChange('logic', { ...element.logic, conditions: newConditions });
  };

  const potentialLogicTargets = allElements.filter(e => e.id !== element.id && e.type !== 'section' && e.type !== 'image' && e.type !== 'paragraph');

  // Helper to render width buttons
  const WidthButton = ({ w, label }: { w: string, label: string }) => {
    const isActive = (element.width || '100') === w;
    return (
      <button
        onClick={() => handleChange('width', w)}
        className={`flex-1 py-1.5 text-[10px] font-medium border rounded transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'}`}
        title={`Set width to ${w === '100' ? '100%' : w + '%'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="font-semibold text-slate-800">Properties</h2>
        <div className="text-xs text-slate-500 mt-1 font-mono">{element.id}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Language Selector */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
          <label className="block text-xs font-semibold text-indigo-700 uppercase tracking-wider">Editing Language</label>
          <div className="flex gap-2">
            {(formMetadata.availableLanguages || ['th', 'en']).map(lang => (
              <button
                key={lang}
                onClick={() => setEditLanguage(lang)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  editLanguage === lang 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'bg-white text-slate-700 hover:bg-indigo-100'
                }`}
              >
                {lang === 'th' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>

        {/* General Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">General</h3>
          
          {element.type !== 'paragraph' && element.type !== 'image' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Label ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={getText(element.label, editLanguage)}
                onChange={(e) => updateTranslatableElementField('label', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          )}

          {element.type !== 'section' && element.type !== 'image' && element.type !== 'paragraph' && (
             <div className="flex items-center gap-2">
                <input
                  id="required"
                  type="checkbox"
                  checked={element.required || false}
                  onChange={(e) => handleChange('required', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                />
                <label htmlFor="required" className="text-sm text-slate-700">Required Field</label>
             </div>
          )}

          {/* Parent Group Selection */}
          {element.type !== 'section' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Parent Group</label>
              <select
                value={element.parentId || ''}
                onChange={(e) => onUpdate({ ...element, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">(Root)</option>
                {allElements.filter(e => e.type === 'section' && e.id !== element.id).map(sec => (
                    <option key={sec.id} value={sec.id}>{getText(sec.label, editLanguage)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Layout / Grid System */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Layout & Grid</h3>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Width (Column Span)</label>
            <div className="space-y-1">
               <div className="flex gap-1"><WidthButton w="100" label="100%" /></div>
               <div className="flex gap-1"><WidthButton w="50" label="50%" /><WidthButton w="50" label="50%" /></div>
               <div className="flex gap-1"><WidthButton w="33" label="33%" /><WidthButton w="33" label="33%" /><WidthButton w="33" label="33%" /></div>
               <div className="flex gap-1"><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /><WidthButton w="25" label="25%" /></div>
            </div>
          </div>
        </div>

        {/* Validation Rules */}
        {(element.type === 'text' || element.type === 'textarea' || element.type === 'number' || element.type === 'date' || element.type === 'email' || element.type === 'file') && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Validation Rules</h3>
             
             {element.type === 'text' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Input Format</label>
                  <select
                    value={element.validationType || 'text'}
                    onChange={(e) => handleChange('validationType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  >
                    <option value="text">Free Text</option>
                    <option value="email">Email Address</option>
                  </select>
                </div>
             )}

             {(element.type === 'text' || element.type === 'textarea') && (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Min Length</label>
                      <input type="number" value={element.minLength || ''} onChange={(e) => handleChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Max Length</label>
                      <input type="number" value={element.maxLength || ''} onChange={(e) => handleChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Regex Pattern</label>
                    <input type="text" value={element.pattern || ''} onChange={(e) => handleChange('pattern', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" placeholder="e.g. ^[A-Za-z]+$" />
                    <p className="text-[10px] text-slate-400 mt-1">Regular expression for advanced validation.</p>
                  </div>
                </>
             )}

             {element.type === 'number' && (
               <div className="flex gap-2">
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-slate-700 mb-1">Min Value</label>
                   <input type="number" value={element.min !== undefined ? element.min : ''} onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-slate-700 mb-1">Max Value</label>
                   <input type="number" value={element.max !== undefined ? element.max : ''} onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                 </div>
               </div>
             )}

             {/* Custom Validation Message */}
             <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Custom Error Message</label>
                <input
                  type="text"
                  value={element.customErrorMsg || ''}
                  onChange={(e) => handleChange('customErrorMsg', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  placeholder="e.g. Please enter a valid value"
                />
             </div>
          </div>
        )}

        {/* Field-Specific Settings */}
        {element.placeholder !== undefined && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placeholder</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Placeholder ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <input
                type="text"
                value={getText(element.placeholder, editLanguage)}
                onChange={(e) => updateTranslatableElementField('placeholder', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
        )}

        {element.type === 'paragraph' && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Content ({editLanguage === 'th' ? 'ไทย' : 'English'})
              </label>
              <textarea
                rows={5}
                value={getText(element.content, editLanguage)}
                onChange={(e) => updateTranslatableElementField('content', editLanguage, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono"
              />
            </div>
          </div>
        )}

        {/* Specifics */}
        {(element.type === 'radio' || element.type === 'checkbox' || element.type === 'select' || element.type === 'image' || element.type === 'signature' || element.type === 'rating') && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Specifics</h3>
             
             {element.type === 'rating' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Stars</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={element.ratingMax || 5}
                    onChange={(e) => handleChange('ratingMax', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                  />
                </div>
             )}

             {(element.type === 'radio' || element.type === 'checkbox' || element.type === 'select') && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Alignment</label>
                  <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                    <button className={`flex-1 py-1 text-xs rounded font-medium transition-all ${(!element.orientation || element.orientation === 'vertical') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('orientation', 'vertical')}>Vertical</button>
                    <button className={`flex-1 py-1 text-xs rounded font-medium transition-all ${element.orientation === 'horizontal' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('orientation', 'horizontal')}>Horizontal</button>
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
                            <div className="w-6 text-slate-400 text-center text-xs">≡</div>
                            <input
                              type="text"
                              placeholder={`Label (${editLanguage === 'th' ? 'ไทย' : 'EN'})`}
                              value={getText(opt.label, editLanguage)}
                              onChange={(e) => {
                                if (!element.options) return;
                                const newOptions = [...element.options];
                                const current = newOptions[idx].label;
                                if (isTranslatable(current)) {
                                  newOptions[idx] = { ...newOptions[idx], label: { ...current, [editLanguage]: e.target.value } };
                                } else {
                                  const trans: TranslatableText = { th: '', en: '' };
                                  trans[editLanguage] = e.target.value;
                                  newOptions[idx] = { ...newOptions[idx], label: trans };
                                }
                                handleChange('options', newOptions);
                              }}
                              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                            />
                            <input
                              type="text"
                              placeholder="value"
                              value={opt.value}
                              onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                              className="w-24 px-2 py-1 border border-slate-300 rounded text-sm bg-white font-mono text-xs"
                            />
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
             )}

             {element.type === 'signature' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Height (px)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="100" max="600" step="10" value={element.signatureHeight || 150} onChange={(e) => handleChange('signatureHeight', parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <input type="number" min="100" max="600" step="10" value={element.signatureHeight || 150} onChange={(e) => handleChange('signatureHeight', parseInt(e.target.value))} className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white" />
                  </div>
                </div>
             )}

             {element.type === 'image' && (
                <div className="space-y-3">
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Image Source</label>
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="https://example.com/image.png" value={element.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <button className="w-full py-1.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-200">Upload File</button>
                        </div>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Width (%)</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="10" max="100" value={element.imageWidth || 100} onChange={(e) => handleChange('imageWidth', parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <input type="number" min="10" max="100" value={element.imageWidth || 100} onChange={(e) => handleChange('imageWidth', parseInt(e.target.value))} className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-sm bg-white" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alignment</label>
                      <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                        {(['left', 'center', 'right'] as const).map((align) => (
                           <button key={align} className={`flex-1 py-1 text-xs rounded font-medium capitalize transition-all ${element.imageAlign === align || (!element.imageAlign && align === 'center') ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('imageAlign', align)}>{align}</button>
                        ))}
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Alt Text</label>
                      <input type="text" value={element.imageAlt || ''} onChange={(e) => handleChange('imageAlt', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" />
                   </div>
                </div>
             )}

          {/* Conditional Logic Section */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conditional Logic</h3>
            {!element.logic && (
              <div>
                <p className="text-sm text-slate-600 mb-2">No logic rules. Use logic to show/hide this field based on other fields.</p>
                <button onClick={initLogic} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-sm">Enable Logic</button>
              </div>
            )}

            {element.logic && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500">Combinator</div>
                  <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                    <button className={`px-2 text-xs rounded ${element.logic.combinator === 'AND' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('logic', { ...element.logic!, combinator: 'AND' })}>AND</button>
                    <button className={`px-2 text-xs rounded ${element.logic.combinator === 'OR' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`} onClick={() => handleChange('logic', { ...element.logic!, combinator: 'OR' })}>OR</button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(element.logic.conditions || []).map((cond, idx) => (
                    <div key={cond.id} className="flex items-center gap-2">
                      <select value={cond.targetId} onChange={(e) => updateCondition(idx, 'targetId', e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-sm bg-white">
                        <option value="">-- Select Field --</option>
                        {potentialLogicTargets.map(t => (
                          <option key={t.id} value={t.id}>{getText(t.label, editLanguage)}</option>
                        ))}
                      </select>

                      <select value={cond.operator} onChange={(e) => updateCondition(idx, 'operator', e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-sm bg-white">
                        <option value="equals">equals</option>
                        <option value="not_equals">not equals</option>
                        <option value="contains">contains</option>
                        <option value="not_contains">not contains</option>
                      </select>

                      <input type="text" value={cond.value} onChange={(e) => updateCondition(idx, 'value', e.target.value)} placeholder="Value" className="px-2 py-1 border border-slate-300 rounded text-sm bg-white" />

                      <button onClick={() => removeCondition(idx)} className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50">Remove</button>
                    </div>
                  ))}
                </div>

                <div>
                  <button onClick={addCondition} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-sm">+ Add Condition</button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
