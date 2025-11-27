import React, { useState, useEffect } from 'react';
import { FormTemplate, FormMetadata, TemplateCategory, HeaderFooterStyle, TranslatableText } from '../types';
import { getText } from '../utils/i18n';

const TEMPLATES_STORAGE_KEY = 'formflow_templates_v1';

// Built-in Header Templates
const builtInHeaderTemplates: FormTemplate[] = [
  {
    id: 'header_minimal',
    name: 'Minimal',
    description: 'Clean and simple header with centered text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_corporate_blue',
    name: 'Corporate Blue',
    description: 'Professional blue header with left-aligned text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      textAlignment: 'left',
    }
  },
  {
    id: 'header_gradient_purple',
    name: 'Gradient Purple',
    description: 'Modern gradient header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_dark',
    name: 'Dark Mode',
    description: 'Dark background with light text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_warm',
    name: 'Warm Orange',
    description: 'Friendly warm-toned header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#ea580c',
      textColor: '#ffffff',
      textAlignment: 'left',
    }
  },
  {
    id: 'header_nature',
    name: 'Nature Green',
    description: 'Fresh green header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#16a34a',
      textColor: '#ffffff',
      textAlignment: 'center',
    }
  },
];

// Built-in Footer Templates
const builtInFooterTemplates: FormTemplate[] = [
  {
    id: 'footer_minimal',
    name: 'Minimal',
    description: 'Simple footer with centered text',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#f8fafc',
      textColor: '#64748b',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_dark',
    name: 'Dark Footer',
    description: 'Dark background footer',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#1e293b',
      textColor: '#94a3b8',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_branded',
    name: 'Branded Blue',
    description: 'Blue branded footer',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#1e40af',
      textColor: '#bfdbfe',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_transparent',
    name: 'Transparent',
    description: 'No background, subtle text',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: 'transparent',
      textColor: '#94a3b8',
      textAlignment: 'center',
    }
  },
];

interface TemplateManagerProps {
  currentMetadata: FormMetadata;
  currentLanguage: string;
  onApplyHeader: (style: FormTemplate['headerStyle']) => void;
  onApplyFooter: (style: FormTemplate['footerStyle']) => void;
  onSaveAsTemplate: (name: string, category: TemplateCategory) => void;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentMetadata,
  currentLanguage,
  onApplyHeader,
  onApplyFooter,
  onSaveAsTemplate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');
  const [userTemplates, setUserTemplates] = useState<FormTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Load user templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      try {
        setUserTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, []);

  // Save user templates to localStorage
  const saveUserTemplates = (templates: FormTemplate[]) => {
    setUserTemplates(templates);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: FormTemplate = {
      id: `user_${activeTab}_${Date.now()}`,
      name: newTemplateName.trim(),
      category: activeTab,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      ...(activeTab === 'header' ? {
        headerStyle: {
          backgroundColor: currentMetadata.headerBackgroundColor,
          textColor: currentMetadata.headerTitleColor,
          textAlignment: currentMetadata.headerTextAlignment,
          logoUrl: currentMetadata.logoUrl,
          logoPlacement: currentMetadata.logoPlacement,
          logoAlignment: currentMetadata.logoAlignment,
          logoWidth: currentMetadata.logoWidth,
          title: currentMetadata.title,
          description: currentMetadata.description,
        }
      } : {
        footerStyle: {
          backgroundColor: currentMetadata.footerBackgroundColor,
          textColor: currentMetadata.footerTextColor,
          textAlignment: 'center',
          footerText: currentMetadata.footerText,
        }
      })
    };

    saveUserTemplates([...userTemplates, newTemplate]);
    setNewTemplateName('');
    setShowSaveModal(false);
  };

  const handleDeleteUserTemplate = (templateId: string) => {
    saveUserTemplates(userTemplates.filter(t => t.id !== templateId));
  };

  const allTemplates = activeTab === 'header' 
    ? [...builtInHeaderTemplates, ...userTemplates.filter(t => t.category === 'header')]
    : [...builtInFooterTemplates, ...userTemplates.filter(t => t.category === 'footer')];

  const renderPreview = (template: FormTemplate) => {
    const isHeader = template.category === 'header';
    const style = isHeader ? template.headerStyle : template.footerStyle;
    const bgColor = style?.backgroundColor || '#ffffff';
    const textColor = style?.textColor || '#000000';
    const textAlign = style?.textAlignment || 'center';
    const isGradient = bgColor.includes('gradient');

    return (
      <div 
        className="h-16 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ 
          background: bgColor,
          color: textColor,
        }}
      >
        <div style={{ textAlign: textAlign as any }} className="px-3 w-full">
          {isHeader ? (
            <>
              <div className="font-bold text-sm truncate">Form Title</div>
              <div className="text-xs opacity-75 truncate">Description text</div>
            </>
          ) : (
            <div className="text-xs truncate">Footer text here</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Template Manager</h2>
              <p className="text-violet-200 text-sm">Choose or save header/footer templates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('header')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'header'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              🎨 Header Templates
            </button>
            <button
              onClick={() => setActiveTab('footer')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'footer'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 Footer Templates
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Save Current Button */}
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-violet-900">Current {activeTab === 'header' ? 'Header' : 'Footer'}</h3>
                <p className="text-sm text-violet-700">Save your current design as a reusable template</p>
              </div>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save as Template
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allTemplates.map(template => (
              <div 
                key={template.id}
                className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-violet-400 hover:shadow-lg transition-all group"
              >
                {/* Preview */}
                <div className="p-3 bg-slate-50">
                  {renderPreview(template)}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{template.name}</h4>
                      {template.description && (
                        <p className="text-xs text-slate-500 truncate">{template.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {template.isBuiltIn ? (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">Built-in</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">Custom</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (activeTab === 'header') {
                          onApplyHeader(template.headerStyle);
                        } else {
                          onApplyFooter(template.footerStyle);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Apply
                    </button>
                    {!template.isBuiltIn && (
                      <button
                        onClick={() => handleDeleteUserTemplate(template.id)}
                        className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete template"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Save {activeTab === 'header' ? 'Header' : 'Footer'} Template
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., My Custom Header"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewTemplateName('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
