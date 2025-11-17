
import React, { useState } from 'react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, any>) => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonData, setJsonData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonData);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Invalid JSON data. Must be a JSON object.');
      }
      onImport(data);
      onClose();
      setJsonData('');
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Import Form Data</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Paste a JSON object where keys match the Field IDs of your form elements. This will pre-fill the form in Preview mode.
        </p>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder={`{\n  "text-12345": "John Doe",\n  "email-67890": "john.doe@example.com"\n}`}
          className="w-full p-2 border border-slate-300 rounded-md h-48 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Import and Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
