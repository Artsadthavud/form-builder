import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FormElement, ElementType, FormMetadata, FormProject, Language, FormPage, Signer, SignerMode } from './types';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import Preview from './components/Preview';
import FormSettingsModal from './components/FormSettingsModal';
import CalculationBuilder from './components/CalculationBuilder';
import SkipLogicBuilder from './components/SkipLogicBuilder';
import TemplateManager from './components/TemplateManager';
import { useFormBuilderState } from './hooks/useFormBuilderState';
import { useAutosave, useAutoSaveToParent } from './hooks/useAutosave';

interface FormBuilderProps {
  form: FormProject;
  onSave: (data: { name: string; metadata: FormMetadata; elements: FormElement[]; pages: { id: string; label: string }[]; signers?: Signer[]; signerMode?: SignerMode }) => void;
  onSaveSettings?: (settings: { name: string; codeName?: string; site?: string; description?: string; tags?: string[]; signers?: Signer[]; signerMode?: SignerMode }) => void;
  onBack: () => void;
  onViewResponses: () => void;
  onViewRevisions?: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ form, onSave, onSaveSettings, onBack, onViewResponses, onViewRevisions }) => {
  const [formName, setFormName] = useState(form.name);
  const DRAFT_KEY = `formflow_builder_draft_${form.id}`;
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(form.metadata.defaultLanguage || 'th');

  const [isPreview, setIsPreview] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCalculationBuilder, setShowCalculationBuilder] = useState(false);
  const [showSkipLogicBuilder, setShowSkipLogicBuilder] = useState<string | null>(null); // page id
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [viewAsSignerId, setViewAsSignerId] = useState<string | null>(null); // Filter view by signer
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Use the new custom hook for state management
  const {
    elements,
    pages,
    formMeta,
    signers,
    signerMode,
    selectedId,
    currentPageId,
    historyPast,
    historyFuture,
    setSigners,
    setSignerMode,
    setSelectedId,
    setCurrentPageId,
    setElements,
    setPages,
    setFormMeta,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    reparentElement,
    setAll,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFormBuilderState({ initialForm: form });

  // Sync signers from form prop when it changes (e.g., from settings modal)
  useEffect(() => {
    if (form.signers) {
      setSigners(form.signers);
    }
    if (form.signerMode) {
      setSignerMode(form.signerMode);
    }
  }, [form.signers, form.signerMode, setSigners, setSignerMode]);

  // Keep current language valid whenever available languages change
  useEffect(() => {
    const available = formMeta.availableLanguages && formMeta.availableLanguages.length > 0
      ? formMeta.availableLanguages
      : ['th', 'en'];
    if (!available.includes(currentLanguage)) {
      setCurrentLanguage((available[0] as Language) || 'th');
    }
  }, [formMeta.availableLanguages, currentLanguage]);

  // --- Autosave Integration ---

  // 1. Local Draft Autosave
  useAutosave(
    { metadata: formMeta, elements, pages },
    {
      key: DRAFT_KEY,
      enabled: autosaveEnabled,
      delay: 1200,
    }
  );

  // 2. Parent Component Autosave (Debounced onSave)
  useAutoSaveToParent(
    { name: formName, metadata: formMeta, elements, pages, signers, signerMode },
    (data) => onSave(data),
    { enabled: autosaveEnabled, delay: 1000 }
  );

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
  }, [undo, redo]);

  // Helper to generate unique IDs
  const generateId = useCallback((type: string) => {
    const count = elements.filter(e => e.type === type).length + 1;
    let newId = `${type}_${count}`;
    while (elements.find(e => e.id === newId)) {
      newId = `${newId}_${Math.floor(Math.random() * 1000)}`;
    }
    return newId;
  }, [elements]);

  const addElement = (type: ElementType, opts?: { parentId?: string; insertAfterId?: string; insertIndex?: number }) => {
    const defaultLabels: Record<string, { th: string; en: string }> = {
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
      rating: { th: 'คะแนนใหม่', en: 'New Rating' },
      phone_otp: { th: 'เบอร์โทร + OTP', en: 'Phone + OTP' },
      email_otp: { th: 'อีเมล + OTP', en: 'Email + OTP' },
    };
    
    const newElement: FormElement = {
      id: generateId(type),
      type,
      label: defaultLabels[type] || { th: 'ใหม่', en: 'New' },
      placeholder: ['text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'phone_otp', 'email_otp'].includes(type) 
        ? type === 'email' || type === 'email_otp'
          ? { th: 'example@email.com', en: 'example@email.com' }
          : type === 'phone' || type === 'phone_otp'
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
      ratingMax: 5,
      // OTP defaults
      otpConfig: (type === 'phone_otp' || type === 'email_otp') ? {
        sendOtpEndpoint: '',
        verifyOtpEndpoint: '',
        otpLength: 6,
        expireSeconds: 300,
        resendDelaySeconds: 60,
        maxAttempts: 3,
        valueFieldName: type === 'phone_otp' ? 'phone' : 'email',
        otpFieldName: 'otp',
        sendButtonText: { th: 'ส่ง OTP', en: 'Send OTP' },
        verifyButtonText: { th: 'ยืนยัน', en: 'Verify' },
        resendButtonText: { th: 'ส่งใหม่', en: 'Resend' },
        successMessage: { th: 'ยืนยันสำเร็จ', en: 'Verified successfully' },
        errorMessage: { th: 'รหัส OTP ไม่ถูกต้อง', en: 'Invalid OTP code' },
        expiredMessage: { th: 'รหัส OTP หมดอายุ', en: 'OTP code expired' },
      } : undefined,
    };
    // assign page: if parent specified, use parent's pageId, else current page
    if (opts && opts.parentId) {
      newElement.pageId = elements.find(e => e.id === opts.parentId)?.pageId || currentPageId;
    } else if (opts && opts.insertAfterId) {
      newElement.pageId = elements.find(e => e.id === opts.insertAfterId)?.pageId || currentPageId;
    } else {
      newElement.pageId = currentPageId;
    }
    
    // Logic to determine insertion position
    let updated = [...elements];

    if (opts && (opts.parentId || opts.insertAfterId || typeof opts.insertIndex === 'number')) {
      if (opts.parentId) {
        newElement.parentId = opts.parentId;

        if (typeof opts.insertIndex === 'number') {
          updated.splice(opts.insertIndex, 0, newElement);
        } else {
          // find last child index of the parent
          const lastChildIndex = elements
            .map((el, idx) => ({ el, idx }))
            .filter(({ el }) => el.parentId === opts.parentId)
            .map(({ idx }) => idx)
            .pop();

          if (typeof lastChildIndex !== 'undefined') {
            updated.splice(lastChildIndex + 1, 0, newElement);
          } else {
            const parentIndex = elements.findIndex(e => e.id === opts.parentId);
            updated.splice(parentIndex + 1, 0, newElement);
          }
        }
      } else if (opts.insertAfterId) {
        newElement.parentId = elements.find(e => e.id === opts.insertAfterId)?.parentId;
        const idx = elements.findIndex(e => e.id === opts.insertAfterId);
        updated.splice(idx + 1, 0, newElement);
      }
    } else if (selectedId) {
      // Insert logic: if something is selected, prefer adding inside a section or after the selected element
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
            updated.splice(lastChildIndex + 1, 0, newElement);
          } else {
            // insert right after the section element
            const sectionIndex = elements.findIndex(e => e.id === selected.id);
            updated.splice(sectionIndex + 1, 0, newElement);
          }
        } else {
          // If selected is a normal element, insert after it and keep the same parentId
          newElement.parentId = selected.parentId;
          const selIndex = elements.findIndex(e => e.id === selected.id);
          if (selIndex >= 0) {
            updated.splice(selIndex + 1, 0, newElement);
          }
        }
      } else {
        updated.push(newElement);
      }
    } else {
      // Default: append to the end
      updated.push(newElement);
    }

    // Use setElements from hook to update state and push history
    setElements(updated);
    setSelectedId(newElement.id);
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
        setAll(imported.elements, imported.pages || [{ id: 'page_1', label: 'Page 1' }], imported.metadata);
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
          const newPages = (imported.pages && Array.isArray(imported.pages) && imported.pages.length > 0)
            ? imported.pages
            : [{ id: 'page_1', label: 'Page 1' }];
          
          setAll(imported.elements, newPages, imported.metadata);
          alert('Form schema imported successfully');
        } else {
          alert('Invalid schema file format');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
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

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || '';
          });
          return row;
        });

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
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  // Memoized computed values for better performance
  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedId),
    [elements, selectedId]
  );
  
  const pageElements = useMemo(
    () => elements.filter(el => el.pageId === currentPageId),
    [elements, currentPageId]
  );
  
  const filteredPageElements = useMemo(
    () => viewAsSignerId
      ? pageElements.filter(el => !el.signerId || el.signerId === viewAsSignerId)
      : pageElements,
    [pageElements, viewAsSignerId]
  );
  
  const viewingSigner = useMemo(
    () => viewAsSignerId ? signers.find(s => s.id === viewAsSignerId) : null,
    [viewAsSignerId, signers]
  );

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
            onClick={() => setIsPreview(!isPreview)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-all shadow-sm ${
              isPreview
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                : 'text-slate-600 bg-white border-slate-300 hover:bg-slate-50 hover:text-emerald-600'
            }`}
            title={isPreview ? "Exit Preview Mode" : "Preview Form"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>{isPreview ? 'Exit Preview' : 'Preview'}</span>
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
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors ${!canUndo ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'}`}
              title="Undo (Ctrl+Z)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors ${!canRedo ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'}`}
              title="Redo (Ctrl+Y)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => onSave({ name: formName, metadata: formMeta, elements, pages, signers, signerMode })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Toolbox */}
        <Toolbox onAdd={addElement} />

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-100">
          {/* Signer View Toggle (if multi-signer) */}
          {signers.length > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase">View as:</span>
              <select 
                value={viewAsSignerId || ''} 
                onChange={(e) => setViewAsSignerId(e.target.value || null)}
                className="text-xs border-none bg-transparent font-semibold text-indigo-600 focus:ring-0 cursor-pointer"
              >
                <option value="">-- All Fields --</option>
                {signers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          )}

          {/* Page Tabs */}
          {pages.length > 1 && (
            <div className="bg-white border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageId(page.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    currentPageId === page.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {page.label || `Page ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar" onClick={() => setSelectedId(null)}>
            <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-xl rounded-xl overflow-hidden border border-slate-200 transition-all">
              <Canvas
                elements={filteredPageElements}
                meta={formMeta}
                currentLanguage={currentLanguage}
                selectedId={selectedId}
                signers={signers}
                viewAsSignerId={viewAsSignerId}
                onSelect={(id) => {
                  setSelectedId(id);
                }}
                onMove={moveElement}
                onDelete={deleteElement}
                onDuplicate={duplicateElement}
                onReparent={reparentElement}
                onUpdateMeta={setFormMeta}
                onAdd={addElement}
              />
            </div>
            
            {/* Footer Credits */}
            <div className="max-w-3xl mx-auto mt-8 text-center text-slate-400 text-xs pb-8">
              <p>FormFlow Builder &copy; {new Date().getFullYear()} &bull; Designed for performance</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Properties */}
        <PropertiesPanel
          element={selectedElement}
          allElements={elements}
          formMetadata={formMeta}
          currentLanguage={currentLanguage}
          signers={signers}
          onLanguageChange={setCurrentLanguage}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onUpdateMetadata={setFormMeta}
          onRequestLabelChange={requestLabelChange}
          onOpenCalculation={() => setShowCalculationBuilder(true)}
        />
      </div>

      {/* Modals */}
      {isPreview && (
        <Preview
          elements={elements}
          pages={pages}
          meta={formMeta}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onClose={() => setIsPreview(false)}
        />
      )}

      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-slate-800">Form JSON Schema</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 font-mono text-sm">
              <pre>{JSON.stringify({ metadata: formMeta, elements, pages, signers, signerMode }, null, 2)}</pre>
            </div>
            <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ metadata: formMeta, elements, pages, signers, signerMode }, null, 2));
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <FormSettingsModal
          form={{
            ...form,
            name: formName,
            metadata: formMeta,
            signers: signers,
            signerMode: signerMode
          }}
          elements={elements}
          onClose={() => setShowSettingsModal(false)}
          onSave={(settings) => {
            setFormName(settings.name);
            if (settings.description) {
               // Update metadata description if provided
               const currentDesc = typeof formMeta.description === 'string' 
                 ? { th: formMeta.description, en: formMeta.description }
                 : formMeta.description || { th: '', en: '' };
               
               setFormMeta({ 
                 ...formMeta, 
                 description: { 
                   ...currentDesc, 
                   [currentLanguage]: settings.description 
                 } 
               });
            }
            if (settings.signers) setSigners(settings.signers);
            if (settings.signerMode) setSignerMode(settings.signerMode);
            
            // Call parent save settings
            onSaveSettings?.({
              name: settings.name,
              description: settings.description,
              signers: settings.signers,
              signerMode: settings.signerMode
            });
            setShowSettingsModal(false);
          }}
        />
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-xl text-slate-800">Import Data</h3>
            <p className="text-sm text-slate-600">Choose a file format to import. This will replace current form content.</p>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => { setShowImportModal(false); triggerImport(); }}
                className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800">Import JSON Schema</div>
                  <div className="text-xs text-slate-500">Restore from a previously exported file</div>
                </div>
              </button>

              <button
                onClick={() => { setShowImportModal(false); csvInputRef.current?.click(); }}
                className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800">Import from CSV</div>
                  <div className="text-xs text-slate-500">Generate fields from CSV headers</div>
                </div>
              </button>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setShowImportModal(false); loadDraft(); }}
                  className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <span>Load Saved Draft</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowImportModal(false)}
              className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCalculationBuilder && selectedElement && selectedElement.type === 'number' && (
        <CalculationBuilder
          element={selectedElement}
          allElements={elements}
          onSave={(calc) => {
            updateElement({ ...selectedElement, calculation: calc });
            setShowCalculationBuilder(false);
          }}
          onClose={() => setShowCalculationBuilder(false)}
        />
      )}

      {showSkipLogicBuilder && (
        <SkipLogicBuilder
          pageId={showSkipLogicBuilder}
          pages={pages}
          elements={elements}
          onSave={(updatedPages) => {
            setPages(updatedPages);
            setShowSkipLogicBuilder(null);
          }}
          onClose={() => setShowSkipLogicBuilder(null)}
        />
      )}

      {showTemplateManager && (
        <TemplateManager
          currentMetadata={formMeta}
          currentLanguage={currentLanguage}
          currentElements={elements}
          currentPages={pages}
          onApplyHeader={(style) => {
            console.log('onApplyHeader called with style:', style);
            if (!style) return;
            setFormMeta({
              ...formMeta,
              headerBackgroundColor: style.backgroundColor,
              headerTitleColor: style.textColor,
              headerTextAlignment: style.textAlignment,
              logoPlacement: style.logoPlacement,
              logoAlignment: style.logoAlignment,
              logoWidth: style.logoWidth,
              // Only update content if present in template
              title: style.title || formMeta.title,
              description: style.description || formMeta.description
            });
            console.log('Header template applied, closing modal');
            setShowTemplateManager(false);
          }}
          onApplyFooter={(style) => {
            if (!style) return;
            setFormMeta({
              ...formMeta,
              footerBackgroundColor: style.backgroundColor,
              footerTextColor: style.textColor,
              footerText: style.footerText || formMeta.footerText
            });
            setShowTemplateManager(false);
          }}
          onApplyBody={(newElements, mode) => {
            console.log('onApplyBody called:', { mode, newElements, currentElements: elements });
            
            // Add pageId to all elements so they show on the current page
            const elementsWithPageId = newElements.map(el => ({
              ...el,
              pageId: currentPageId
            }));
            
            if (mode === 'replace') {
              setElements(elementsWithPageId);
              setSelectedId(null);
            } else {
              setElements([...elements, ...elementsWithPageId]);
            }
            console.log('Body template applied with pageId, closing modal');
            setShowTemplateManager(false);
          }}
          onSaveAsTemplate={() => {}}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
};

export default FormBuilder;
