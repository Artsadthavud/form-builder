
import React, { useState, useCallback, useMemo, memo } from 'react';
import { FormElement, FormMetadata, ElementType, Language, TranslatableText, Signer } from '../types';
import { getText } from '../utils/i18n';
import { buildCustomStyles, buildCustomClasses } from '../utils/styles';

// Memoized Canvas Element Item Component
interface CanvasElementItemProps {
  el: FormElement;
  index: number;
  currentLanguage: Language;
  selectedId: string | null;
  draggedId: string | null;
  signers: Signer[];
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  renderReadOnlyInput: (el: FormElement) => React.ReactNode;
  renderChildren?: (parentId: string) => React.ReactNode;
}

const CanvasElementItem = memo<CanvasElementItemProps>(({
  el,
  index,
  currentLanguage,
  selectedId,
  draggedId,
  signers,
  onSelect,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  renderReadOnlyInput,
  renderChildren
}) => {
  const getCanvasTextLocal = (text: string | TranslatableText | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[currentLanguage] || '';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, el.id)}
      onDragOver={(e) => onDragOver(e, index)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.id);
      }}
      style={{ width: el.type === 'section' ? '100%' : `${el.width || 100}%` }}
      className={`
        relative px-2 mb-4
        ${draggedId === el.id ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div 
        className={`
          group rounded-lg transition-all cursor-move h-full
          ${selectedId === el.id 
            ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' 
            : 'hover:ring-1 hover:ring-slate-300'}
          ${el.type === 'section' ? 'bg-white border-2 border-dashed border-slate-300 p-4 pt-8' : 'bg-white border border-slate-200 p-4'}
          ${buildCustomClasses(el)}
        `}
        style={buildCustomStyles(el)}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(el.id);
            }}
            className="p-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs font-medium shadow-sm"
            title="Duplicate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${getCanvasTextLocal(el.label) || el.id}"?`)) {
                onDelete(el.id);
              }
            }}
            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium shadow-sm"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {el.type !== 'image' && (
          <div className="flex items-center justify-between mb-2 pointer-events-none">
            <label className={`block font-medium ${el.type === 'section' ? 'text-indigo-600 font-bold text-sm uppercase tracking-wider' : 'text-sm text-slate-700'}`}>
              {getCanvasTextLocal(el.label) || `[${currentLanguage.toUpperCase()}]`} {el.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-1.5">
              {/* Signer Badge */}
              {el.signerId && signers.length > 0 && (() => {
                const signer = signers.find(s => s.id === el.signerId);
                if (!signer) return null;
                return (
                  <span className="text-[10px] bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-1 rounded-full font-bold border border-amber-200 shadow-sm">
                    ✍️ {signer.order}
                  </span>
                );
              })()}
              {el.logic && el.logic.conditions.length > 0 && (
                <span className="text-[10px] bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-2 py-1 rounded-full font-bold border border-purple-200 shadow-sm flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  {el.logic.conditions.length}
                </span>
              )}
              <span className="text-xs text-slate-300 font-mono">{el.width}%</span>
            </div>
          </div>
        )}

        {/* Section Content or Input Render */}
        {el.type === 'section' ? (
          <div className="min-h-[120px] bg-slate-50/50 rounded border-2 border-dashed border-slate-200 transition-all p-3">
            {renderChildren?.(el.id)}
          </div>
        ) : (
          <div className="pointer-events-none">
            {renderReadOnlyInput(el)}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.el.id === nextProps.el.id &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.draggedId === nextProps.draggedId &&
    prevProps.currentLanguage === nextProps.currentLanguage &&
    prevProps.el === nextProps.el
  );
});

CanvasElementItem.displayName = 'CanvasElementItem';

// Get text for Canvas - show only selected language, no fallback
const getCanvasText = (text: string | TranslatableText | undefined, language: Language | undefined): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (!language) return '';
  return text[language] || '';
};

interface CanvasProps {
  elements: FormElement[];
  meta: FormMetadata;
  currentLanguage: Language;
  selectedId: string | null;
  signers?: Signer[];
  viewAsSignerId?: string | null;
  onSelect: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReparent: (elementId: string, newParentId?: string) => void;
  onUpdateMeta: (meta: FormMetadata) => void;
  onAdd: (type: ElementType, opts?: { parentId?: string; insertAfterId?: string; insertIndex?: number }) => void;
}

const Canvas: React.FC<CanvasProps> = ({ elements, meta, currentLanguage, selectedId, signers = [], viewAsSignerId, onSelect, onMove, onDelete, onDuplicate, onReparent, onUpdateMeta, onAdd }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDragOverHeader, setIsDragOverHeader] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
    
    // Clean drag image
    const ghost = document.createElement('div');
    ghost.classList.add('opacity-0');
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedId) return;
    
    const dragIndex = elements.findIndex(el => el.id === draggedId);
    if (dragIndex === targetIndex) return;
    
    onMove(dragIndex, targetIndex);
  };

  const handleDropOnSection = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Check for new element dropped from toolbox
    const newType = e.dataTransfer.getData('application/x-formflow-new');
    if (newType) {
      onAdd(newType as ElementType, { parentId: sectionId });
      setDraggedId(null);
      return;
    }

    if (draggedId && draggedId !== sectionId) {
      onReparent(draggedId, sectionId);
      setDraggedId(null);
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    const newType = e.dataTransfer.getData('application/x-formflow-new');
    if (newType) {
      onAdd(newType as ElementType, {});
      setDraggedId(null);
      return;
    }

    if (draggedId) {
      onReparent(draggedId, undefined);
      setDraggedId(null);
    }
  };

  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverHeader(true);
  };

  const handleHeaderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverHeader(false);
  };

  const handleHeaderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverHeader(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onUpdateMeta({ ...meta, logoUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // Handle Logo Placement Drop
    const dragType = e.dataTransfer.getData('application/x-formflow-logo');
    if (dragType === 'true') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      
      if (x < width * 0.2) onUpdateMeta({ ...meta, logoPlacement: 'left' });
      else if (x > width * 0.8) onUpdateMeta({ ...meta, logoPlacement: 'right' });
      else if (y < height * 0.3) onUpdateMeta({ ...meta, logoPlacement: 'top' });
      else if (y > height * 0.7) onUpdateMeta({ ...meta, logoPlacement: 'bottom' });
    }
  };

  const renderHeader = () => {
    const { logoPlacement = 'top', logoAlignment = 'center', headerTextAlignment = 'center', logoWidth = 25 } = meta;
    
    const isRow = logoPlacement === 'left' || logoPlacement === 'right';

    let containerClass = 'flex gap-6 p-6 shadow-sm rounded-lg mb-6 transition-all relative ';
    
    if (logoPlacement === 'top') containerClass += 'flex-col';
    else if (logoPlacement === 'bottom') containerClass += 'flex-col-reverse';
    else if (logoPlacement === 'left') containerClass += 'flex-row'; 
    else if (logoPlacement === 'right') containerClass += 'flex-row-reverse';

    // Alignment for Row Layouts (Vertical Alignment)
    if (isRow) {
       if (logoAlignment === 'left') containerClass += ' items-start'; // "top"
       else if (logoAlignment === 'right') containerClass += ' items-end'; // "bottom"
       else containerClass += ' items-center'; // "middle" (default)
    }

    // Logo Wrapper Alignment (Horizontal for Column)
    let logoWrapperClass = 'flex flex-shrink-0 ';
    if (!isRow) {
       if (logoAlignment === 'left') logoWrapperClass += 'justify-start';
       else if (logoAlignment === 'right') logoWrapperClass += 'justify-end';
       else logoWrapperClass += 'justify-center';
    }

    // Apply logoWidth - if Row, wrapper takes % width. If Col, img takes % width.
    const logoWrapperStyle = isRow ? { width: `${logoWidth}%` } : {};
    const imgStyle = isRow ? { width: '100%' } : { width: `${logoWidth}%`, maxWidth: '100%' };

    return (
       <div 
          className={`${containerClass} ${isDragOverHeader ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} border-b border-slate-100 hover:opacity-90 cursor-pointer`}
          style={{ 
            backgroundColor: meta.headerBackgroundColor || '#ffffff',
            color: meta.headerTitleColor || '#1e293b' 
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect('');
          }}
          onDragOver={handleHeaderDragOver}
          onDragLeave={handleHeaderDragLeave}
          onDrop={handleHeaderDrop}
       >
          {/* Logo Section */}
          {meta.logoUrl && (
            <div className={logoWrapperClass} style={logoWrapperStyle}>
                <img 
                  src={meta.logoUrl} 
                  alt="Logo" 
                  className="object-contain cursor-move active:scale-95 transition-transform" 
                  style={imgStyle}
                  draggable
                  onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-formflow-logo', 'true');
                      e.stopPropagation();
                  }}
                />
            </div>
          )}
          
          {/* Text Section */}
          <div className={`flex-1 ${headerTextAlignment === 'left' ? 'text-left' : headerTextAlignment === 'right' ? 'text-right' : 'text-center'}`}>
             <h1 className="text-3xl font-bold">{getCanvasText(meta.title, currentLanguage) || (currentLanguage === 'th' ? 'ชื่อฟอร์ม' : 'Form Title')}</h1>
             {meta.description && <p className="mt-2 opacity-80">{getCanvasText(meta.description, currentLanguage) || (currentLanguage === 'th' ? 'คำอธิบาย' : 'Description')}</p>}
          </div>
          
          {!meta.logoUrl && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-lg">
                <span className="text-xs text-slate-500 font-medium">Drop Logo Here</span>
             </div>
          )}
       </div>
    );
  };

  const renderReadOnlyInput = (el: FormElement) => {
    const lang = currentLanguage;
    
    switch (el.type) {
      case 'paragraph':
        return (
          <div className="text-slate-600 text-sm whitespace-pre-wrap p-1">
            {getCanvasText(el.content, lang) || (lang === 'th' ? 'ข้อความย่อหน้า...' : 'Paragraph text...')}
          </div>
        );
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
      case 'time':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center text-slate-400 text-sm">
            {getCanvasText(el.placeholder, lang) || (
              el.type === 'date' ? 'YYYY-MM-DD' : 
              el.type === 'time' ? '--:--' : 
              el.type === 'email' ? 'example@email.com' :
              el.type === 'phone' ? '0812345678' :
              (lang === 'th' ? 'ใส่ข้อมูล...' : 'Input placeholder...')
            )}
          </div>
        );
      case 'phone_otp':
      case 'email_otp':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 h-9 border border-slate-300 rounded bg-slate-50 px-3 flex items-center text-slate-400 text-sm">
                {getCanvasText(el.placeholder, lang) || (el.type === 'phone_otp' ? '0812345678' : 'example@email.com')}
              </div>
              <button className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded hover:bg-emerald-600 transition-colors whitespace-nowrap">
                {lang === 'th' ? 'ส่ง OTP' : 'Send OTP'}
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                {[...Array(el.otpConfig?.otpLength || 6)].map((_, i) => (
                  <div key={i} className="w-8 h-9 border border-slate-300 rounded bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                    _
                  </div>
                ))}
              </div>
              <button className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-300 transition-colors">
                {lang === 'th' ? 'ยืนยัน' : 'Verify'}
              </button>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>OTP Verification Required</span>
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center text-slate-400 text-sm gap-2">
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">{lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}</span>
            <span>{lang === 'th' ? 'ไม่มีไฟล์ที่เลือก' : 'No file selected'}</span>
          </div>
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[...Array(el.ratingMax || 5)].map((_, i) => (
              <span key={i} className="text-slate-300 text-xl">★</span>
            ))}
          </div>
        );
      case 'textarea':
        return (
          <div className="w-full border border-slate-300 rounded bg-slate-50 px-3 py-2 text-slate-400 text-sm min-h-[80px]">
            {getCanvasText(el.placeholder, lang) || (lang === 'th' ? 'ใส่ข้อความ...' : 'Text area placeholder...')}
          </div>
        );
      case 'select':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center justify-between text-slate-600 text-sm">
            <span>{lang === 'th' ? 'เลือกตัวเลือก' : 'Select an option'}</span>
            <span className="text-xs">▼</span>
          </div>
        );
      case 'radio':
      case 'checkbox':
        return (
          <div className={`flex ${el.orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`}>
            {el.options?.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 border border-slate-400 ${el.type === 'radio' ? 'rounded-full' : 'rounded'}`}></div>
                <span className="text-sm text-slate-600">{getCanvasText(opt.label, lang) || `[${(lang || 'th').toUpperCase()}]`}</span>
              </div>
            ))}
          </div>
        );
      case 'signature':
        return (
          <div 
            className="w-full border border-slate-300 border-dashed rounded bg-slate-50 flex items-end justify-start p-4 text-slate-400"
            style={{ height: `${el.signatureHeight || 150}px` }}
          >
            <div className="border-b-2 border-slate-300 w-1/2 pb-1 text-sm font-handwriting italic">
              Sign Here
            </div>
          </div>
        );
      case 'image':
        return (
          <div className={`w-full flex ${el.imageAlign === 'center' ? 'justify-center' : el.imageAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
            {el.imageUrl ? (
               <img 
                 src={el.imageUrl} 
                 alt={el.imageAlt} 
                 style={{ width: `${el.imageWidth}%`, maxWidth: '100%' }}
                 className="rounded border border-slate-200" 
               />
            ) : (
               <div className="w-full h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 gap-2">
                 <span className="text-2xl">🖼️</span>
                 <span className="text-xs">Upload image in properties</span>
               </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Recursive render function
  const renderElements = (parentId?: string) => {
    // Filter elements that belong to this parent
    const children = elements
      .map((el, index) => ({ el, index }))
      .filter(({ el }) => el.parentId === parentId);

    return (
      <div className="flex flex-wrap -mx-2 w-full">
        {children.map(({ el, index }) => (
          <div
            key={el.id}
            draggable
            onDragStart={(e) => handleDragStart(e, el.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(el.id);
            }}
            style={{ width: el.type === 'section' ? '100%' : `${el.width || 100}%` }}
            className={`
              relative px-2 mb-4
              ${draggedId === el.id ? 'opacity-50' : 'opacity-100'}
            `}
          >
             <div 
                className={`
                  group rounded-lg transition-all cursor-move h-full
                  ${selectedId === el.id 
                    ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' 
                    : 'hover:ring-1 hover:ring-slate-300'}
                  ${el.type === 'section' ? 'bg-white border-2 border-dashed border-slate-300 p-4 pt-8' : 'bg-white border border-slate-200 p-4'}
                  ${buildCustomClasses(el)}
                `}
                style={buildCustomStyles(el)}
             >
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(el.id);
                    }}
                    className="p-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs font-medium shadow-sm"
                    title="Duplicate (Ctrl+D)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${getCanvasText(el.label, currentLanguage) || el.id}"?`)) {
                        onDelete(el.id);
                      }
                    }}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium shadow-sm"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {el.type !== 'image' && (
                  <div className="flex items-center justify-between mb-2 pointer-events-none">
                    <label className={`block font-medium ${el.type === 'section' ? 'text-indigo-600 font-bold text-sm uppercase tracking-wider' : 'text-sm text-slate-700'}`}>
                      {getCanvasText(el.label, currentLanguage) || `[${(currentLanguage || 'th').toUpperCase()}]`} {el.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {/* Signer Badge */}
                      {el.signerId && signers.length > 0 && (() => {
                        const signer = signers.find(s => s.id === el.signerId);
                        if (!signer) return null;
                        return (
                          <div className="relative group/signer">
                            <span className="text-[10px] bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-1 rounded-full font-bold border border-amber-200 shadow-sm flex items-center gap-1 cursor-help">
                              ✍️ {signer.order}
                            </span>
                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-slate-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover/signer:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                              <div className="font-semibold mb-1">Signer Assignment</div>
                              <div className="text-slate-300">{signer.name}</div>
                              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                            </div>
                          </div>
                        );
                      })()}
                      {el.logic && el.logic.conditions.length > 0 && (
                        <div className="relative group/logic">
                          <span className="text-[10px] bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-2 py-1 rounded-full font-bold border border-purple-200 shadow-sm flex items-center gap-1 cursor-help">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                            </svg>
                            {el.logic.conditions.length}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover/logic:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                            <div className="font-semibold mb-1">Conditional Logic</div>
                            <div className="text-slate-300">{el.logic.conditions.length} rule{el.logic.conditions.length > 1 ? 's' : ''} • {el.logic.combinator}</div>
                            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      )}
                      <span className="text-xs text-slate-300 font-mono">{el.width}%</span>
                    </div>
                  </div>
                )}

                {/* Section Content or Input Render */}
                {el.type === 'section' ? (
                  <div 
                    className="min-h-[120px] bg-slate-50/50 rounded border-2 border-dashed border-slate-200 transition-all"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50', 'border-solid');
                      e.currentTarget.classList.remove('border-slate-200', 'border-dashed');
                    }}
                    onDragLeave={(e) => {
                       e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50', 'border-solid');
                       e.currentTarget.classList.add('border-slate-200', 'border-dashed');
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50', 'border-solid');
                      e.currentTarget.classList.add('border-slate-200', 'border-dashed');
                      handleDropOnSection(e, el.id);
                    }}
                  >
                    <div className="p-3">
                      {renderElements(el.id)}
                      {elements.filter(e => e.parentId === el.id).length === 0 && (
                         <div className="text-center py-8 text-sm text-slate-400 italic flex flex-col items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                           </svg>
                           <span>Drop items here</span>
                         </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pointer-events-none">
                    {renderReadOnlyInput(el)}
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
        className="flex-1 bg-slate-100 p-8 overflow-y-auto min-h-full"
        onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
        }}
        onDrop={handleDropOnRoot}
    >
        <div className="max-w-3xl mx-auto min-h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col" onClick={(e) => {
           if (e.target === e.currentTarget) {
              onSelect('');
           }
        }}>
            {/* Header Visualization */}
            {renderHeader()}

            <div className="flex-1">
              {elements.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                      <span className="text-4xl mb-2">✎</span>
                      <p>Drag and drop elements here</p>
                  </div>
              ) : (
                  renderElements(undefined)
              )}
            </div>

            {/* Footer Visualization */}
            <div 
              className="mt-12 pt-6 border-t border-slate-100 text-center text-sm cursor-pointer hover:opacity-90 transition-all rounded-lg p-6" 
              style={{ 
                backgroundColor: meta.footerBackgroundColor || '#ffffff',
                color: meta.footerTextColor || '#64748b' 
              }}
              onClick={(e) => {
                 e.stopPropagation();
                 onSelect('');
              }}
            >
                {getCanvasText(meta.footerText, currentLanguage) || (currentLanguage === 'th' ? '© ท้ายฟอร์ม' : '© Footer')}
            </div>
        </div>
    </div>
  );
};

export default Canvas;
