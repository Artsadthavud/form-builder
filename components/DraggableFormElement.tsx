
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FormElement, ViewMode, FormValues } from '../types';
import RenderedElement from './RenderedElement';
import { evaluateConditions } from '../utils/conditions';

const ItemTypes = {
  FORMELEMENT: 'formelement',
};

interface DraggableFormElementProps {
  element: FormElement;
  index: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  viewMode: ViewMode;
  formValues: FormValues;
  onFormValueChange: (id: string, value: any) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
  allElements: FormElement[];
}

const DraggableFormElement: React.FC<DraggableFormElementProps> = ({
  element,
  index,
  selectedElementId,
  onSelectElement,
  viewMode,
  formValues,
  onFormValueChange,
  onMoveElement,
  allElements,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.FORMELEMENT,
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }
      onMoveElement(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FORMELEMENT,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: viewMode === 'design',
  });

  drag(drop(ref));

  const isSelected = selectedElementId === element.id;
  const isVisible = viewMode === 'design' || evaluateConditions(element, formValues).visible;
  const isDisabled = viewMode !== 'design' && !evaluateConditions(element, formValues).enabled;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`relative p-2 rounded-md transition-all duration-200 ${
        isSelected && viewMode === 'design' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${viewMode === 'design' ? 'cursor-move' : ''}`}
      onClick={(e) => {
        if (viewMode === 'design') {
          e.stopPropagation();
          onSelectElement(element.id);
        }
      }}
    >
      {viewMode === 'design' && isSelected && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
          {element.type}
        </div>
      )}
      <RenderedElement
        element={element}
        value={formValues[element.id] ?? ''}
        onChange={(value) => onFormValueChange(element.id, value)}
        isPreview={viewMode === 'preview'}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default DraggableFormElement;
