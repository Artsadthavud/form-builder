
import React, { useState, useEffect, useRef } from 'react';
import { FormElement, Condition, FormMetadata, Language } from '../types';
import { getText } from '../utils/i18n';
import { buildCustomStyles, buildCustomClasses } from '../utils/styles';
import { resolveTemplateWithSources } from '../utils/templateResolver';
import mockFetch from '../utils/mockApi';

interface PreviewProps {
  elements: FormElement[];
  meta: FormMetadata;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

// Sub-component for the interactive signature pad
const SignaturePad: React.FC<{ id: string; value: string; height?: number; onChange: (val: string) => void }> = ({ id, value, height = 150, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  
  // Keep track of the current value in a ref for access during resize events
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Helper: Get coordinates relative to the canvas (logical pixels)
  const getPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    // Capture pointer to ensure we track movement outside canvas bounds if user slips
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    isDrawing.current = true;
    const point = getPoint(e);
    lastPoint.current = point;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    // Draw a single dot in case it's just a tap
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing.current || !lastPoint.current) return;
    e.preventDefault(); // Prevent scrolling/touch actions

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentPoint = getPoint(e);
    const p1 = lastPoint.current;
    const p2 = currentPoint;

    // Calculate midpoint for quadratic curve
    // This creates smooth curves instead of jagged lines
    const midPoint = {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };

    ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midPoint.x, midPoint.y);

    lastPoint.current = currentPoint;
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    isDrawing.current = false;
    lastPoint.current = null;
    
    const canvas = canvasRef.current;
    if (canvas) {
       onChange(canvas.toDataURL());
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Reset path
        ctx.beginPath();
    }
    onChange('');
  };

  // Resize and Resolution Management
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const updateSize = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const width = wrapper.clientWidth;
        const currentHeight = height;

        // Calculate physical pixels
        const targetWidth = Math.floor(width * ratio);
        const targetHeight = Math.floor(currentHeight * ratio);

        // Avoid resetting canvas if dimensions haven't changed
        if (canvas.width === targetWidth && canvas.height === targetHeight) return;

        // Set internal resolution
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Set CSS display size
        canvas.style.width = `${width}px`;
        canvas.style.height = `${currentHeight}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Scale context to match logical pixels
            ctx.scale(ratio, ratio);
            
            // Set high-quality drawing styles
            ctx.strokeStyle = '#0f172a'; // slate-900
            ctx.lineWidth = 2.5; // Slightly thicker for better visibility
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Redraw existing signature if present
            if (valueRef.current) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, width, currentHeight);
                };
                img.src = valueRef.current;
            }
        }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(wrapper);

    return () => resizeObserver.disconnect();
  }, [height]);

  // Handle external value changes
  useEffect(() => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;

      if (isDrawing.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = wrapper.clientWidth;
      const currentHeight = height;

      ctx.clearRect(0, 0, width, currentHeight);
      // Re-apply styles just in case
      ctx.beginPath();

      if (value) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, width, currentHeight);
          img.src = value;
      }
  }, [value, height]);

  return (
    <div ref={wrapperRef} className="border border-slate-300 rounded-md bg-slate-50 overflow-hidden relative group select-none">
      <canvas
        ref={canvasRef}
        className="block bg-white cursor-crosshair touch-none" 
        style={{ width: '100%', height: `${height}px`, touchAction: 'none' }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 text-xs bg-white/90 border border-slate-200 px-2 py-1 rounded text-red-500 hover:bg-red-50 shadow-sm z-10 transition-colors"
        >
          Clear
        </button>
      )}
      {!value && (
        <div className="absolute bottom-2 left-4 text-[10px] text-slate-300 pointer-events-none select-none">
          Sign above
        </div>
      )}
    </div>
  );
};


const Preview: React.FC<PreviewProps> = ({ elements, meta, currentLanguage, onLanguageChange }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const seededDefaults = useRef(false);

  // seed defaults once from element.defaultValue
  useEffect(() => {
    if (seededDefaults.current) return;
    const initial: Record<string, any> = {};
    elements.forEach(el => {
      if (el.defaultValue !== undefined) initial[el.id] = el.defaultValue;
    });
    if (Object.keys(initial).length > 0) setFormData(prev => ({ ...initial, ...prev }));
    seededDefaults.current = true;
  }, [elements]);

  // resolve templates for elements that declare tokenSources
  useEffect(() => {
    let mounted = true;
    const fetcher = async (url: string) => {
      try {
        if (!url) return {};
        if (url.startsWith('mock://')) return await mockFetch(url);
        const res = await fetch(url);
        if (!res.ok) return {};
        return await res.json();
      } catch (e) {
        return {};
      }
    };

    const run = async () => {
      const out: Record<string, string> = {};
      for (const el of elements) {
        const sources = (el as any).tokenSources;
        if (!sources || sources.length === 0) continue;
        if (typeof el.label === 'string') out[`${el.id}:label`] = await resolveTemplateWithSources(el.label, sources, fetcher);
        if (typeof el.placeholder === 'string') out[`${el.id}:placeholder`] = await resolveTemplateWithSources(el.placeholder, sources, fetcher);
        if (el.type === 'paragraph' && typeof el.content === 'string') out[`${el.id}:content`] = await resolveTemplateWithSources(el.content, sources, fetcher);
        if (el.options && el.options.length) {
          for (const opt of el.options) {
            if (typeof opt.label === 'string') out[`${el.id}:opt:${opt.id}`] = await resolveTemplateWithSources(opt.label as string, sources, fetcher);
          }
        }
      }
      if (mounted) setResolved(prev => ({ ...prev, ...out }));
    };

    run();
    return () => { mounted = false; };
  }, [elements, currentLanguage]);

  useEffect(() => {
    const newVisible = new Set<string>();
    let changed = true;
    let iterations = 0;
    
    const checkCondition = (cond: Condition): boolean => {
      const targetValue = formData[cond.targetId];
      const condVal = cond.value;
      
      if (targetValue === undefined || targetValue === null) {
        if (cond.operator === 'not_equals' && condVal !== '') return true;
        if (cond.operator === 'not_contains') return true;
        return false;
      }

      if (Array.isArray(targetValue)) {
        const stringArray = targetValue.map(String);
        switch (cond.operator) {
          case 'contains': return stringArray.includes(condVal);
          case 'not_contains': return !stringArray.includes(condVal);
          case 'equals': return stringArray.sort().join(',') === condVal;
          case 'not_equals': return stringArray.sort().join(',') !== condVal;
          default: return false;
        }
      }

      const valStr = String(targetValue);
      switch (cond.operator) {
        case 'equals': return valStr === condVal;
        case 'not_equals': return valStr !== condVal;
        case 'contains': return valStr.includes(condVal);
        case 'not_contains': return !valStr.includes(condVal);
        default: return false;
      }
    };

    const isVisible = (el: FormElement, currentVisible: Set<string>): boolean => {
      if (el.parentId && !currentVisible.has(el.parentId)) return false;
      if (!el.logic || el.logic.conditions.length === 0) return true;
      const results = el.logic.conditions.map(checkCondition);
      return el.logic.combinator === 'AND' ? results.every(r => r) : results.some(r => r);
    };

    while (changed && iterations < 5) {
      changed = false;
      elements.forEach(el => {
        const shouldBeVisible = isVisible(el, newVisible);
        const currentlyVisible = newVisible.has(el.id);
        if (shouldBeVisible && !currentlyVisible) {
          newVisible.add(el.id);
          changed = true;
        } else if (!shouldBeVisible && currentlyVisible) {
          newVisible.delete(el.id);
          changed = true;
        }
      });
      iterations++;
    }
    setVisibleIds(newVisible);
  }, [formData, elements]);

  // Validation Logic
  const validateField = (id: string, value: any, el?: FormElement): string | null => {
    if (!el) el = elements.find(e => e.id === id);
    if (!el) return null;

    // Check Required
    if (el.required) {
      if (value === undefined || value === null || value === '') return el.customErrorMsg || 'This field is required.';
      if (Array.isArray(value) && value.length === 0) return el.customErrorMsg || 'This field is required.';
    }

    // Skip other validations if empty (unless required, which is caught above)
    if (value === undefined || value === null || value === '') return null;

    // Text Validation
    if (typeof value === 'string') {
      if (el.validationType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return el.customErrorMsg || 'Please enter a valid email address.';
      }

      if (el.minLength !== undefined && value.length < el.minLength) {
        return el.customErrorMsg || `Minimum ${el.minLength} characters required.`;
      }

      if (el.maxLength !== undefined && value.length > el.maxLength) {
        return el.customErrorMsg || `Maximum ${el.maxLength} characters allowed.`;
      }

      if (el.pattern) {
        try {
          const regex = new RegExp(el.pattern);
          if (!regex.test(value)) return el.customErrorMsg || 'Input format is invalid.';
        } catch (e) {
          console.error('Invalid regex pattern:', el.pattern);
        }
      }
    }

    // Number Validation
    if (el.type === 'number') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (el.min !== undefined && num < el.min) return el.customErrorMsg || `Minimum value is ${el.min}.`;
        if (el.max !== undefined && num > el.max) return el.customErrorMsg || `Maximum value is ${el.max}.`;
      }
    }

    return null;
  };

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Real-time validation
    const error = validateField(id, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[id] = error;
      else delete newErrors[id];
      return newErrors;
    });
  };

  const handleCheckboxChange = (id: string, val: string, checked: boolean) => {
    let newValue: string[] = [];
    
    setFormData(prev => {
      const current = prev[id] || [];
      if (checked) {
        newValue = current.includes(val) ? current : [...current, val];
      } else {
        newValue = current.filter((v: string) => v !== val);
      }
      return { ...prev, [id]: newValue };
    });

    // Validate checkbox group
    const error = validateField(id, newValue);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[id] = error;
      else delete newErrors[id];
      return newErrors;
    });
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // For preview, just store the name
    handleChange(id, file ? file.name : '');
  };

  const visibleRequiredElements = elements.filter(el => 
    visibleIds.has(el.id) && el.required && 
    ['text', 'number', 'textarea', 'select', 'radio', 'checkbox', 'signature', 'date', 'time', 'file', 'rating'].includes(el.type)
  );
  
  const totalRequired = visibleRequiredElements.length;
  
  const validRequired = visibleRequiredElements.filter(el => {
    const val = formData[el.id];
    // Must be filled AND have no errors
    const isFilled = val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0);
    const hasError = !!errors[el.id] || !!validateField(el.id, val, el);
    return isFilled && !hasError;
  }).length;

  const progressPercentage = totalRequired === 0 ? 100 : Math.round((validRequired / totalRequired) * 100);

  const renderField = (el: FormElement) => {
    const fieldValue = formData[el.id] || '';
    const error = errors[el.id];

    if (el.type === 'paragraph') {
      return (
        <div className="text-slate-700 whitespace-pre-wrap text-sm">
          {resolved[`${el.id}:content`] ?? getText(el.content, currentLanguage)}
        </div>
      );
    }

    return (
      <div 
        className={`space-y-1.5 ${buildCustomClasses(el)}`}
        style={buildCustomStyles(el)}
      >
        <label className="block text-sm font-medium text-slate-700">
          {resolved[`${el.id}:label`] ?? getText(el.label, currentLanguage)} {el.required && <span className="text-red-500">*</span>}
        </label>
        
        {el.type === 'text' && (
          <input 
            type="text"
            placeholder={resolved[`${el.id}:placeholder`] ?? getText(el.placeholder, currentLanguage)}
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
            maxLength={el.maxLength}
          />
        )}

        {el.type === 'email' && (
          <input 
            type="email"
            placeholder={getText(el.placeholder, currentLanguage)}
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
            maxLength={el.maxLength}
          />
        )}

        {el.type === 'phone' && (
          <div className="flex gap-2">
            {el.countryCode && (
              <input 
                type="text"
                value={el.countryCode}
                disabled
                className="w-16 bg-slate-100 rounded-md shadow-sm text-sm border border-slate-300 p-2 text-center"
              />
            )}
            <input 
              type="tel"
              placeholder={resolved[`${el.id}:placeholder`] ?? getText(el.placeholder, currentLanguage)}
              className={`block flex-1 bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
              value={fieldValue}
              onChange={(e) => handleChange(el.id, e.target.value)}
              maxLength={el.maxLength}
            />
          </div>
        )}

        {el.type === 'number' && (
          <input 
            type="number"
            placeholder={resolved[`${el.id}:placeholder`] ?? getText(el.placeholder, currentLanguage)}
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
            min={el.min}
            max={el.max}
          />
        )}

        {el.type === 'textarea' && (
           <textarea 
             placeholder={resolved[`${el.id}:placeholder`] ?? getText(el.placeholder, currentLanguage)}
             rows={3}
             className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
             value={fieldValue}
             onChange={(e) => handleChange(el.id, e.target.value)}
             maxLength={el.maxLength}
           />
        )}

        {el.type === 'date' && (
          <input 
            type="date"
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
          />
        )}

        {el.type === 'time' && (
          <input 
            type="time"
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
          />
        )}

        {el.type === 'file' && (
          <input 
            type="file"
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${error ? 'border-red-300' : 'border-slate-300'}`}
            onChange={(e) => handleFileChange(el.id, e)}
          />
        )}

        {el.type === 'rating' && (
          <div className="flex gap-1">
            {[...Array(el.ratingMax || 5)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleChange(el.id, i + 1)}
                className={`text-2xl focus:outline-none transition-colors ${i < (fieldValue || 0) ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {el.type === 'select' && (
          <select
            className={`block w-full bg-white rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm border p-2 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            value={fieldValue}
            onChange={(e) => handleChange(el.id, e.target.value)}
          >
            <option value="">{currentLanguage === 'th' ? 'เลือก...' : 'Select...'}</option>
            {el.options?.map(opt => (
              <option key={opt.id} value={opt.value}>{resolved[`${el.id}:opt:${opt.id}`] ?? getText(opt.label, currentLanguage)}</option>
            ))}
          </select>
        )}

        {el.type === 'radio' && (
          <div className={`flex ${el.orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`}>
            {el.options?.map(opt => (
              <div key={opt.id} className="flex items-center">
                <input
                  type="radio"
                  id={`${el.id}_${opt.id}`}
                  name={el.id}
                  value={opt.value}
                  checked={fieldValue === opt.value}
                  onChange={(e) => handleChange(el.id, e.target.value)}
                  className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                />
                <label htmlFor={`${el.id}_${opt.id}`} className="ml-2 block text-sm text-slate-700">
                  {resolved[`${el.id}:opt:${opt.id}`] ?? getText(opt.label, currentLanguage)}
                </label>
              </div>
            ))}
          </div>
        )}

        {el.type === 'checkbox' && (
          <div className={`flex ${el.orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`}>
            {el.options?.map(opt => (
              <div key={opt.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${el.id}_${opt.id}`}
                  value={opt.value}
                  checked={(formData[el.id] || []).includes(opt.value)}
                  onChange={(e) => handleCheckboxChange(el.id, opt.value, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                />
                <label htmlFor={`${el.id}_${opt.id}`} className="ml-2 block text-sm text-slate-700">
                  {resolved[`${el.id}:opt:${opt.id}`] ?? getText(opt.label, currentLanguage)}
                </label>
              </div>
            ))}
          </div>
        )}

        {el.type === 'signature' && (
           <SignaturePad 
             id={el.id} 
             value={fieldValue} 
             height={el.signatureHeight}
             onChange={(val) => handleChange(el.id, val)} 
           />
        )}

        {el.type === 'image' && (
          <div className={`w-full flex ${el.imageAlign === 'center' ? 'justify-center' : el.imageAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
             {el.imageUrl && (
                <img 
                  src={el.imageUrl} 
                  alt={el.imageAlt} 
                  style={{ width: `${el.imageWidth || 100}%`, maxWidth: '100%' }}
                  className="rounded" 
                />
             )}
          </div>
        )}

        {/* Error Message Display */}
        {error && (
          <p className="text-xs text-red-500 mt-1 animate-pulse">{error}</p>
        )}
      </div>
    );
  };

  const renderRecursive = (parentId?: string) => {
    const children = elements.filter(el => el.parentId === parentId);
    if (children.length === 0) return null;
    return (
      <div className="flex flex-wrap -mx-2">
        {children.map(el => {
           if (!visibleIds.has(el.id)) return null;
           return (
             <div key={el.id} className="px-2 mb-4 transition-all duration-300 ease-in-out" style={{ width: el.type === 'section' ? '100%' : `${el.width || 100}%` }}>
               {el.type === 'section' ? (
                 <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm mb-2">
                   <h3 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-100 pb-2">{getText(el.label, currentLanguage)}</h3>
                   {renderRecursive(el.id)}
                 </div>
               ) : (
                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-full">{renderField(el)}</div>
               )}
             </div>
           );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Language Selector */}
      {meta.availableLanguages && meta.availableLanguages.length > 1 && (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex rounded-md shadow-sm bg-white border border-slate-200">
            {meta.availableLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentLanguage === lang 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                } ${lang === meta.availableLanguages[0] ? 'rounded-l-md' : ''} ${lang === meta.availableLanguages[meta.availableLanguages.length - 1] ? 'rounded-r-md' : ''}`}
              >
                {lang === 'th' ? 'ไทย' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Header Block */}
      <div 
        className={`flex gap-6 p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm mb-6 transition-all relative ${meta.logoPlacement === 'top' ? 'flex-col' : meta.logoPlacement === 'bottom' ? 'flex-col-reverse' : meta.logoPlacement === 'left' ? 'flex-row items-center' : 'flex-row-reverse items-center'}`}
        style={{ 
          backgroundColor: meta.headerBackgroundColor || '#ffffff',
          color: meta.headerTitleColor || '#1e293b'
        }}
      >
         {meta.logoUrl && (
            <div className={`flex flex-shrink-0 ${
               (meta.logoPlacement === 'top' || meta.logoPlacement === 'bottom') 
               ? (meta.logoAlignment === 'left' ? 'justify-start' : meta.logoAlignment === 'right' ? 'justify-end' : 'justify-center') 
               : (meta.logoAlignment === 'left' ? 'self-start' : meta.logoAlignment === 'right' ? 'self-end' : 'self-center') 
            }`}
            style={ meta.logoPlacement === 'left' || meta.logoPlacement === 'right' ? { width: `${meta.logoWidth || 25}%` } : {} }
            >
               <img 
                 src={meta.logoUrl} 
                 alt="Logo" 
                 className="object-contain" 
                 style={ meta.logoPlacement === 'top' || meta.logoPlacement === 'bottom' ? { width: `${meta.logoWidth || 25}%`, maxWidth: '100%' } : { width: '100%' } } 
               />
            </div>
         )}
         
         <div className={`flex-1 ${meta.headerTextAlignment === 'left' ? 'text-left' : meta.headerTextAlignment === 'right' ? 'text-right' : 'text-center'}`}>
            <h1 className="text-2xl md:text-3xl font-bold">{getText(meta.title, currentLanguage)}</h1>
            {meta.description && <p className="mt-2 opacity-90">{getText(meta.description, currentLanguage)}</p>}
         </div>
      </div>

      {elements.some(el => el.required) && (
        <div className="mb-8 bg-white p-4 rounded-lg border border-slate-200 shadow-sm sticky top-0 z-20">
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
            <span>{currentLanguage === 'th' ? 'ความสมบูรณ์ของฟอร์ม' : 'Form Completion'}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => {
        e.preventDefault();
        alert(currentLanguage === 'th' ? 'ส่งฟอร์มแล้ว! (ตรวจสอบ console สำหรับข้อมูล)' : 'Form Submitted! (Check console for data)');
        console.log(formData);
      }}>
         {renderRecursive(undefined)}
         
         {/* Submit Button */}
         <div className="mt-8 flex justify-end px-2">
           <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-md shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={progressPercentage < 100}>
             {currentLanguage === 'th' ? 'ส่งฟอร์ม' : 'Submit Form'}
           </button>
         </div>
      </form>

      {/* Footer Block */}
      <div 
        className="mt-12 pt-6 border-t border-slate-200 text-center text-sm pb-8 rounded-b-lg"
        style={{ 
          backgroundColor: meta.footerBackgroundColor,
          color: meta.footerTextColor || '#64748b'
        }}
      >
          {getText(meta.footerText, currentLanguage)}
      </div>
    </div>
  );
};

export default Preview;
