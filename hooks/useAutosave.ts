import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutosaveOptions {
  key: string;
  delay?: number;
  enabled?: boolean;
  onSave?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Simple hash function for quick comparison (djb2 algorithm)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Custom hook for auto-saving data to localStorage with debounce
 * Uses dirty flag and hash comparison for better performance
 */
export function useAutosave<T>(
  data: T,
  options: UseAutosaveOptions
): { save: () => void; load: () => T | null; clear: () => void; isDirty: boolean } {
  const { key, delay = 1200, enabled = true, onSave, onError } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedHashRef = useRef<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save effect with hash comparison
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const jsonData = JSON.stringify(data);
        const currentHash = hashString(jsonData);
        
        // Skip save if data hasn't changed
        if (lastSavedHashRef.current === currentHash) {
          return;
        }
        
        localStorage.setItem(key, jsonData);
        lastSavedHashRef.current = currentHash;
        setIsDirty(false);
        onSave?.();
      } catch (e) {
        console.error('Autosave failed:', e);
        onError?.(e as Error);
      }
    }, delay);

    // Mark as dirty when data changes
    const jsonData = JSON.stringify(data);
    const currentHash = hashString(jsonData);
    if (lastSavedHashRef.current !== null && lastSavedHashRef.current !== currentHash) {
      setIsDirty(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, key, delay, enabled, onSave, onError]);

  // Manual save
  const save = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      onSave?.();
    } catch (e) {
      console.error('Save failed:', e);
      onError?.(e as Error);
    }
  }, [data, key, onSave, onError]);

  // Load from storage
  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }, [key]);

  // Clear storage
  const clear = useCallback(() => {
    localStorage.removeItem(key);
    lastSavedHashRef.current = null;
    setIsDirty(false);
  }, [key]);

  return { save, load, clear, isDirty };
}

/**
 * Hook for saving form data to parent component with debounce
 */
export function useAutoSaveToParent<T>(
  data: T,
  onSave: (data: T) => void,
  options: { delay?: number; enabled?: boolean } = {}
) {
  const { delay = 1000, enabled = true } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSave(data);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);
}
