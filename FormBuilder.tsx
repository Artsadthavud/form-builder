
import React, { useState, useRef, useEffect } from 'react';
import { FormElement, ElementType, FormMetadata, FormProject, Language, FormPage, Calculation, SkipRule, FormTemplate } from './types';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Preview from './components/Preview';
import FormSettingsModal from './components/FormSettingsModal';
import CalculationBuilder from './components/CalculationBuilder';
import SkipLogicBuilder from './components/SkipLogicBuilder';
import TemplateManager from './components/TemplateManager';

interface FormBuilderProps {
  form: FormProject;
  onSave: (data: { name: string; metadata: FormMetadata; elements: FormElement[]; pages: { id: string; label: string }[] }) => void;
  onSaveSettings?: (settings: { name: string; codeName?: string; site?: string; description?: string; tags?: string[] }) => void;
  onBack: () => void;
  onViewResponses: () => void;
  onViewRevisions?: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ form, onSave, onSaveSettings, onBack, onViewResponses, onViewRevisions }) => {
  const [formName, setFormName] = useState(form.name);
  const [elements, setElements] = useState<FormElement[]>(form.elements);
  const [pages, setPages] = useState(form.pages);
  const [currentPageId, setCurrentPageId] = useState(form.pages[0]?.id || 'page_1');
  const [formMeta, setFormMeta] = useState<FormMetadata>(form.metadata);
  const DRAFT_KEY = `formflow_builder_draft_${form.id}`;
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(form.metadata.defaultLanguage || 'th');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCalculationBuilder, setShowCalculationBuilder] = useState(false);
  const [showSkipLogicBuilder, setShowSkipLogicBuilder] = useState<string | null>(null); // page id
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Keep current language valid whenever available languages change
  useEffect(() => {
    const available = formMeta.availableLanguages && formMeta.availableLanguages.length > 0
      ? formMeta.availableLanguages
      : ['th', 'en'];
    if (!available.includes(currentLanguage)) {
      setCurrentLanguage((available[0] as Language) || 'th');
    }
  }, [formMeta.availableLanguages, currentLanguage]);

  // Auto-save to parent component
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autosaveEnabled) {
        onSave({ name: formName, metadata: formMeta, elements, pages });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formName, formMeta, elements, pages, autosaveEnabled]);

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
      email: { th: 'อีเมลใหม่', en: 'New Email' },
      phone: { th: 'เบอร์โทรศัพท์ใหม่', en: 'New Phone' },
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
      placeholder: ['text', 'textarea', 'number', 'email', 'phone', 'date', 'time'].includes(type) 
        ? type === 'email' 
          ? { th: 'example@email.com', en: 'example@email.com' }
          : type === 'phone'
          ? { th: '0812345678', en: '0812345678' }
          : { th: 'กรอกค่า...', en: 'Enter value...' }
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
      content: type === 'paragraph' ? 'กรอกเนื้อหาข้อความที่นี่ คุณสามารถใช้พื้นที่นี้สำหรับคำแนะนำ ข้อจำกัดความรับผิดชอบ หรือข้อมูลเพิ่มเติม' : undefined,
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

  const duplicateElement = (id: string) => {
    const element = elements.find(e => e.id === id);
    if (!element) return;

    // Generate new unique ID
    const timestamp = Date.now();
    const newId = `${element.type}_${timestamp}`;
    
    // Deep clone the element
    const duplicated: FormElement = {
      ...element,
      id: newId,
      label: typeof element.label === 'string' 
        ? `${element.label} (Copy)` 
        : { ...element.label, th: `${element.label.th} (สำเนา)`, en: `${element.label.en} (Copy)` }
    };

    // If element is a section, also duplicate its children
    if (element.type === 'section') {
      const children = elements.filter(e => e.parentId === id);
      const newChildren = children.map((child, idx) => ({
        ...child,
        id: `${child.type}_${timestamp}_${idx}`,
        parentId: newId
      }));
      
      // Find position to insert (after original element and its children)
      const originalIdx = elements.findIndex(e => e.id === id);
      const lastChildIdx = children.length > 0 
        ? Math.max(...children.map(c => elements.findIndex(e => e.id === c.id)))
        : originalIdx;
      
      const insertIdx = lastChildIdx + 1;
      const updated = [...elements];
      updated.splice(insertIdx, 0, duplicated, ...newChildren);
      setElements(updated);
    } else {
      // Insert right after the original element
      const idx = elements.findIndex(e => e.id === id);
      const updated = [...elements];
      updated.splice(idx + 1, 0, duplicated);
      setElements(updated);
    }
    
    setSelectedId(newId);
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
            const defaultPages = [{ id: 'page_1', label: 'Page 1' }];
            setPages(defaultPages);
            setCurrentPageId(defaultPages[0].id);
          }
          setSelectedId(null);
          alert('Form schema imported successfully');
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

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV must have at least a header row and one data row');
          return;
        }

        // Parse CSV (simple parser, doesn't handle quotes)
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || '';
          });
          return row;
        });

        // Create form elements from headers
        const newElements: FormElement[] = headers.map((header, idx) => ({
          id: `imported_${header.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`,
          type: 'text' as ElementType,
          label: { th: header, en: header },
          placeholder: { th: 'กรอกค่า...', en: 'Enter value...' },
          required: false,
          width: '100',
          pageId: currentPageId
        }));

        setElements([...elements, ...newElements]);
        setSelectedId(null);
        alert(`Imported ${headers.length} fields from CSV (${data.length} data rows detected)`);
      } catch (err) {
        console.error('CSV import error:', err);
        alert('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (csvInputRef.current) csvInputRef.current.value = '';
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
      {/* Hidden File Inputs for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
        aria-label="Import form schema file"
      />
      <input 
        type="file" 
        ref={csvInputRef} 
        onChange={handleCSVImport} 
        accept=".csv" 
        className="hidden" 
        aria-label="Import CSV file"
      />

      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-lg md:text-xl font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2"
              placeholder="Form name..."
            />
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded border ${
            form.status === 'published' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : form.status === 'archived'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {form.status === 'published' ? 'เผยแพร่แล้ว' : form.status === 'archived' ? 'เก็บถาวร' : 'แบบร่าง'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            title="Form Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>

          {onViewRevisions && (
            <button
              onClick={onViewRevisions}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm"
              title="View Revision History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Revisions</span>
            </button>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-green-600 transition-all shadow-sm"
            title="Import Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Import</span>
          </button>

          <button
            onClick={() => setShowTemplateManager(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-violet-600 transition-all shadow-sm"
            title="Header/Footer Templates"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
            <span>Templates</span>
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
              <>
                <button 
                  onClick={() => setShowSkipLogicBuilder(currentPageId)}
                  className="px-2 py-1 text-sm bg-cyan-50 text-cyan-600 rounded flex items-center gap-1"
                  title="Configure skip logic for this page"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Skip
                </button>
                <button onClick={() => {
                  // remove current page: move elements to previous page if any
                  const idx = pages.findIndex(p => p.id === currentPageId);
                  const prev = idx > 0 ? pages[idx - 1].id : pages[0].id;
                  setElements(elements.map(el => el.pageId === currentPageId ? { ...el, pageId: prev } : el));
                  const newPages = pages.filter(p => p.id !== currentPageId);
                  setPages(newPages);
                  setCurrentPageId(prev);
                }} className="px-2 py-1 text-sm bg-red-50 text-red-600 rounded">Remove</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {isPreview ? (
          <div className="flex-1 bg-slate-100 overflow-y-auto w-full scroll-smooth">
            <div className="min-h-full w-full p-4 md:p-8 flex justify-center items-start pb-24">
              <Preview 
                elements={elements} 
                meta={formMeta} 
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
            </div>
          </div>
        ) : (
          <>
            <Toolbox onAdd={addElement} />
            <Canvas 
              elements={pageElements} 
              meta={formMeta}
              currentLanguage={currentLanguage}
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              onMove={moveElement}
              onDelete={deleteElement}
              onDuplicate={duplicateElement}
              onReparent={reparentElement}
              onUpdateMeta={setFormMeta}
              onAdd={addElement}
            />
            <PropertiesPanel 
              element={selectedElement} 
              allElements={elements}
              formMetadata={formMeta}
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onUpdate={updateElement} 
              onDelete={deleteElement}
              onUpdateMetadata={setFormMeta}
              onRequestLabelChange={requestLabelChange}
              onOpenCalculation={() => setShowCalculationBuilder(true)}
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

      {/* Form Settings Modal */}
      {showSettingsModal && onSaveSettings && (
        <FormSettingsModal
          form={form}
          onSave={(settings) => {
            onSaveSettings(settings);
            setFormName(settings.name);
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Import Data</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowImportModal(false);
                  }}
                  className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                      📄
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">Import JSON Schema</h4>
                      <p className="text-xs text-slate-500">Import complete form structure (metadata, elements, pages)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    csvInputRef.current?.click();
                    setShowImportModal(false);
                  }}
                  className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-xl">
                      📊
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">Import CSV Fields</h4>
                      <p className="text-xs text-slate-500">Create form fields from CSV column headers</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  <strong>JSON:</strong> Replaces entire form structure<br/>
                  <strong>CSV:</strong> Adds new fields from column headers
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Builder Modal */}
      {showCalculationBuilder && selectedElement && selectedElement.type === 'number' && (
        <CalculationBuilder
          element={selectedElement}
          allElements={elements}
          currentLanguage={currentLanguage}
          onSave={(calculation) => {
            updateElement({ ...selectedElement, calculation });
            setShowCalculationBuilder(false);
          }}
          onClose={() => setShowCalculationBuilder(false)}
        />
      )}

      {/* Skip Logic Builder Modal */}
      {showSkipLogicBuilder && (
        <SkipLogicBuilder
          page={pages.find(p => p.id === showSkipLogicBuilder) as FormPage}
          allPages={pages as FormPage[]}
          allElements={elements}
          currentLanguage={currentLanguage}
          onSave={(skipRules) => {
            setPages(pages.map(p => 
              p.id === showSkipLogicBuilder 
                ? { ...p, skipRules } 
                : p
            ));
            setShowSkipLogicBuilder(null);
          }}
          onClose={() => setShowSkipLogicBuilder(null)}
        />
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          currentMetadata={formMeta}
          currentLanguage={currentLanguage}
          onApplyHeader={(headerStyle) => {
            if (headerStyle) {
              setFormMeta({
                ...formMeta,
                headerBackgroundColor: headerStyle.backgroundColor,
                headerTitleColor: headerStyle.textColor,
                headerTextAlignment: headerStyle.textAlignment,
                logoUrl: headerStyle.logoUrl || formMeta.logoUrl,
                logoPlacement: headerStyle.logoPlacement || formMeta.logoPlacement,
                logoAlignment: headerStyle.logoAlignment || formMeta.logoAlignment,
                logoWidth: headerStyle.logoWidth || formMeta.logoWidth,
              });
            }
            setShowTemplateManager(false);
          }}
          onApplyFooter={(footerStyle) => {
            if (footerStyle) {
              setFormMeta({
                ...formMeta,
                footerBackgroundColor: footerStyle.backgroundColor,
                footerTextColor: footerStyle.textColor,
                footerText: footerStyle.footerText || formMeta.footerText,
              });
            }
            setShowTemplateManager(false);
          }}
          onSaveAsTemplate={(name, category) => {
            // Handled internally by TemplateManager
          }}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
};

export default FormBuilder;
