import { useState, useCallback, useRef, useEffect } from 'react';

interface UseUndoRedoOptions<T> {
  limit?: number;
  debounceMs?: number;
}

interface UseUndoRedoReturn<T> {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;
}

/**
 * Custom hook for undo/redo functionality with debounced snapshots
 */
export function useUndoRedo<T>(
  state: T,
  setState: (value: T) => void,
  options: UseUndoRedoOptions<T> = {}
): UseUndoRedoReturn<T> {
  const { limit = 50, debounceMs = 300 } = options;
  
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const lastSnapshotRef = useRef<T | null>(null);
  const isUndoRedoAction = useRef(false);

  // Debounced snapshot recording
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const lastJson = lastSnapshotRef.current ? JSON.stringify(lastSnapshotRef.current) : null;
      const curJson = JSON.stringify(state);
      
      if (lastJson === curJson) return;
      
      if (lastSnapshotRef.current !== null) {
        setPast(prev => {
          const next = [...prev, lastSnapshotRef.current as T];
          return next.length > limit ? next.slice(-limit) : next;
        });
      }
      
      setFuture([]);
      lastSnapshotRef.current = state;
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [state, limit, debounceMs]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    isUndoRedoAction.current = true;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    
    setPast(newPast);
    setFuture(prev => [state, ...prev].slice(0, limit));
    setState(previous);
    lastSnapshotRef.current = previous;
  }, [past, state, setState, limit]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    isUndoRedoAction.current = true;
    const next = future[0];
    const newFuture = future.slice(1);
    
    setFuture(newFuture);
    setPast(prev => [...prev, state].slice(-limit));
    setState(next);
    lastSnapshotRef.current = next;
  }, [future, state, setState, limit]);

  const takeSnapshot = useCallback(() => {
    if (lastSnapshotRef.current !== null) {
      setPast(prev => {
        const next = [...prev, lastSnapshotRef.current as T];
        return next.length > limit ? next.slice(-limit) : next;
      });
    }
    setFuture([]);
    lastSnapshotRef.current = state;
  }, [state, limit]);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    takeSnapshot
  };
}

/**
 * Hook for keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 */
export function useUndoRedoKeyboard(
  undo: () => void,
  redo: () => void,
  canUndo: boolean,
  canRedo: boolean
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrMeta && !e.shiftKey && key === 'z' && canUndo) {
        e.preventDefault();
        undo();
      }

      if ((ctrlOrMeta && key === 'y') || (ctrlOrMeta && e.shiftKey && key === 'z')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, canUndo, canRedo]);
}
