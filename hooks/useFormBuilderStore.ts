
import { useState, useMemo, useCallback } from 'react';
import { FormElement, FormFieldType, FormValues, ViewMode, FormElementOption } from '../types';

const useFormBuilderStore = () => {
  const [elements, setElements] = useState<FormElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [formValues, setFormValues] = useState<FormValues>({});

  const selectedElement = useMemo(() => {
    return elements.find(el => el.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

  const addElement = (type: FormFieldType) => {
    const newElement: FormElement = createNewElement(type);
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id: string, newProps: Partial<FormElement>) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, ...newProps } : el)));
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };
  
  const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
    setElements((prevElements) => {
        const newElements = [...prevElements];
        const [draggedItem] = newElements.splice(dragIndex, 1);
        newElements.splice(hoverIndex, 0, draggedItem);
        return newElements;
    });
  }, []);

  const updateFormValue = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  return {
    elements,
    setElements,
    selectedElement,
    setSelectedElementId,
    viewMode,
    setViewMode,
    formValues,
    setFormValues,
    updateFormValue,
    addElement,
    updateElement,
    removeElement,
    moveElement,
  };
};

const createNewElement = (type: FormFieldType): FormElement => {
    const base = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        width: 'w-full' as const,
        conditions: [],
    };

    switch (type) {
        case FormFieldType.TEXT:
        case FormFieldType.EMAIL:
        case FormFieldType.PASSWORD:
        case FormFieldType.NUMBER:
            return { ...base, type, placeholder: '', required: false };
        case FormFieldType.TEXTAREA:
            return { ...base, type, placeholder: '', required: false, rows: 3 };
        case FormFieldType.CHECKBOX:
            return { ...base, type, required: false };
        case FormFieldType.RADIO:
        case FormFieldType.SELECT:
            return {
                ...base,
                type,
                required: false,
                options: [
                    { id: 'opt1', label: 'Option 1', value: 'option1' },
                    { id: 'opt2', label: 'Option 2', value: 'option2' },
                ],
            };
        case FormFieldType.HEADING:
            return { ...base, type, text: 'Heading', level: 'h2', label: 'Heading' };
        case FormFieldType.PARAGRAPH:
            return { ...base, type, text: 'This is a paragraph of text.', label: 'Paragraph' };
        default:
            throw new Error(`Unknown form field type: ${type}`);
    }
};

export default useFormBuilderStore;
