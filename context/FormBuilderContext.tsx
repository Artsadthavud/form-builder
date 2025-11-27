import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { FormElement, FormMetadata, ElementType, Language, Signer, SignerMode, FormPage } from '../types';

// Types
interface FormBuilderState {
  // Form data
  elements: FormElement[];
  formMeta: FormMetadata;
  pages: FormPage[];
  signers: Signer[];
  signerMode: SignerMode;
  
  // UI state
  currentPageId: string;
  selectedId: string | null;
  currentLanguage: Language;
  isPreview: boolean;
  viewAsSignerId: string | null;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
}

interface FormBuilderActions {
  // Element actions
  addElement: (type: ElementType, opts?: { parentId?: string; insertAfterId?: string; insertIndex?: number }) => void;
  updateElement: (updated: FormElement) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  reparentElement: (elementId: string, newParentId?: string) => void;
  
  // Selection
  setSelectedId: (id: string | null) => void;
  
  // Metadata
  setFormMeta: (meta: FormMetadata) => void;
  
  // Pages
  setCurrentPageId: (pageId: string) => void;
  addPage: () => void;
  removePage: (pageId: string) => void;
  
  // Language
  setCurrentLanguage: (lang: Language) => void;
  
  // View
  setIsPreview: (preview: boolean) => void;
  setViewAsSignerId: (signerId: string | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Signers
  setSigners: (signers: Signer[]) => void;
  setSignerMode: (mode: SignerMode) => void;
}

interface FormBuilderContextValue {
  state: FormBuilderState;
  actions: FormBuilderActions;
  
  // Computed values
  pageElements: FormElement[];
  filteredPageElements: FormElement[];
  selectedElement: FormElement | undefined;
  viewingSigner: Signer | undefined;
}

// Context
const FormBuilderContext = createContext<FormBuilderContextValue | null>(null);

// Hook
export function useFormBuilderContext() {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilderContext must be used within FormBuilderProvider');
  }
  return context;
}

// Selector hooks for optimized re-renders
export function useFormElements() {
  const { state } = useFormBuilderContext();
  return state.elements;
}

export function useSelectedElement() {
  const { selectedElement } = useFormBuilderContext();
  return selectedElement;
}

export function useFormMeta() {
  const { state } = useFormBuilderContext();
  return state.formMeta;
}

export function useCurrentLanguage() {
  const { state, actions } = useFormBuilderContext();
  return [state.currentLanguage, actions.setCurrentLanguage] as const;
}

// Provider Props
interface FormBuilderProviderProps {
  children: React.ReactNode;
  initialElements: FormElement[];
  initialMeta: FormMetadata;
  initialPages: FormPage[];
  initialSigners?: Signer[];
  initialSignerMode?: SignerMode;
  onSave?: (data: {
    elements: FormElement[];
    metadata: FormMetadata;
    pages: FormPage[];
    signers: Signer[];
    signerMode: SignerMode;
  }) => void;
}

// Provider Component
export const FormBuilderProvider: React.FC<FormBuilderProviderProps> = ({
  children,
  initialElements,
  initialMeta,
  initialPages,
  initialSigners = [],
  initialSignerMode = 'single',
  onSave
}) => {
  // State
  const [elements, setElements] = useState<FormElement[]>(initialElements);
  const [formMeta, setFormMeta] = useState<FormMetadata>(initialMeta);
  const [pages, setPages] = useState<FormPage[]>(initialPages);
  const [signers, setSigners] = useState<Signer[]>(initialSigners);
  const [signerMode, setSignerMode] = useState<SignerMode>(initialSignerMode);
  const [currentPageId, setCurrentPageId] = useState(initialPages[0]?.id || 'page_1');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialMeta.defaultLanguage || 'th');
  const [isPreview, setIsPreview] = useState(false);
  const [viewAsSignerId, setViewAsSignerId] = useState<string | null>(null);
  
  // History (simplified for context - full implementation in useUndoRedo hook)
  const [historyPast, setHistoryPast] = useState<any[]>([]);
  const [historyFuture, setHistoryFuture] = useState<any[]>([]);

  // Memoized computed values
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

  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedId),
    [elements, selectedId]
  );

  const viewingSigner = useMemo(
    () => viewAsSignerId ? signers.find(s => s.id === viewAsSignerId) : undefined,
    [signers, viewAsSignerId]
  );

  // Generate unique ID
  const generateId = useCallback((type: string) => {
    const count = elements.filter(e => e.type === type).length + 1;
    let newId = `${type}_${count}`;
    while (elements.find(e => e.id === newId)) {
      newId = `${newId}_${Math.floor(Math.random() * 1000)}`;
    }
    return newId;
  }, [elements]);

  // Actions
  const actions: FormBuilderActions = useMemo(() => ({
    addElement: (type, opts) => {
      const defaultLabels: Record<string, { th: string; en: string }> = {
        section: { th: 'ส่วนใหม่', en: 'New Section' },
        text: { th: 'ข้อความใหม่', en: 'New Text' },
        number: { th: 'ตัวเลขใหม่', en: 'New Number' },
        // ... add others as needed
      };

      const newElement: FormElement = {
        id: generateId(type),
        type,
        label: defaultLabels[type] || { th: 'ใหม่', en: 'New' },
        required: false,
        width: '100',
        pageId: currentPageId,
      };

      setElements(prev => [...prev, newElement]);
      setSelectedId(newElement.id);
    },

    updateElement: (updated) => {
      setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
    },

    deleteElement: (id) => {
      const idsToDelete = new Set<string>([id]);
      const findChildren = (parentId: string) => {
        elements.forEach(el => {
          if (el.parentId === parentId) {
            idsToDelete.add(el.id);
            if (el.type === 'section') findChildren(el.id);
          }
        });
      };
      findChildren(id);
      setElements(prev => prev.filter(el => !idsToDelete.has(el.id)));
      if (selectedId && idsToDelete.has(selectedId)) setSelectedId(null);
    },

    duplicateElement: (id) => {
      const element = elements.find(e => e.id === id);
      if (!element) return;
      const newId = `${element.type}_${Date.now()}`;
      const duplicated = { ...element, id: newId };
      setElements(prev => {
        const idx = prev.findIndex(e => e.id === id);
        const updated = [...prev];
        updated.splice(idx + 1, 0, duplicated);
        return updated;
      });
      setSelectedId(newId);
    },

    moveElement: (dragIndex, hoverIndex) => {
      setElements(prev => {
        const updated = [...prev];
        const [dragged] = updated.splice(dragIndex, 1);
        updated.splice(hoverIndex, 0, dragged);
        return updated;
      });
    },

    reparentElement: (elementId, newParentId) => {
      if (elementId === newParentId) return;
      setElements(prev => prev.map(el =>
        el.id === elementId ? { ...el, parentId: newParentId } : el
      ));
    },

    setSelectedId,
    setFormMeta,
    setCurrentPageId,
    
    addPage: () => {
      const id = `page_${Date.now()}`;
      setPages(prev => [...prev, { id, label: `Page ${prev.length + 1}` }]);
      setCurrentPageId(id);
    },

    removePage: (pageId) => {
      if (pages.length <= 1) return;
      const idx = pages.findIndex(p => p.id === pageId);
      const prevPageId = idx > 0 ? pages[idx - 1].id : pages[0].id;
      setElements(prev => prev.map(el =>
        el.pageId === pageId ? { ...el, pageId: prevPageId } : el
      ));
      setPages(prev => prev.filter(p => p.id !== pageId));
      if (currentPageId === pageId) setCurrentPageId(prevPageId);
    },

    setCurrentLanguage,
    setIsPreview,
    setViewAsSignerId,

    undo: () => {
      if (historyPast.length === 0) return;
      const prev = historyPast[historyPast.length - 1];
      setHistoryPast(h => h.slice(0, -1));
      setHistoryFuture(f => [{ elements, formMeta, pages }, ...f]);
      setElements(prev.elements);
      setFormMeta(prev.formMeta);
      setPages(prev.pages);
    },

    redo: () => {
      if (historyFuture.length === 0) return;
      const next = historyFuture[0];
      setHistoryFuture(f => f.slice(1));
      setHistoryPast(p => [...p, { elements, formMeta, pages }]);
      setElements(next.elements);
      setFormMeta(next.formMeta);
      setPages(next.pages);
    },

    setSigners,
    setSignerMode,
  }), [elements, formMeta, pages, currentPageId, selectedId, generateId, historyPast, historyFuture]);

  // State object
  const state: FormBuilderState = useMemo(() => ({
    elements,
    formMeta,
    pages,
    signers,
    signerMode,
    currentPageId,
    selectedId,
    currentLanguage,
    isPreview,
    viewAsSignerId,
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
  }), [elements, formMeta, pages, signers, signerMode, currentPageId, selectedId, currentLanguage, isPreview, viewAsSignerId, historyPast.length, historyFuture.length]);

  // Context value
  const value: FormBuilderContextValue = useMemo(() => ({
    state,
    actions,
    pageElements,
    filteredPageElements,
    selectedElement,
    viewingSigner,
  }), [state, actions, pageElements, filteredPageElements, selectedElement, viewingSigner]);

  // Auto-save to parent
  useEffect(() => {
    if (!onSave) return;
    const timer = setTimeout(() => {
      onSave({ elements, metadata: formMeta, pages, signers, signerMode });
    }, 1000);
    return () => clearTimeout(timer);
  }, [elements, formMeta, pages, signers, signerMode, onSave]);

  return (
    <FormBuilderContext.Provider value={value}>
      {children}
    </FormBuilderContext.Provider>
  );
};

export default FormBuilderContext;
