
import React, { useState, useRef } from 'react';
import { FormElement, ElementType, FormMetadata } from './types';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Preview from './components/Preview';

const App: React.FC = () => {
  const [elements, setElements] = useState<FormElement[]>([]);
  const initialPages = [{ id: 'page_1', label: 'Page 1' }];
  const [pages, setPages] = useState(initialPages);
  const [currentPageId, setCurrentPageId] = useState(initialPages[0].id);
  const DRAFT_KEY = 'formflow_builder_draft_v1';
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for global form settings (Header/Footer)
  const [formMeta, setFormMeta] = useState<FormMetadata>({
    title: { th: 'ฟอร์มไม่มีชื่อ', en: 'Untitled Form' },
    description: { th: 'กรุณากรอกข้อมูลในฟอร์มด้านล่าง', en: 'Please fill out the form below.' },
    logoUrl: '',
    footerText: { th: '© 2024 FormFlow Builder', en: '© 2024 FormFlow Builder' },
    headerBackgroundColor: '#ffffff',
    headerTitleColor: '#1e293b', // slate-800
    logoPlacement: 'top',
    logoAlignment: 'center',
    headerTextAlignment: 'center',
    logoWidth: 25, // Default logo width percentage
    footerBackgroundColor: '#ffffff',
    footerTextColor: '#64748b', // slate-500
    defaultLanguage: 'th',
    availableLanguages: ['th', 'en']
  });

  // Undo/Redo history
  type Snapshot = { elements: FormElement[]; pages: { id: string; label: string }[]; metadata: FormMetadata; selectedId: string | null };
  const [historyPast, setHistoryPast] = useState<Snapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<Snapshot[]>([]);
  const lastSnapshotRef = React.useRef<Snapshot | null>(null);
  const HISTORY_LIMIT = 50;

  const takeSnapshot = React.useCallback(() => {
    const snapshot: Snapshot = { elements, pages, metadata: formMeta, selectedId };
    return snapshot;
  }, [elements, pages, formMeta, selectedId]);

  // Record snapshot when core state changes, debounced slightly
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const snapshot = takeSnapshot();
        const last = lastSnapshotRef.current;
        const lastJson = last ? JSON.stringify(last) : null;
        const curJson = JSON.stringify(snapshot);
        if (lastJson === curJson) return; // no meaningful change
        if (last) {
          setHistoryPast(prev => {
            const next = [...prev, last];
            if (next.length > HISTORY_LIMIT) return next.slice(next.length - HISTORY_LIMIT);
            return next;
          });
        }
        // Clear future on new changes
        setHistoryFuture([]);
        lastSnapshotRef.current = snapshot;
      } catch (e) {
        console.error('Snapshot failed', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [elements, pages, formMeta, selectedId, takeSnapshot]);

  const undo = () => {
    if (historyPast.length === 0) return;
    const prev = historyPast[historyPast.length - 1];
    const present = takeSnapshot();
    setHistoryPast(h => h.slice(0, h.length - 1));
    setHistoryFuture(f => [present, ...f].slice(0, HISTORY_LIMIT));
    // apply prev
    setElements(prev.elements);
    setPages(prev.pages);
    setFormMeta(prev.metadata);
    setSelectedId(prev.selectedId);
    lastSnapshotRef.current = prev;
  };

  const redo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const present = takeSnapshot();
    setHistoryFuture(f => f.slice(1));
    setHistoryPast(p => [...p, present].slice(-HISTORY_LIMIT));
    setElements(next.elements);
    setPages(next.pages);
    setFormMeta(next.metadata);
    setSelectedId(next.selectedId);
    lastSnapshotRef.current = next;
  };

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrMeta && !e.shiftKey && key === 'z') {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ( (ctrlOrMeta && key === 'y') || (ctrlOrMeta && e.shiftKey && key === 'z') ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, historyPast.length, historyFuture.length]);

  // Helper to generate unique IDs
  const generateId = (type: string) => {
    const count = elements.filter(e => e.type === type).length + 1;
    let newId = `${type}_${count}`;
    while (elements.find(e => e.id === newId)) {
      newId = `${newId}_${Math.floor(Math.random() * 1000)}`;
    }
    return newId;
  };

  const addElement = (type: ElementType, opts?: { parentId?: string; insertAfterId?: string; insertIndex?: number }) => {
    const defaultLabels = {
      section: { th: 'ส่วนใหม่', en: 'New Section' },
      signature: { th: 'ลายเซ็น', en: 'Signature' },
      image: { th: 'รูปภาพ', en: 'Image' },
      paragraph: { th: 'ข้อมูล', en: 'Information' },
      text: { th: 'ข้อความใหม่', en: 'New Text' },
      number: { th: 'ตัวเลขใหม่', en: 'New Number' },
      textarea: { th: 'ข้อความยาวใหม่', en: 'New Textarea' },
      radio: { th: 'ตัวเลือกเดียวใหม่', en: 'New Radio' },
      checkbox: { th: 'ตัวเลือกหลายรายการใหม่', en: 'New Checkbox' },
      select: { th: 'เมนูดรอปดาวน์ใหม่', en: 'New Select' },
      date: { th: 'วันที่ใหม่', en: 'New Date' },
      time: { th: 'เวลาใหม่', en: 'New Time' },
      file: { th: 'ไฟล์ใหม่', en: 'New File' },
      rating: { th: 'คะแนนใหม่', en: 'New Rating' }
    };
    
    const newElement: FormElement = {
      id: generateId(type),
      type,
      label: defaultLabels[type] || { th: 'ใหม่', en: 'New' },
      placeholder: ['text', 'textarea', 'number', 'email', 'date', 'time'].includes(type) 
        ? { th: 'กรอกค่า...', en: 'Enter value...' } 
        : undefined,
      required: false,
      width: '100', // Default full width
      options: (type === 'radio' || type === 'checkbox' || type === 'select') 
        ? [
            { id: 'opt_1', label: { th: 'ตัวเลือก 1', en: 'Option 1' }, value: 'option_1' }, 
            { id: 'opt_2', label: { th: 'ตัวเลือก 2', en: 'Option 2' }, value: 'option_2' }
          ] 
        : undefined,
      // Image defaults
      imageWidth: 100,
      imageAlign: 'center',
      // Signature default
      signatureHeight: 150,
      // Paragraph default
      content: type === 'paragraph' ? { th: 'กรอกเนื้อหาข้อความที่นี่ คุณสามารถใช้พื้นที่นี้สำหรับคำแนะนำ ข้อจำกัดความรับผิดชอบ หรือข้อมูลเพิ่มเติม', en: 'Enter your text content here. You can use this space for instructions, disclaimers, or extra information.' } : undefined,
      // Rating default
      ratingMax: 5
    };
    // assign page: if parent specified, use parent's pageId, else current page
    if (opts && opts.parentId) {
      newElement.pageId = elements.find(e => e.id === opts.parentId)?.pageId || currentPageId;
    } else if (opts && opts.insertAfterId) {
      newElement.pageId = elements.find(e => e.id === opts.insertAfterId)?.pageId || currentPageId;
    } else {
      newElement.pageId = currentPageId;
    }
    // If explicit options provided (e.g., dropped into a section), honor them first
    if (opts && (opts.parentId || opts.insertAfterId || typeof opts.insertIndex === 'number')) {
      if (opts.parentId) {
        newElement.parentId = opts.parentId;

        if (typeof opts.insertIndex === 'number') {
          const updated = [...elements];
          updated.splice(opts.insertIndex, 0, newElement);
          setElements(updated);
          setSelectedId(newElement.id);
          return;
        }

        // find last child index of the parent
        const lastChildIndex = elements
          .map((el, idx) => ({ el, idx }))
          .filter(({ el }) => el.parentId === opts.parentId)
          .map(({ idx }) => idx)
          .pop();

        if (typeof lastChildIndex !== 'undefined') {
          const updated = [...elements];
          updated.splice(lastChildIndex + 1, 0, newElement);
          setElements(updated);
        } else {
          const parentIndex = elements.findIndex(e => e.id === opts.parentId);
          const updated = [...elements];
          updated.splice(parentIndex + 1, 0, newElement);
          setElements(updated);
        }

        setSelectedId(newElement.id);
        return;
      }

      if (opts.insertAfterId) {
        newElement.parentId = elements.find(e => e.id === opts.insertAfterId)?.parentId;
        const idx = elements.findIndex(e => e.id === opts.insertAfterId);
        const updated = [...elements];
        updated.splice(idx + 1, 0, newElement);
        setElements(updated);
        setSelectedId(newElement.id);
        return;
      }
    }

    // Insert logic: if something is selected, prefer adding inside a section or after the selected element
    if (selectedId) {
      const selected = elements.find(e => e.id === selectedId);
      if (selected) {
        // If selected is a section, add as its child (append to the last child)
        if (selected.type === 'section') {
          newElement.parentId = selected.id;

          // find last child index of the section
          const lastChildIndex = elements
            .map((el, idx) => ({ el, idx }))
            .filter(({ el }) => el.parentId === selected.id)
            .map(({ idx }) => idx)
            .pop();

          if (typeof lastChildIndex !== 'undefined') {
            const updated = [...elements];
            updated.splice(lastChildIndex + 1, 0, newElement);
            setElements(updated);
          } else {
            // insert right after the section element
            const sectionIndex = elements.findIndex(e => e.id === selected.id);
            const updated = [...elements];
            updated.splice(sectionIndex + 1, 0, newElement);
            setElements(updated);
          }

          setSelectedId(newElement.id);
          return;
        }

        // If selected is a normal element, insert after it and keep the same parentId
        newElement.parentId = selected.parentId;
        const selIndex = elements.findIndex(e => e.id === selected.id);
        if (selIndex >= 0) {
          const updated = [...elements];
          updated.splice(selIndex + 1, 0, newElement);
          setElements(updated);
          setSelectedId(newElement.id);
          return;
        }
      }
    }

    // Default: append to the end
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (updated: FormElement) => {
    setElements(elements.map(el => el.id === updated.id ? updated : el));
  };

  const requestLabelChange = (id: string, newLabel: string) => {
    const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = elements.find(e => e.id === id);
    const base = slugify(newLabel) || (existing ? `${existing.type}_${Date.now()}` : `el_${Date.now()}`);
    let candidate = base;
    let counter = 1;
    while (elements.find(e => e.id === candidate && e.id !== id)) {
      candidate = `${base}_${counter++}`;
    }

    const updated = elements.map(el => {
      if (el.id === id) return { ...el, id: candidate, label: newLabel } as FormElement;
      let copy = { ...el } as FormElement;
      if (copy.parentId === id) copy.parentId = candidate;
      if (copy.logic) {
        const newConds = copy.logic.conditions.map(c => c.targetId === id ? { ...c, targetId: candidate } : c);
        copy = { ...copy, logic: { ...copy.logic, conditions: newConds } } as FormElement;
      }
      return copy;
    });

    setElements(updated);
    if (selectedId === id) setSelectedId(candidate);
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
      elements: elements,
      pages
    };
    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formMeta.title?.replace(/[^a-z0-9]/gi,'_') || 'form-schema'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveDraft = () => {
    try {
      const schema = { metadata: formMeta, elements, pages };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(schema));
      // lightweight feedback
      // Using alert for simplicity in this environment
      alert('Draft saved locally');
    } catch (e) {
      console.error('Failed to save draft', e);
      alert('Failed to save draft');
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        alert('No draft found in localStorage');
        return;
      }
      const imported = JSON.parse(raw);
      if (imported.metadata && imported.elements) {
        setFormMeta(imported.metadata);
        setElements(imported.elements);
        if (imported.pages && Array.isArray(imported.pages) && imported.pages.length > 0) {
          setPages(imported.pages);
          setCurrentPageId(imported.pages[0].id);
        }
        setSelectedId(null);
        alert('Draft loaded');
      } else {
        alert('Invalid draft format');
      }
    } catch (e) {
      console.error('Failed to load draft', e);
      alert('Failed to load draft');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    alert('Draft cleared');
  };

  // Autosave: debounce changes to elements/pages/meta
  React.useEffect(() => {
    if (!autosaveEnabled) return;
    const t = setTimeout(() => {
      try {
        const schema = { metadata: formMeta, elements, pages };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(schema));
        console.debug('Autosaved draft');
      } catch (e) {
        console.error('Autosave failed', e);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [formMeta, elements, pages, autosaveEnabled]);

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
          if (imported.pages && Array.isArray(imported.pages) && imported.pages.length > 0) {
            setPages(imported.pages);
            setCurrentPageId(imported.pages[0].id);
          } else {
            setPages(initialPages);
            setCurrentPageId(initialPages[0].id);
          }
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
  const pageElements = elements.filter(el => el.pageId === currentPageId);

  // Ensure selectable option-based elements always have an options array when selected
  React.useEffect(() => {
    if (!selectedElement) return;
    if (['select', 'radio', 'checkbox'].includes(selectedElement.type) && (!selectedElement.options || selectedElement.options.length === 0)) {
      const defaultOptions = [
        { id: `opt_${Date.now()}_1`, label: 'Option 1', value: 'option_1' },
        { id: `opt_${Date.now()}_2`, label: 'Option 2', value: 'option_2' }
      ];
      updateElement({ ...selectedElement, options: defaultOptions });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-slate-50">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
        aria-label="Import form schema file"
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
            onClick={saveDraft}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            title="Save Draft locally"
          >
            Save Draft
          </button>

          <button
            onClick={loadDraft}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            title="Load Draft from localStorage"
          >
            Load Draft
          </button>

          <button
            onClick={clearDraft}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md hover:bg-red-100 transition-all shadow-sm"
            title="Clear Draft"
          >
            Clear Draft
          </button>

          <label className="hidden md:flex items-center gap-2 text-sm ml-2">
            <input type="checkbox" checked={autosaveEnabled} onChange={(e) => setAutosaveEnabled(e.target.checked)} /> Auto-save
          </label>

          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-all shadow-sm"
            title="View JSON"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span className="hidden sm:inline">Code</span>
          </button>

          {/* Undo / Redo */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={undo}
              aria-label="Undo (Ctrl+Z)"
              disabled={historyPast.length === 0}
              title={historyPast.length === 0 ? 'Nothing to undo' : 'Undo (Ctrl+Z)'}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${historyPast.length === 0 ? 'text-slate-300 bg-white' : 'text-slate-600 bg-white hover:bg-slate-50'}`}
            >
              ↺
            </button>
            <button
              onClick={redo}
              aria-label="Redo (Ctrl+Y)"
              disabled={historyFuture.length === 0}
              title={historyFuture.length === 0 ? 'Nothing to redo' : 'Redo (Ctrl+Y)'}
              className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${historyFuture.length === 0 ? 'text-slate-300 bg-white' : 'text-slate-600 bg-white hover:bg-slate-50'}`}
            >
              ↻
            </button>
          </div>

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
          {/* Page Controls */}
          <div className="ml-4 flex items-center gap-2">
            <label className="sr-only" htmlFor="page-select">Page</label>
            <select id="page-select" aria-label="Select page" value={currentPageId} onChange={(e) => setCurrentPageId(e.target.value)} className="px-2 py-1 border border-slate-200 rounded bg-white text-sm">
              {pages.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button onClick={() => {
              const id = `page_${Date.now()}`;
              const newPages = [...pages, { id, label: `Page ${pages.length + 1}` }];
              setPages(newPages);
              setCurrentPageId(id);
            }} className="px-2 py-1 text-sm bg-indigo-50 text-indigo-600 rounded">+ Page</button>
            {pages.length > 1 && (
              <button onClick={() => {
                // remove current page: move elements to previous page if any
                const idx = pages.findIndex(p => p.id === currentPageId);
                const prev = idx > 0 ? pages[idx - 1].id : pages[0].id;
                setElements(elements.map(el => el.pageId === currentPageId ? { ...el, pageId: prev } : el));
                const newPages = pages.filter(p => p.id !== currentPageId);
                setPages(newPages);
                setCurrentPageId(prev);
              }} className="px-2 py-1 text-sm bg-red-50 text-red-600 rounded">Remove</button>
            )}
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
              elements={pageElements} 
              meta={formMeta}
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              onMove={moveElement}
              onDelete={deleteElement}
              onReparent={reparentElement}
              onUpdateMeta={setFormMeta}
              onAdd={addElement}
            />
            <PropertiesPanel 
              element={selectedElement} 
              allElements={elements}
              formMetadata={formMeta}
              onUpdate={updateElement} 
              onDelete={deleteElement}
              onUpdateMetadata={setFormMeta}
              onRequestLabelChange={requestLabelChange}
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
