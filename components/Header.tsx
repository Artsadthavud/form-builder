
import React, { useState } from 'react';
import { ViewMode, FormElement, FormValues } from '../types';
import AIGenerateModal from './AIGenerateModal';
import ImportDataModal from './ImportDataModal';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setElements: (elements: FormElement[]) => void;
  elements: FormElement[];
  setFormValues: (key: string, value: any) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode, setElements, elements, setFormValues }) => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-md w-full p-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h1 className="text-xl font-bold text-slate-800">AI Form Builder</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('design')}
              className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                viewMode === 'design' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-600'
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                viewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-600'
              }`}
            >
              Preview
            </button>
          </div>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
          >
            <SparklesIcon />
            Generate with AI
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-semibold"
          >
            <ImportIcon />
            Import Data
          </button>
        </div>
      </header>
      <AIGenerateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={setElements}
      />
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(data) => {
            Object.entries(data).forEach(([key, value]) => {
                setFormValues(key, value);
            });
            setViewMode('preview');
        }}
      />
    </>
  );
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 001.414 1.414L5 6.414V8a1 1 0 002 0V6.414l.293.293a1 1 0 001.414-1.414L7.414 4.586V3a1 1 0 00-1-1H5zM15 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L15 6.414V8a1 1 0 102 0V6.414l.293.293a1 1 0 001.414-1.414L17.414 4.586V3a1 1 0 00-1-1h-1zM5 12a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L5 16.414V18a1 1 0 102 0v-1.586l.293.293a1 1 0 101.414-1.414L7.414 14.586V13a1 1 0 00-1-1H5zM15 12a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L15 16.414V18a1 1 0 102 0v-1.586l.293.293a1 1 0 101.414-1.414L17.414 14.586V13a1 1 0 00-1-1h-1z" clipRule="evenodd" />
    </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export default Header;
