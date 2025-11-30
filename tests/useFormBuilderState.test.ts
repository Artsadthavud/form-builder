import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormBuilderState } from '../hooks/useFormBuilderState';
import { FormElement, FormPage, FormMetadata } from '../types';

describe('useFormBuilderState', () => {
  const mockInitialForm = {
    elements: [
      { id: 'text_1', type: 'text' as const, label: 'Name', required: true, pageId: 'page_1' },
      { id: 'email_1', type: 'email' as const, label: 'Email', required: false, pageId: 'page_1' },
    ] as FormElement[],
    pages: [{ id: 'page_1', label: 'Page 1' }] as FormPage[],
    metadata: { title: 'Test Form' } as FormMetadata,
    signers: [],
    signerMode: 'single' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided form data', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    expect(result.current.elements).toHaveLength(2);
    expect(result.current.pages).toHaveLength(1);
    expect(result.current.formMeta.title).toBe('Test Form');
    expect(result.current.selectedId).toBeNull();
  });

  it('should add new element', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    const newElement: FormElement = {
      id: 'number_1',
      type: 'number',
      label: 'Age',
      required: false,
      pageId: 'page_1',
    };

    act(() => {
      result.current.addElement(newElement);
    });

    expect(result.current.elements).toHaveLength(3);
    expect(result.current.selectedId).toBe('number_1');
  });

  it('should update element', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    act(() => {
      result.current.updateElement({
        ...result.current.elements[0],
        label: 'Updated Name',
      });
    });

    expect(result.current.elements[0].label).toBe('Updated Name');
  });

  it('should delete element', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    act(() => {
      result.current.deleteElement('text_1');
    });

    expect(result.current.elements).toHaveLength(1);
    expect(result.current.elements[0].id).toBe('email_1');
  });

  it('should delete element and clear selection if selected', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    act(() => {
      result.current.setSelectedId('text_1');
    });

    expect(result.current.selectedId).toBe('text_1');

    act(() => {
      result.current.deleteElement('text_1');
    });

    expect(result.current.selectedId).toBeNull();
  });

  it('should duplicate element', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    act(() => {
      result.current.duplicateElement('text_1');
    });

    expect(result.current.elements).toHaveLength(3);
    // New element should be selected
    expect(result.current.selectedId).not.toBe('text_1');
    expect(result.current.selectedId).not.toBeNull();
  });

  it('should move element', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    act(() => {
      result.current.moveElement(0, 1);
    });

    expect(result.current.elements[0].id).toBe('email_1');
    expect(result.current.elements[1].id).toBe('text_1');
  });

  it('should support undo/redo', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    // Initially no history
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // Make a change
    act(() => {
      result.current.updateElement({
        ...result.current.elements[0],
        label: 'Changed Name',
      });
    });

    expect(result.current.elements[0].label).toBe('Changed Name');
    expect(result.current.canUndo).toBe(true);

    // Undo
    act(() => {
      result.current.undo();
    });

    expect(result.current.elements[0].label).toBe('Name');
    expect(result.current.canRedo).toBe(true);

    // Redo
    act(() => {
      result.current.redo();
    });

    expect(result.current.elements[0].label).toBe('Changed Name');
  });

  it('should set all at once', () => {
    const { result } = renderHook(() =>
      useFormBuilderState({ initialForm: mockInitialForm })
    );

    const newElements: FormElement[] = [
      { id: 'new_1', type: 'text', label: 'New', required: true, pageId: 'page_2' },
    ];
    const newPages: FormPage[] = [{ id: 'page_2', label: 'Page 2' }];
    const newMeta: FormMetadata = { title: 'New Form' };

    act(() => {
      result.current.setAll(newElements, newPages, newMeta);
    });

    expect(result.current.elements).toEqual(newElements);
    expect(result.current.pages).toEqual(newPages);
    expect(result.current.formMeta).toEqual(newMeta);
    expect(result.current.selectedId).toBeNull();
  });
});
