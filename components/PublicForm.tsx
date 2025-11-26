import React, { useState, useEffect, useRef } from 'react';
import { FormElement, FormMetadata, Language, FormResponse } from '../types';
import { getText, isTranslatable } from '../utils/i18n';

interface PublicFormProps {
  formId: string;
  onSubmit: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => void;
  onBack?: () => void;
}

interface ValidationError {
  elementId: string;
  message: string;
}

// Sub-component for the interactive signature pad
const SignaturePad: React.FC<{ id: string; value: string; height?: number; onChange: (val: string) => void }> = ({ id, value, height = 150, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const point = getPoint(e);
    lastPoint.current = point;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing.current || !lastPoint.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const currentPoint = getPoint(e);
    const p1 = lastPoint.current;
    const p2 = currentPoint;
    const midPoint = { x: p1.x + (p2.x - p1.x) / 2, y: p1.y + (p2.y - p1.y) / 2 };
    ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midPoint.x, midPoint.y);
    lastPoint.current = currentPoint;
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (valueRef.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = valueRef.current;
    }
  }, []);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        className="border-2 border-slate-300 rounded-md cursor-crosshair touch-none bg-white w-full"
        style={{ maxWidth: '400px' }}
      />
      <button type="button" onClick={clearSignature} className="text-sm text-slate-600 hover:text-slate-900">
        🗑️ Clear
      </button>
    </div>
  );
};

const PublicForm: React.FC<PublicFormProps> = ({ formId, onSubmit, onBack }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('th');
  const [startTime] = useState(new Date());

  // Load form from localStorage
  const [elements, setElements] = useState<FormElement[]>([]);
  const [meta, setMeta] = useState<FormMetadata>({
    title: 'Form',
    description: '',
    defaultLanguage: 'th',
    availableLanguages: ['th', 'en']
  });

  useEffect(() => {
    const storedForms = localStorage.getItem('formflow_forms_v1');
    if (storedForms) {
      const forms = JSON.parse(storedForms);
      const form = forms.find((f: any) => f.id === formId);
      if (form) {
        setElements(form.elements || []);
        setMeta(form.metadata || meta);
        setCurrentLanguage(form.metadata?.defaultLanguage || 'th');
      }
    }
  }, [formId]);

  // Check if element should be visible based on conditional logic
  const isElementVisible = (element: FormElement): boolean => {
    if (!element.logic || element.logic.conditions.length === 0) return true;
    
    const { combinator, conditions } = element.logic;
    const results = conditions.map(condition => {
      const targetValue = formData[condition.targetId];
      const conditionValue = condition.value;
      
      switch (condition.operator) {
        case 'equals':
          return String(targetValue) === String(conditionValue);
        case 'not_equals':
          return String(targetValue) !== String(conditionValue);
        case 'contains':
          return String(targetValue || '').includes(String(conditionValue));
        case 'not_contains':
          return !String(targetValue || '').includes(String(conditionValue));
        default:
          return true;
      }
    });

    return combinator === 'AND' ? results.every(r => r) : results.some(r => r);
  };

  // Validate single field
  const validateField = (element: FormElement, value: any): string | null => {
    // Check if field is visible
    if (!isElementVisible(element)) return null;

    const label = getText(element.label, currentLanguage);

    // Required validation
    if (element.required) {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return currentLanguage === 'th' 
          ? `กรุณากรอก ${label}` 
          : `${label} is required`;
      }
    }

    // Type-specific validation
    if (value && element.type === 'text') {
      // Email validation
      if (element.placeholder && 
          (element.placeholder.toString().toLowerCase().includes('email') ||
           element.placeholder.toString().includes('อีเมล'))) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return currentLanguage === 'th' 
            ? 'รูปแบบอีเมลไม่ถูกต้อง' 
            : 'Invalid email format';
        }
      }
      
      // Min/Max length
      if (element.validation?.minLength && value.length < element.validation.minLength) {
        return currentLanguage === 'th'
          ? `ต้องมีอย่างน้อย ${element.validation.minLength} ตัวอักษร`
          : `Must be at least ${element.validation.minLength} characters`;
      }
      if (element.validation?.maxLength && value.length > element.validation.maxLength) {
        return currentLanguage === 'th'
          ? `ต้องไม่เกิน ${element.validation.maxLength} ตัวอักษร`
          : `Must not exceed ${element.validation.maxLength} characters`;
      }
    }

    if (value && element.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return currentLanguage === 'th' ? 'กรุณากรอกตัวเลข' : 'Please enter a valid number';
      }
      if (element.validation?.min !== undefined && numValue < element.validation.min) {
        return currentLanguage === 'th'
          ? `ต้องไม่น้อยกว่า ${element.validation.min}`
          : `Must be at least ${element.validation.min}`;
      }
      if (element.validation?.max !== undefined && numValue > element.validation.max) {
        return currentLanguage === 'th'
          ? `ต้องไม่เกิน ${element.validation.max}`
          : `Must not exceed ${element.validation.max}`;
      }
    }

    if (value && element.type === 'file') {
      // Validate file type and size if needed
      if (element.validation?.acceptedFileTypes && Array.isArray(value)) {
        const invalidFiles = value.filter((file: File) => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return !element.validation?.acceptedFileTypes?.includes(`.${ext}`);
        });
        if (invalidFiles.length > 0) {
          return currentLanguage === 'th'
            ? `ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ ${element.validation.acceptedFileTypes.join(', ')})`
            : `Invalid file type (accepted: ${element.validation.acceptedFileTypes.join(', ')})`;
        }
      }
    }

    return null;
  };

  // Validate entire form
  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];
    
    const validateRecursive = (els: FormElement[]) => {
      els.forEach(element => {
        if (element.type === 'section' && element.children) {
          validateRecursive(element.children);
        } else {
          const error = validateField(element, formData[element.id]);
          if (error) {
            newErrors.push({ elementId: element.id, message: error });
          }
        }
      });
    };

    validateRecursive(elements);
    return newErrors;
  };

  // Handle field change
  const handleChange = (elementId: string, value: any) => {
    setFormData(prev => ({ ...prev, [elementId]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.elementId !== elementId));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorElement = document.getElementById(`field-${validationErrors[0].elementId}`);
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const endTime = new Date();
      const completionTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const response: Omit<FormResponse, 'id' | 'submittedAt'> = {
        formId,
        data: formData,
        completionTime,
        metadata: {
          userAgent: navigator.userAgent,
          language: currentLanguage,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        }
      } as Omit<FormResponse, 'id' | 'submittedAt'>;

      await onSubmit(response);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert(currentLanguage === 'th' 
        ? 'เกิดข้อผิดพลาดในการส่งฟอร์ม กรุณาลองใหม่อีกครั้ง' 
        : 'An error occurred while submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get error message for a field
  const getFieldError = (elementId: string): string | undefined => {
    return errors.find(e => e.elementId === elementId)?.message;
  };

  // Calculate progress
  const requiredFields = elements.filter(el => el.required && el.type !== 'section' && isElementVisible(el));
  const filledRequired = requiredFields.filter(el => {
    const value = formData[el.id];
    return value !== undefined && value !== null && value !== '' && 
           (!Array.isArray(value) || value.length > 0);
  }).length;
  const progressPercentage = requiredFields.length > 0 
    ? Math.round((filledRequired / requiredFields.length) * 100) 
    : 100;

  // Render field based on type
  const renderField = (element: FormElement) => {
    if (!isElementVisible(element)) return null;

    const label = getText(element.label, currentLanguage);
    const placeholder = element.placeholder ? getText(element.placeholder, currentLanguage) : '';
    const value = formData[element.id];
    const error = getFieldError(element.id);
    const fieldId = `field-${element.id}`;

    const baseInputClass = `w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-slate-300'
    }`;

    switch (element.type) {
      case 'paragraph':
        return (
          <div className="prose max-w-none text-slate-700">
            <p className="whitespace-pre-wrap">{label}</p>
          </div>
        );

      case 'text':
      case 'number':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={element.type}
              value={value || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              placeholder={placeholder}
              className={baseInputClass}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              placeholder={placeholder}
              rows={4}
              className={baseInputClass}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              className={baseInputClass}
            >
              <option value="">
                {currentLanguage === 'th' ? '-- เลือก --' : '-- Select --'}
              </option>
              {element.options?.map(opt => (
                <option key={opt.id} value={opt.value}>
                  {getText(opt.label, currentLanguage)}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map(opt => (
                <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={element.id}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={(e) => handleChange(element.id, e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{getText(opt.label, currentLanguage)}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {element.options?.map(opt => (
                <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={Array.isArray(value) && value.includes(opt.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, opt.value]
                        : currentValues.filter(v => v !== opt.value);
                      handleChange(element.id, newValues);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{getText(opt.label, currentLanguage)}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              className={baseInputClass}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'time':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="time"
              value={value || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              className={baseInputClass}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'rating':
        const maxRating = element.maxRating || 5;
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex space-x-1">
              {Array.from({ length: maxRating }, (_, i) => i + 1).map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleChange(element.id, rating)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    value >= rating ? 'text-yellow-400' : 'text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'signature':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <SignaturePad
              id={element.id}
              value={value || ''}
              height={element.signatureHeight}
              onChange={(val) => handleChange(element.id, val)}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'image':
        return (
          <div className="flex justify-center">
            <img
              src={element.imageUrl}
              alt={label}
              className="max-w-full h-auto rounded-lg shadow-sm"
              style={{ maxHeight: '400px' }}
            />
          </div>
        );

      case 'file':
        return (
          <div id={fieldId}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {label} {element.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              multiple={element.allowMultiple}
              accept={element.validation?.acceptedFileTypes?.join(',')}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                handleChange(element.id, files);
              }}
              className={baseInputClass}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // Render elements recursively
  const renderRecursive = (parentId?: string): React.ReactElement[] => {
    const filtered = elements.filter(el => el.parentId === parentId);
    return filtered.map(element => {
      if (element.type === 'section') {
        return (
          <div
            key={element.id}
            className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 space-y-4"
          >
            <h3 className="font-semibold text-lg text-slate-800">
              {getText(element.label, currentLanguage)}
            </h3>
            {element.children && element.children.length > 0 && (
              <div className="space-y-4">
                {element.children.map(child => (
                  <div key={child.id}>{renderField(child)}</div>
                ))}
              </div>
            )}
          </div>
        );
      }
      return <div key={element.id}>{renderField(element)}</div>;
    });
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {currentLanguage === 'th' ? 'ส่งฟอร์มสำเร็จ!' : 'Form Submitted Successfully!'}
          </h2>
          <p className="text-slate-600 mb-6">
            {currentLanguage === 'th' 
              ? 'ขอบคุณสำหรับการตอบแบบฟอร์ม' 
              : 'Thank you for your response'}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
            >
              {currentLanguage === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div
          className="mb-8 p-6 rounded-t-lg shadow-sm"
          style={{
            backgroundColor: meta.headerBackgroundColor || '#6366f1',
            color: meta.headerTitleColor || '#ffffff'
          }}
        >
          {meta.logoUrl && meta.logoPlacement === 'top' && (
            <div className={`mb-4 flex ${meta.logoAlignment === 'left' ? 'justify-start' : meta.logoAlignment === 'right' ? 'justify-end' : 'justify-center'}`}>
              <img
                src={meta.logoUrl}
                alt="Logo"
                className="max-h-16 object-contain"
                style={{ width: `${meta.logoWidth || 20}%` }}
              />
            </div>
          )}
          
          <div className="flex items-start gap-4">
            {meta.logoUrl && meta.logoPlacement === 'left' && (
              <img
                src={meta.logoUrl}
                alt="Logo"
                className="max-h-16 object-contain flex-shrink-0"
                style={{ width: `${meta.logoWidth || 20}%` }}
              />
            )}
            
            <div className={`flex-1 ${meta.headerTextAlignment === 'left' ? 'text-left' : meta.headerTextAlignment === 'right' ? 'text-right' : 'text-center'}`}>
              <h1 className="text-2xl md:text-3xl font-bold">{getText(meta.title, currentLanguage)}</h1>
              {meta.description && <p className="mt-2 opacity-90">{getText(meta.description, currentLanguage)}</p>}
            </div>
            
            {meta.logoUrl && meta.logoPlacement === 'right' && (
              <img
                src={meta.logoUrl}
                alt="Logo"
                className="max-h-16 object-contain flex-shrink-0"
                style={{ width: `${meta.logoWidth || 20}%` }}
              />
            )}
          </div>

          {/* Language selector */}
          {meta.availableLanguages && meta.availableLanguages.length > 1 && (
            <div className="mt-4 flex justify-end gap-2">
              {meta.availableLanguages.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCurrentLanguage(lang)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    currentLanguage === lang
                      ? 'bg-white/20 font-semibold'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {lang === 'th' ? 'ไทย' : 'English'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {requiredFields.length > 0 && (
          <div className="mb-8 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
              <span>{currentLanguage === 'th' ? 'ความสมบูรณ์ของฟอร์ม' : 'Form Completion'}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {renderRecursive(undefined)}

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting 
                ? (currentLanguage === 'th' ? 'กำลังส่ง...' : 'Submitting...') 
                : (currentLanguage === 'th' ? 'ส่งฟอร์ม' : 'Submit Form')}
            </button>
          </div>
        </form>

        {/* Footer */}
        {meta.footerText && (
          <div
            className="mt-8 p-6 rounded-b-lg text-center text-sm shadow-sm"
            style={{
              backgroundColor: meta.footerBackgroundColor,
              color: meta.footerTextColor || '#64748b'
            }}
          >
            {getText(meta.footerText, currentLanguage)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicForm;
