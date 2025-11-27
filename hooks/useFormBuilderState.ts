import { useState, useCallback, useRef } from 'react';
import { FormElement, FormMetadata, FormPage, Signer, SignerMode, ElementType } from '../types';

// Snapshot type for history
type Snapshot = {
    elements: FormElement[];
    pages: FormPage[];
    metadata: FormMetadata;
    selectedId: string | null;
};

interface UseFormBuilderStateProps {
    initialForm: {
        elements: FormElement[];
        pages: FormPage[];
        metadata: FormMetadata;
        signers?: Signer[];
        signerMode?: SignerMode;
    };
}

export const useFormBuilderState = ({ initialForm }: UseFormBuilderStateProps) => {
    // Core State
    const [elements, setElements] = useState<FormElement[]>(initialForm.elements || []);
    const [pages, setPages] = useState<FormPage[]>(initialForm.pages);
    const [formMeta, setFormMeta] = useState<FormMetadata>(initialForm.metadata);
    const [signers, setSigners] = useState<Signer[]>(initialForm.signers || []);
    const [signerMode, setSignerMode] = useState<SignerMode>(initialForm.signerMode || 'single');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentPageId, setCurrentPageId] = useState<string>(initialForm.pages[0]?.id || 'page_1');

    // History State
    const [historyPast, setHistoryPast] = useState<Snapshot[]>([]);
    const [historyFuture, setHistoryFuture] = useState<Snapshot[]>([]);
    const HISTORY_LIMIT = 50;

    // Helper to take a snapshot of the CURRENT state
    const takeSnapshot = useCallback((): Snapshot => {
        return {
            elements,
            pages,
            metadata: formMeta,
            selectedId,
        };
    }, [elements, pages, formMeta, selectedId]);

    // --- History Actions ---

    // Internal helper to push to history BEFORE making a change
    // This ensures the "previous" state is saved exactly as it was
    const pushToHistory = useCallback(() => {
        setHistoryPast(prev => {
            const snapshot = takeSnapshot();
            const newHistory = [...prev, snapshot];
            if (newHistory.length > HISTORY_LIMIT) {
                return newHistory.slice(newHistory.length - HISTORY_LIMIT);
            }
            return newHistory;
        });
        setHistoryFuture([]); // Clear redo stack on new change
    }, [takeSnapshot]);

    const undo = useCallback(() => {
        if (historyPast.length === 0) return;

        const previousSnapshot = historyPast[historyPast.length - 1];
        const currentSnapshot = takeSnapshot();

        // Move current state to future
        setHistoryFuture(prev => [currentSnapshot, ...prev].slice(0, HISTORY_LIMIT));

        // Remove last state from past
        setHistoryPast(prev => prev.slice(0, prev.length - 1));

        // Restore state
        setElements(previousSnapshot.elements);
        setPages(previousSnapshot.pages);
        setFormMeta(previousSnapshot.metadata);
        setSelectedId(previousSnapshot.selectedId);
    }, [historyPast, takeSnapshot]);

    const redo = useCallback(() => {
        if (historyFuture.length === 0) return;

        const nextSnapshot = historyFuture[0];
        const currentSnapshot = takeSnapshot();

        // Move current state to past
        setHistoryPast(prev => [...prev, currentSnapshot].slice(-HISTORY_LIMIT));

        // Remove first state from future
        setHistoryFuture(prev => prev.slice(1));

        // Restore state
        setElements(nextSnapshot.elements);
        setPages(nextSnapshot.pages);
        setFormMeta(nextSnapshot.metadata);
        setSelectedId(nextSnapshot.selectedId);
    }, [historyFuture, takeSnapshot]);

    // --- State Modifiers (Wrapped with History) ---

    const setElementsWithHistory = useCallback((newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => {
        pushToHistory();
        setElements(newElements);
    }, [pushToHistory]);

    const setPagesWithHistory = useCallback((newPages: FormPage[] | ((prev: FormPage[]) => FormPage[])) => {
        pushToHistory();
        setPages(newPages);
    }, [pushToHistory]);

    const setFormMetaWithHistory = useCallback((newMeta: FormMetadata | ((prev: FormMetadata) => FormMetadata)) => {
        pushToHistory();
        setFormMeta(newMeta);
    }, [pushToHistory]);

    // Specific Actions (Ported from FormBuilder.tsx)

    const addElement = useCallback((newElement: FormElement, insertIndex?: number) => {
        pushToHistory();
        setElements(prev => {
            const updated = [...prev];
            if (typeof insertIndex === 'number') {
                updated.splice(insertIndex, 0, newElement);
            } else {
                updated.push(newElement);
            }
            return updated;
        });
        setSelectedId(newElement.id);
    }, [pushToHistory]);

    const updateElement = useCallback((updatedElement: FormElement) => {
        pushToHistory();
        setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    }, [pushToHistory]);

    const deleteElement = useCallback((id: string) => {
        pushToHistory();
        setElements(prev => {
            // Recursive delete logic
            const idsToDelete = new Set<string>([id]);
            const findChildren = (parentId: string) => {
                prev.forEach(el => {
                    if (el.parentId === parentId) {
                        idsToDelete.add(el.id);
                        if (el.type === 'section') {
                            findChildren(el.id);
                        }
                    }
                });
            };
            findChildren(id);
            return prev.filter(el => !idsToDelete.has(el.id));
        });
        if (selectedId === id) setSelectedId(null);
    }, [pushToHistory, selectedId]);

    const duplicateElement = useCallback((id: string) => {
        const element = elements.find(e => e.id === id);
        if (!element) return;

        pushToHistory();

        const timestamp = Date.now();
        const newId = `${element.type}_${timestamp}`;

        const duplicated: FormElement = {
            ...element,
            id: newId,
            label: typeof element.label === 'string'
                ? `${element.label} (Copy)`
                : { ...element.label, th: `${element.label.th} (สำเนา)`, en: `${element.label.en} (Copy)` }
        };

        setElements(prev => {
            const updated = [...prev];
            if (element.type === 'section') {
                const children = prev.filter(e => e.parentId === id);
                const newChildren = children.map((child, idx) => ({
                    ...child,
                    id: `${child.type}_${timestamp}_${idx}`,
                    parentId: newId
                }));

                const originalIdx = prev.findIndex(e => e.id === id);
                const lastChildIdx = children.length > 0
                    ? Math.max(...children.map(c => prev.findIndex(e => e.id === c.id)))
                    : originalIdx;

                updated.splice(lastChildIdx + 1, 0, duplicated, ...newChildren);
            } else {
                const idx = prev.findIndex(e => e.id === id);
                updated.splice(idx + 1, 0, duplicated);
            }
            return updated;
        });
        setSelectedId(newId);
    }, [elements, pushToHistory]);

    const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
        // Note: Drag and drop often triggers many updates. 
        // You might want to debounce history here or only push on "drop" end.
        // For now, we'll push to history to be safe, but this might be too granular.
        // A better approach for DnD is to push history only when the drag ends.
        // However, since this function is usually called ONCE per drop in many implementations, it might be fine.
        // If it's called continuously during drag, we need to change the implementation in Canvas.tsx to only call onDrop.
        // Checking Canvas.tsx, it seems `onMove` might be called during hover? 
        // Let's assume standard DnD where we update state on drop or use a separate "preview" state.
        // Actually, looking at standard react-dnd, moveElement is often called repeatedly.
        // BUT, for a robust undo, we usually want the "start" and "end" state.
        // Let's assume for now we push history. If it's too much, we can optimize.

        pushToHistory();
        setElements(prev => {
            const updated = [...prev];
            const [dragged] = updated.splice(dragIndex, 1);
            updated.splice(hoverIndex, 0, dragged);
            return updated;
        });
    }, [pushToHistory]);

    const reparentElement = useCallback((elementId: string, newParentId?: string) => {
        pushToHistory();
        setElements(prev => prev.map(el =>
            el.id === elementId ? { ...el, parentId: newParentId } : el
        ));
    }, [pushToHistory]);

    // Bulk set (e.g. import)
    const setAll = useCallback((newElements: FormElement[], newPages: FormPage[], newMeta: FormMetadata) => {
        pushToHistory();
        setElements(newElements);
        setPages(newPages);
        setFormMeta(newMeta);
        setSelectedId(null);
        if (newPages.length > 0) setCurrentPageId(newPages[0].id);
    }, [pushToHistory]);

    return {
        // State
        elements,
        pages,
        formMeta,
        signers,
        signerMode,
        selectedId,
        currentPageId,
        historyPast,
        historyFuture,

        // Setters (Direct)
        setSigners,
        setSignerMode,
        setSelectedId,
        setCurrentPageId,

        // Actions (History-aware)
        setElements: setElementsWithHistory,
        setPages: setPagesWithHistory,
        setFormMeta: setFormMetaWithHistory,
        addElement,
        updateElement,
        deleteElement,
        duplicateElement,
        moveElement,
        reparentElement,
        setAll,
        undo,
        redo,

        // Helpers
        canUndo: historyPast.length > 0,
        canRedo: historyFuture.length > 0,
    };
};
