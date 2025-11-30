import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave, useAutoSaveToParent } from '../hooks/useAutosave';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAutosave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save data to localStorage after delay', async () => {
    const testData = { name: 'Test Form', elements: [] };
    const testKey = 'test_autosave_key';

    const { result } = renderHook(() =>
      useAutosave(testData, { key: testKey, enabled: true, delay: 1000 })
    );

    // Initially not dirty
    expect(result.current.isDirty).toBe(false);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should not save when disabled', () => {
    const testData = { name: 'Test Form' };

    renderHook(() =>
      useAutosave(testData, { key: 'test_key', enabled: false, delay: 1000 })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should detect changes with hash comparison', () => {
    const initialData = { name: 'Form 1' };
    const testKey = 'test_hash_key';

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave(data, { key: testKey, enabled: true, delay: 500 }),
      { initialProps: { data: initialData } }
    );

    // Update with new data
    rerender({ data: { name: 'Form 2' } });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isDirty).toBe(false); // Should be saved and clean
  });
});

describe('useAutoSaveToParent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onSave callback after delay', () => {
    const onSave = vi.fn();
    const testData = { name: 'Test', metadata: {}, elements: [], pages: [] };

    renderHook(() =>
      useAutoSaveToParent(testData, onSave, { enabled: true, delay: 1000 })
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).toHaveBeenCalledWith(testData);
  });

  it('should not call onSave when disabled', () => {
    const onSave = vi.fn();
    const testData = { name: 'Test' };

    renderHook(() =>
      useAutoSaveToParent(testData, onSave, { enabled: false, delay: 1000 })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should debounce rapid changes', () => {
    const onSave = vi.fn();

    const { rerender } = renderHook(
      ({ data }) => useAutoSaveToParent(data, onSave, { enabled: true, delay: 500 }),
      { initialProps: { data: { name: 'v1' } } }
    );

    // Rapid changes
    rerender({ data: { name: 'v2' } });
    act(() => vi.advanceTimersByTime(100));

    rerender({ data: { name: 'v3' } });
    act(() => vi.advanceTimersByTime(100));

    rerender({ data: { name: 'v4' } });
    act(() => vi.advanceTimersByTime(100));

    // Should not have called yet (still debouncing)
    expect(onSave).not.toHaveBeenCalled();

    // Wait for debounce to finish
    act(() => vi.advanceTimersByTime(600));

    // Should only be called once with the last value
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: 'v4' });
  });
});
