
import React, { useState, useCallback } from 'react';
import { FormElement, ViewMode } from './types';
import Header from './components/Header';
import ElementPalette from './components/ElementPalette';
import FormCanvas from './components/FormCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useFormBuilderStore from './hooks/useFormBuilderStore';

export default function App() {
  const {
    elements,
    selectedElement,
    viewMode,
    formValues,
    setElements,
    setSelectedElementId,
    setViewMode,
    updateFormValue,
    addElement,
    updateElement,
    removeElement,
    moveElement,
  } = useFormBuilderStore();

  const handleSelectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, [setSelectedElementId]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-slate-100 font-sans">
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          setElements={setElements}
          elements={elements}
          setFormValues={updateFormValue}
        />
        <main className="flex flex-1 overflow-hidden">
          {viewMode === 'design' && <ElementPalette onAddElement={addElement} />}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <FormCanvas
              elements={elements}
              selectedElementId={selectedElement?.id ?? null}
              onSelectElement={handleSelectElement}
              viewMode={viewMode}
              formValues={formValues}
              onFormValueChange={updateFormValue}
              onMoveElement={moveElement}
            />
          </div>
          {viewMode === 'design' && selectedElement && (
            <PropertiesPanel
              element={selectedElement}
              onUpdate={updateElement}
              onRemove={removeElement}
              allElements={elements}
            />
          )}
        </main>
      </div>
    </DndProvider>
  );
}
