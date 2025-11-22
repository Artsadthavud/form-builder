
import React, { useState, useRef } from 'react';
import { FormElement, ElementType, FormMetadata } from './types';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Preview from './components/Preview';

const App: React.FC = () => {
  const [elements, setElements] = useState<FormElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for global form settings (Header/Footer)
  const [formMeta, setFormMeta] = useState<FormMetadata>({
    title: 'Untitled Form',
    description: 'Please fill out the form below.',
    logoUrl: '',
    footerText: '© 2024 FormFlow Builder',
    headerBackgroundColor: '#ffffff',
    headerTitleColor: '#1e293b', // slate-800
    logoPlacement: 'top',
    logoAlignment: 'center',
    headerTextAlignment: 'center',
    logoWidth: 25, // Default logo width percentage
    footerBackgroundColor: '#ffffff',
    footerTextColor: '#64748b' // slate-500
  });

  // Helper to generate unique IDs
  const generateId = (type: string) => {
    const count = elements.filter(e => e.type === type).length + 1;
    let newId = `${type}_${count}`;
    while (elements.find(e => e.id === newId)) {
      newId = `${newId}_${Math.floor(Math.random() * 1000)}`;
    }
    return newId;
  };

  const addElement = (type: ElementType) => {
    const newElement: FormElement = {
      id: generateId(type),
      type,
      label: type === 'section' ? 'New Section' : type === 'signature' ? 'Signature' : type === 'image' ? 'Image' : type === 'paragraph' ? 'Information' : `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      placeholder: ['text', 'textarea', 'number', 'email', 'date', 'time'].includes(type) ? 'Enter value...' : undefined,
      required: false,
      width: '100', // Default full width
      options: (type === 'radio' || type === 'checkbox' || type === 'select') 
        ? [{ id: 'opt_1', label: 'Option 1', value: 'option_1' }, { id: 'opt_2', label: 'Option 2', value: 'option_2' }] 
        : undefined,
      // Image defaults
      imageWidth: 100,
      imageAlign: 'center',
      // Signature default
      signatureHeight: 150,
      // Paragraph default
      content: type === 'paragraph' ? 'Enter your text content here. You can use this space for instructions, disclaimers, or extra information.' : undefined,
      // Rating default
      ratingMax: 5
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (updated: FormElement) => {
    setElements(elements.map(el => el.id === updated.id ? updated : el));
  };

  const deleteElement = (id: string) => {
    // Recursively delete children if a section is deleted
    const idsToDelete = new Set<string>([id]);
    
    const findChildren = (parentId: string) => {
      elements.forEach(el => {
        if (el.parentId === parentId) {
          idsToDelete.add(el.id);
          if (el.type === 'section') {
            findChildren(el.id);
          }
        }
      });
    };
    findChildren(id);

    setElements(elements.filter(el => !idsToDelete.has(el.id)));
    if (selectedId && idsToDelete.has(selectedId)) setSelectedId(null);
  };

  const moveElement = (dragIndex: number, hoverIndex: number) => {
    const updatedElements = [...elements];
    const [draggedElement] = updatedElements.splice(dragIndex, 1);
    updatedElements.splice(hoverIndex, 0, draggedElement);
    setElements(updatedElements);
  };

  const reparentElement = (elementId: string, newParentId?: string) => {
    if (elementId === newParentId) return; // Cannot parent to self
    
    // Check for circular dependency
    let current = elements.find(e => e.id === newParentId);
    while (current) {
      if (current.id === elementId) return; // Ancestor cannot be child of descendant
      if (!current.parentId) break;
      current = elements.find(e => e.id === current?.parentId);
    }

    setElements(elements.map(el => 
      el.id === elementId ? { ...el, parentId: newParentId } : el
    ));
  };

  const exportSchema = () => {
    const schema = {
      metadata: formMeta,
      elements: elements
    };
    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "form-schema.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.metadata && imported.elements) {
          setFormMeta(imported.metadata);
          setElements(imported.elements);
          setSelectedId(null);
        } else {
          alert('Invalid schema file format');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">FormFlow Builder</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={triggerImport}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            title="Import Schema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Import</span>
          </button>

          <button
            onClick={exportSchema}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            title="Export Form Schema"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export</span>
          </button>

          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-all shadow-sm"
            title="View JSON"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span className="hidden sm:inline">Code</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!isPreview ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isPreview ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {isPreview ? (
          <div className="flex-1 bg-slate-100 overflow-y-auto w-full scroll-smooth">
            <div className="min-h-full w-full p-4 md:p-8 flex justify-center items-start pb-24">
              <Preview elements={elements} meta={formMeta} />
            </div>
          </div>
        ) : (
          <>
            <Toolbox onAdd={addElement} />
            <Canvas 
              elements={elements} 
              meta={formMeta}
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              onMove={moveElement}
              onDelete={deleteElement}
              onReparent={reparentElement}
              onUpdateMeta={setFormMeta}
            />
            <PropertiesPanel 
              element={selectedElement} 
              allElements={elements}
              formMetadata={formMeta}
              onUpdate={updateElement} 
              onDelete={deleteElement}
              onUpdateMetadata={setFormMeta}
            />
          </>
        )}
      </main>

      {/* Code View Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCodeModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Form Schema (JSON)</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50 font-mono text-xs">
              <pre>{JSON.stringify({ metadata: formMeta, elements }, null, 2)}</pre>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ metadata: formMeta, elements }, null, 2));
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
