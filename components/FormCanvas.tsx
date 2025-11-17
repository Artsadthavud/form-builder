
import React from 'react';
import { FormElement, ViewMode, FormValues } from '../types';
import DraggableFormElement from './DraggableFormElement';

interface FormCanvasProps {
  elements: FormElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  viewMode: ViewMode;
  formValues: FormValues;
  onFormValueChange: (id: string, value: any) => void;
  onMoveElement: (dragIndex: number, hoverIndex: number) => void;
}

const FormCanvas: React.FC<FormCanvasProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  viewMode,
  formValues,
  onFormValueChange,
  onMoveElement,
}) => {
  return (
    <div
      className="bg-white p-6 md:p-10 rounded-lg shadow-lg max-w-4xl mx-auto min-h-full"
      onClick={viewMode === 'design' ? () => onSelectElement(null) : undefined}
    >
      <div className="grid grid-cols-1 gap-6">
        {elements.length === 0 ? (
          <div className="text-center text-slate-500 py-20 border-2 border-dashed border-slate-300 rounded-lg">
            <h3 className="text-lg font-medium">Form Canvas</h3>
            <p className="mt-2 text-sm">
              {viewMode === 'design'
                ? 'Add elements from the left panel to start building your form.'
                : 'No elements to display in preview mode.'}
            </p>
          </div>
        ) : (
          elements.map((element, index) => (
            <DraggableFormElement
              key={element.id}
              index={index}
              element={element}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              viewMode={viewMode}
              formValues={formValues}
              onFormValueChange={onFormValueChange}
              onMoveElement={onMoveElement}
              allElements={elements}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FormCanvas;
