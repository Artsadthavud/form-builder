
import React, { useState } from 'react';
import { FormElement, FormMetadata, ElementType } from '../types';

interface CanvasProps {
  elements: FormElement[];
  meta: FormMetadata;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onDelete: (id: string) => void;
  onReparent: (elementId: string, newParentId?: string) => void;
  onUpdateMeta: (meta: FormMetadata) => void;
  onAdd: (type: ElementType, opts?: { parentId?: string; insertAfterId?: string; insertIndex?: number }) => void;
}

const Canvas: React.FC<CanvasProps> = ({ elements, meta, selectedId, onSelect, onMove, onDelete, onReparent, onUpdateMeta, onAdd }) => {
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
             <h1 className="text-3xl font-bold">{meta.title}</h1>
             {meta.description && <p className="mt-2 opacity-80">{meta.description}</p>}
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
    switch (el.type) {
      case 'paragraph':
        return (
          <div className="text-slate-600 text-sm whitespace-pre-wrap p-1">
            {el.content || 'Paragraph text...'}
          </div>
        );
      case 'text':
      case 'number':
      case 'date':
      case 'time':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center text-slate-400 text-sm">
            {el.placeholder || (el.type === 'date' ? 'YYYY-MM-DD' : el.type === 'time' ? '--:--' : 'Input placeholder...')}
          </div>
        );
      case 'file':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center text-slate-400 text-sm gap-2">
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">Choose File</span>
            <span>No file selected</span>
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
          <div className="h-20 w-full border border-slate-300 rounded bg-slate-50 p-3 text-slate-400 text-sm">
            {el.placeholder || 'Text area placeholder...'}
          </div>
        );
      case 'select':
        return (
          <div className="h-9 w-full border border-slate-300 rounded bg-slate-50 px-3 flex items-center justify-between text-slate-600 text-sm">
            <span>Select an option</span>
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
                <span className="text-sm text-slate-600">{opt.label}</span>
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
             <div className={`
                group rounded-lg transition-all cursor-move h-full
                ${selectedId === el.id 
                  ? 'ring-2 ring-indigo-500 ring-offset-2 z-10' 
                  : 'hover:ring-1 hover:ring-slate-300'}
                ${el.type === 'section' ? 'bg-white border-2 border-dashed border-slate-300 p-4 pt-8' : 'bg-white border border-slate-200 p-4'}
             `}>
                {el.type !== 'image' && (
                  <div className="flex items-center justify-between mb-2 pointer-events-none">
                    <label className={`block font-medium ${el.type === 'section' ? 'text-indigo-600 font-bold text-sm uppercase tracking-wider' : 'text-sm text-slate-700'}`}>
                      {el.label} {el.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      {el.logic && el.logic.conditions.length > 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                          Logic
                        </span>
                      )}
                      <span className="text-xs text-slate-300 font-mono">{el.width}%</span>
                    </div>
                  </div>
                )}

                {/* Section Content or Input Render */}
                {el.type === 'section' ? (
                  <div 
                    className="min-h-[60px] bg-slate-50/50 rounded border border-transparent transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-indigo-300', 'bg-indigo-50');
                    }}
                    onDragLeave={(e) => {
                       e.currentTarget.classList.remove('border-indigo-300', 'bg-indigo-50');
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove('border-indigo-300', 'bg-indigo-50');
                      handleDropOnSection(e, el.id);
                    }}
                  >
                    <div className="p-2">
                      {renderElements(el.id)}
                      {elements.filter(e => e.parentId === el.id).length === 0 && (
                         <div className="text-center py-4 text-xs text-slate-400 italic">
                           Drop items here
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
                {meta.footerText}
            </div>
        </div>
    </div>
  );
};

export default Canvas;
