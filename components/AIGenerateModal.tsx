
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { FormElement } from '../types';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (elements: FormElement[]) => void;
}

const formElementSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: 'A unique identifier for the form element, e.g., "text-162987-a3b4c5d6".' },
        type: { type: Type.STRING, description: 'The type of the form field. Must be one of: text, textarea, email, password, number, checkbox, radio, select, heading, paragraph.' },
        label: { type: Type.STRING, description: 'The display label for the form field.' },
        width: { type: Type.STRING, description: 'The Tailwind CSS width class. Must be one of: "w-full", "w-1/2", "w-1/3", "w-2/3". Default is "w-full".' },
        placeholder: { type: Type.STRING, description: 'Placeholder text for input fields (optional).' },
        required: { type: Type.BOOLEAN, description: 'Whether the field is required (optional).' },
        rows: { type: Type.INTEGER, description: 'Number of rows for a textarea (optional).' },
        options: {
            type: Type.ARRAY,
            description: 'Array of options for radio or select fields (optional).',
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: 'Unique ID for the option.' },
                    label: { type: Type.STRING, description: 'Display label for the option.' },
                    value: { type: Type.STRING, description: 'The value of the option.' },
                },
            },
        },
        text: { type: Type.STRING, description: 'The text content for heading or paragraph elements (optional).' },
        level: { type: Type.STRING, description: 'The heading level for heading elements, e.g., "h1", "h2" (optional).' },
        conditions: {
            type: Type.ARRAY,
            description: "An array of conditional logic rules for this element. This is an advanced feature and should usually be an empty array.",
            items: { type: Type.OBJECT, properties: {} }
        }
    },
};

const aiResponseSchema = {
    type: Type.ARRAY,
    items: formElementSchema,
};

const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your form.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following description, generate a JSON array of form field objects. Each object must strictly follow the provided schema. Generate unique IDs for each element and option. For fields like radio or select, provide sensible default options. Description: "${prompt}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: aiResponseSchema,
        },
      });

      const jsonText = response.text.trim();
      const generatedElements = JSON.parse(jsonText) as FormElement[];
      onGenerate(generatedElements);
      onClose();
      setPrompt('');
    } catch (e: any) {
      console.error('Error generating form with AI:', e);
      setError(`Failed to generate form. Please try again. Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Generate Form with AI</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Describe the form you want to create. For example, "A contact form with fields for name, email, subject, and a message."
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A user registration form with username, email, password, and confirm password fields."
          className="w-full p-2 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center" disabled={isLoading}>
            {isLoading && <Spinner />}
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default AIGenerateModal;
