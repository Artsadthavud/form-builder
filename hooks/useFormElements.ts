import { useState, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { FormElement, ElementType, Language, TranslatableText } from '../types';

interface UseFormElementsOptions {
  currentPageId: string;
  currentLanguage: Language;
  onSelect?: (id: string | null) => void;
}

interface UseFormElementsReturn {
  elements: FormElement[];
  setElements: Dispatch<SetStateAction<FormElement[]>>;
  pageElements: FormElement[];
  selectedElement: FormElement | undefined;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addElement: (type: ElementType, opts?: AddElementOptions) => void;
  updateElement: (updated: FormElement) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  reparentElement: (elementId: string, newParentId?: string) => void;
}

interface AddElementOptions {
  parentId?: string;
  insertAfterId?: string;
  insertIndex?: number;
}

const DEFAULT_LABELS: Record<string, TranslatableText> = {
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

/**
 * Custom hook for managing form elements with optimized operations
 */
export function useFormElements(
  initialElements: FormElement[],
  options: UseFormElementsOptions
): UseFormElementsReturn {
  const { currentPageId, currentLanguage } = options;
  
  const [elements, setElements] = useState<FormElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Memoized filtered elements for current page
  const pageElements = useMemo(
    () => elements.filter(el => el.pageId === currentPageId),
    [elements, currentPageId]
  );

  // Memoized selected element
  const selectedElement = useMemo(
    () => elements.find(el => el.id === selectedId),
    [elements, selectedId]
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

  // Add new element
  const addElement = useCallback((type: ElementType, opts?: AddElementOptions) => {
    const newElement: FormElement = {
      id: generateId(type),
      type,
      label: DEFAULT_LABELS[type] || { th: 'ใหม่', en: 'New' },
      placeholder: ['text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'phone_otp', 'email_otp'].includes(type)
        ? type === 'email' || type === 'email_otp'
          ? { th: 'example@email.com', en: 'example@email.com' }
          : type === 'phone' || type === 'phone_otp'
          ? { th: '0812345678', en: '0812345678' }
          : { th: 'กรอกค่า...', en: 'Enter value...' }
        : undefined,
      required: false,
      width: '100',
      options: (type === 'radio' || type === 'checkbox' || type === 'select')
        ? [
            { id: 'opt_1', label: { th: 'ตัวเลือก 1', en: 'Option 1' }, value: 'option_1' },
            { id: 'opt_2', label: { th: 'ตัวเลือก 2', en: 'Option 2' }, value: 'option_2' }
          ]
        : undefined,
      imageWidth: 100,
      imageAlign: 'center',
      signatureHeight: 150,
      content: type === 'paragraph' ? { th: 'กรอกเนื้อหาข้อความที่นี่', en: 'Enter your text content here.' } : undefined,
      ratingMax: 5,
      pageId: currentPageId,
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

    // Determine page ID based on parent
    if (opts?.parentId) {
      const parent = elements.find(e => e.id === opts.parentId);
      newElement.pageId = parent?.pageId || currentPageId;
    } else if (opts?.insertAfterId) {
      const after = elements.find(e => e.id === opts.insertAfterId);
      newElement.pageId = after?.pageId || currentPageId;
    }

    setElements(prev => {
      // Handle parent insertion
      if (opts?.parentId) {
        newElement.parentId = opts.parentId;
        
        if (typeof opts.insertIndex === 'number') {
          const updated = [...prev];
          updated.splice(opts.insertIndex, 0, newElement);
          return updated;
        }

        const lastChildIndex = prev
          .map((el, idx) => ({ el, idx }))
          .filter(({ el }) => el.parentId === opts.parentId)
          .map(({ idx }) => idx)
          .pop();

        if (typeof lastChildIndex !== 'undefined') {
          const updated = [...prev];
          updated.splice(lastChildIndex + 1, 0, newElement);
          return updated;
        }

        const parentIndex = prev.findIndex(e => e.id === opts.parentId);
        const updated = [...prev];
        updated.splice(parentIndex + 1, 0, newElement);
        return updated;
      }

      // Handle insert after
      if (opts?.insertAfterId) {
        newElement.parentId = prev.find(e => e.id === opts.insertAfterId)?.parentId;
        const idx = prev.findIndex(e => e.id === opts.insertAfterId);
        const updated = [...prev];
        updated.splice(idx + 1, 0, newElement);
        return updated;
      }

      // Handle selected element context
      if (selectedId) {
        const selected = prev.find(e => e.id === selectedId);
        if (selected) {
          if (selected.type === 'section') {
            newElement.parentId = selected.id;
            const lastChildIndex = prev
              .map((el, idx) => ({ el, idx }))
              .filter(({ el }) => el.parentId === selected.id)
              .map(({ idx }) => idx)
              .pop();

            if (typeof lastChildIndex !== 'undefined') {
              const updated = [...prev];
              updated.splice(lastChildIndex + 1, 0, newElement);
              return updated;
            }

            const sectionIndex = prev.findIndex(e => e.id === selected.id);
            const updated = [...prev];
            updated.splice(sectionIndex + 1, 0, newElement);
            return updated;
          }

          newElement.parentId = selected.parentId;
          const selIndex = prev.findIndex(e => e.id === selected.id);
          const updated = [...prev];
          updated.splice(selIndex + 1, 0, newElement);
          return updated;
        }
      }

      return [...prev, newElement];
    });

    setSelectedId(newElement.id);
  }, [elements, currentPageId, selectedId, generateId]);

  // Update element
  const updateElement = useCallback((updated: FormElement) => {
    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
  }, []);

  // Delete element (and children if section)
  const deleteElement = useCallback((id: string) => {
    const idsToDelete = new Set<string>([id]);

    const findChildren = (parentId: string, allElements: FormElement[]) => {
      allElements.forEach(el => {
        if (el.parentId === parentId) {
          idsToDelete.add(el.id);
          if (el.type === 'section') {
            findChildren(el.id, allElements);
          }
        }
      });
    };

    setElements(prev => {
      findChildren(id, prev);
      return prev.filter(el => !idsToDelete.has(el.id));
    });

    if (selectedId && idsToDelete.has(selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // Duplicate element
  const duplicateElement = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(e => e.id === id);
      if (!element) return prev;

      const timestamp = Date.now();
      const newId = `${element.type}_${timestamp}`;

      const duplicated: FormElement = {
        ...element,
        id: newId,
        label: typeof element.label === 'string'
          ? `${element.label} (Copy)`
          : { ...element.label, th: `${element.label.th} (สำเนา)`, en: `${element.label.en} (Copy)` }
      };

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

        const insertIdx = lastChildIdx + 1;
        const updated = [...prev];
        updated.splice(insertIdx, 0, duplicated, ...newChildren);
        return updated;
      }

      const idx = prev.findIndex(e => e.id === id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, duplicated);
      return updated;
    });
  }, []);

  // Move element (drag & drop)
  const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
    setElements(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      return updated;
    });
  }, []);

  // Reparent element
  const reparentElement = useCallback((elementId: string, newParentId?: string) => {
    if (elementId === newParentId) return;

    setElements(prev => {
      // Check for circular dependency
      let current = prev.find(e => e.id === newParentId);
      while (current) {
        if (current.id === elementId) return prev;
        if (!current.parentId) break;
        current = prev.find(e => e.id === current?.parentId);
      }

      return prev.map(el =>
        el.id === elementId ? { ...el, parentId: newParentId } : el
      );
    });
  }, []);

  return {
    elements,
    setElements,
    pageElements,
    selectedElement,
    selectedId,
    setSelectedId,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    reparentElement
  };
}
