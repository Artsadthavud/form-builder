import { useEffect, useRef, useCallback } from 'react';

interface UseAutosaveOptions {
  key: string;
  delay?: number;
  enabled?: boolean;
  onSave?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for auto-saving data to localStorage with debounce
 */
export function useAutosave<T>(
  data: T,
  options: UseAutosaveOptions
): { save: () => void; load: () => T | null; clear: () => void } {
  const { key, delay = 1200, enabled = true, onSave, onError } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        onSave?.();
      } catch (e) {
        console.error('Autosave failed:', e);
        onError?.(e as Error);
      }
    }, delay);

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
  }, [key]);

  return { save, load, clear };
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
