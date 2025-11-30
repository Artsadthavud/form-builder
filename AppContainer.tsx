import React, { useState, useEffect } from 'react';
import { FormProject, FormResponse, FormStatus, SignerMode, Signer } from './types';
import FormList from './components/FormList';
import ResponseManager from './components/ResponseManager';
import FormBuilder from './FormBuilder';
import PublicForm from './components/PublicForm';
import RevisionHistory from './components/RevisionHistory';
import FormSettingsModal from './components/FormSettingsModal';
import ErrorBoundary from './components/ErrorBoundary';

type View = 'list' | 'builder' | 'responses' | 'submit' | 'revisions';

const FORMS_STORAGE_KEY = 'formflow_forms_v1';
const RESPONSES_STORAGE_KEY = 'formflow_responses_v1';
const REVISIONS_STORAGE_KEY = 'formflow_revisions_v1';

const AppContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [forms, setForms] = useState<FormProject[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Record<string, any[]>>({});
  const [settingsFormId, setSettingsFormId] = useState<string | null>(null);
  const [isCreatingNewForm, setIsCreatingNewForm] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedForms = localStorage.getItem(FORMS_STORAGE_KEY);
      if (savedForms) {
        setForms(JSON.parse(savedForms));
      }
      const savedResponses = localStorage.getItem(RESPONSES_STORAGE_KEY);
      if (savedResponses) {
        setResponses(JSON.parse(savedResponses));
      }
      const savedRevisions = localStorage.getItem(REVISIONS_STORAGE_KEY);
      if (savedRevisions) {
        setRevisions(JSON.parse(savedRevisions));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Save forms to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
    } catch (error) {
      console.error('Failed to save forms:', error);
    }
  }, [forms]);

  // Save responses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
    } catch (error) {
      console.error('Failed to save responses:', error);
    }
  }, [responses]);

  // Save revisions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(revisions));
    } catch (error) {
      console.error('Failed to save revisions:', error);
    }
  }, [revisions]);

  const createNewForm = () => {
    // Open settings modal for new form
    setIsCreatingNewForm(true);
  };

  const saveNewForm = (settings: {
    name: string;
    codeName?: string;
    site?: string;
    description?: string;
    tags?: string[];
  }) => {
    const newForm: FormProject = {
      id: `form_${Date.now()}`,
      name: settings.name,
      codeName: settings.codeName,
      site: settings.site,
      description: settings.description,
      tags: settings.tags,
      status: 'draft',
      metadata: {
        title: { th: settings.name, en: settings.name },
        description: { th: settings.description || 'กรุณากรอกข้อมูลในฟอร์มด้านล่าง', en: settings.description || 'Please fill out the form below.' },
        logoUrl: '',
        footerText: { th: '© 2024 FormFlow Builder', en: '© 2024 FormFlow Builder' },
        headerBackgroundColor: '#ffffff',
        headerTitleColor: '#1e293b',
        logoPlacement: 'top',
        logoAlignment: 'center',
        headerTextAlignment: 'center',
        logoWidth: 25,
        footerBackgroundColor: '#ffffff',
        footerTextColor: '#64748b',
        defaultLanguage: 'th',
        availableLanguages: ['th', 'en']
      },
      elements: [],
      pages: [{ id: 'page_1', label: 'Page 1' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      submissionCount: 0
    };
    setForms([...forms, newForm]);
    setCurrentFormId(newForm.id);
    setIsCreatingNewForm(false);
    setCurrentView('builder');
  };

  const editForm = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('builder');
  };

  const deleteForm = (formId: string) => {
    setForms(forms.filter(f => f.id !== formId));
    // Also delete related responses
    setResponses(responses.filter(r => r.formId !== formId));
  };

  const duplicateForm = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const newForm: FormProject = {
      ...form,
      id: `form_${Date.now()}`,
      name: `${form.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      publishedAt: undefined,
      shareUrl: undefined,
      submissionCount: 0
    };
    setForms([...forms, newForm]);
  };

  const changeFormStatus = (formId: string, status: FormStatus) => {
    const form = forms.find(f => f.id === formId);
    if (!form) return;

    // Save revision when publishing
    if (status === 'published') {
      const revision = {
        id: `revision_${Date.now()}`,
        version: form.version,
        name: form.name,
        metadata: form.metadata,
        elements: form.elements,
        pages: form.pages,
        createdAt: new Date().toISOString(),
        description: `Published version v${form.version}`
      };

      setRevisions(prev => ({
        ...prev,
        [formId]: [...(prev[formId] || []), revision]
      }));
    }

    setForms(forms.map(f => {
      if (f.id !== formId) return f;
      const updated = { ...f, status, updatedAt: new Date().toISOString() };
      if (status === 'published' && !f.publishedAt) {
        updated.publishedAt = new Date().toISOString();
        updated.shareUrl = `${window.location.origin}/form/${formId}`;
        updated.version = f.version + 1;
      }
      return updated;
    }));
  };

  const saveForm = (formId: string, data: { 
    name: string;
    metadata: any; 
    elements: any[]; 
    pages: any[];
    signers?: Signer[];
    signerMode?: SignerMode;
  }) => {
    setForms(forms.map(f => 
      f.id === formId 
        ? { 
            ...f, 
            name: data.name,
            metadata: data.metadata,
            elements: data.elements, 
            pages: data.pages,
            signers: data.signers,
            signerMode: data.signerMode,
            updatedAt: new Date().toISOString()
          }
        : f
    ));
  };

  const saveFormSettings = (formId: string, settings: {
    name: string;
    codeName?: string;
    site?: string;
    description?: string;
    tags?: string[];
    signers?: Signer[];
    signerMode?: SignerMode;
  }) => {
    setForms(forms.map(f => 
      f.id === formId 
        ? { 
            ...f, 
            name: settings.name,
            codeName: settings.codeName,
            site: settings.site,
            description: settings.description,
            tags: settings.tags,
            signers: settings.signers,
            signerMode: settings.signerMode,
            updatedAt: new Date().toISOString()
          }
        : f
    ));
  };

  const saveFormAsRevision = (formId: string, data: { 
    name: string;
    metadata: any; 
    elements: any[]; 
    pages: any[]; 
  }) => {
    const currentForm = forms.find(f => f.id === formId);
    if (!currentForm) return;

    // Save current version as revision
    const revision = {
      id: `revision_${Date.now()}`,
      version: currentForm.version,
      name: currentForm.name,
      metadata: currentForm.metadata,
      elements: currentForm.elements,
      pages: currentForm.pages,
      createdAt: new Date().toISOString(),
      description: `Manual save v${currentForm.version}`
    };

    setRevisions(prev => ({
      ...prev,
      [formId]: [...(prev[formId] || []), revision]
    }));

    // Then update the form
    setForms(forms.map(f => 
      f.id === formId 
        ? { 
            ...f, 
            name: data.name,
            metadata: data.metadata,
            elements: data.elements, 
            pages: data.pages,
            updatedAt: new Date().toISOString(),
            version: f.version + 1
          }
        : f
    ));
  };

  const restoreRevision = (formId: string, revisionId: string) => {
    const formRevisions = revisions[formId];
    if (!formRevisions) return;

    const revision = formRevisions.find(r => r.id === revisionId);
    if (!revision) return;

    // Save current state as revision before restoring
    const currentForm = forms.find(f => f.id === formId);
    if (currentForm) {
      const currentRevision = {
        id: `revision_${Date.now()}`,
        version: currentForm.version,
        name: currentForm.name,
        metadata: currentForm.metadata,
        elements: currentForm.elements,
        pages: currentForm.pages,
        createdAt: new Date().toISOString(),
        description: `Backup before restore to v${revision.version}`
      };

      setRevisions(prev => ({
        ...prev,
        [formId]: [...(prev[formId] || []), currentRevision]
      }));
    }

    // Restore the selected revision
    setForms(forms.map(f => 
      f.id === formId 
        ? {
            ...f,
            name: revision.name,
            metadata: revision.metadata,
            elements: revision.elements,
            pages: revision.pages,
            updatedAt: new Date().toISOString(),
            version: f.version + 1
          }
        : f
    ));
  };

  const deleteRevision = (formId: string, revisionId: string) => {
    setRevisions(prev => ({
      ...prev,
      [formId]: (prev[formId] || []).filter(r => r.id !== revisionId)
    }));
  };

  const viewResponses = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('responses');
  };

  const submitResponse = (formId: string, responseData: Omit<FormResponse, 'id' | 'submittedAt'>) => {
    const newResponse: FormResponse = {
      ...responseData,
      id: `response_${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    setResponses([...responses, newResponse]);
    
    // Update submission count
    setForms(forms.map(f => 
      f.id === formId 
        ? { ...f, submissionCount: (f.submissionCount || 0) + 1 }
        : f
    ));
  };

  const exportCSV = () => {
    if (!currentFormId) return;
    
    const form = forms.find(f => f.id === currentFormId);
    const formResponses = responses.filter(r => r.formId === currentFormId);
    
    if (!form || formResponses.length === 0) return;

    // Create CSV content
    const headers = ['ID', 'วันที่ส่ง', 'เวลาที่ใช้', ...form.elements.filter(el => 
      !['section', 'paragraph', 'image'].includes(el.type)
    ).map(el => typeof el.label === 'string' ? el.label : el.label.th)];
    
    const rows = formResponses.map(response => [
      response.id,
      new Date(response.submittedAt).toLocaleString('th-TH'),
      response.completionTime ? `${response.completionTime}s` : '-',
      ...form.elements.filter(el => 
        !['section', 'paragraph', 'image'].includes(el.type)
      ).map(el => {
        const value = response.data[el.id];
        if (Array.isArray(value)) return value.join('; ');
        if (typeof value === 'string' && value.startsWith('data:image')) return '[Signature]';
        return value || '-';
      })
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form.name}_responses_${Date.now()}.csv`;
    link.click();
  };

  const currentForm = currentFormId ? forms.find(f => f.id === currentFormId) : null;
  const currentFormResponses = currentFormId ? responses.filter(r => r.formId === currentFormId) : [];
  const currentFormRevisions = currentFormId ? (revisions[currentFormId] || []) : [];

  return (
    <>
      {currentView === 'list' && (
        <FormList
          forms={forms}
          onCreate={createNewForm}
          onEdit={editForm}
          onDelete={deleteForm}
          onDuplicate={duplicateForm}
          onStatusChange={changeFormStatus}
          onOpenPublicForm={(formId) => {
            setCurrentFormId(formId);
            setCurrentView('submit');
          }}
          onOpenSettings={(formId) => setSettingsFormId(formId)}
        />
      )}

      {currentView === 'builder' && currentForm && (
        <FormBuilder
          form={currentForm}
          onSave={(data) => saveForm(currentForm.id, data)}
          onSaveSettings={(settings) => saveFormSettings(currentForm.id, settings)}
          onBack={() => setCurrentView('list')}
          onViewResponses={() => viewResponses(currentForm.id)}
          onViewRevisions={() => setCurrentView('revisions')}
        />
      )}

      {currentView === 'responses' && currentForm && (
        <ResponseManager
          form={currentForm}
          responses={currentFormResponses}
          onBack={() => setCurrentView('list')}
          onExportCSV={exportCSV}
        />
      )}

      {currentView === 'revisions' && currentForm && (
        <RevisionHistory
          form={currentForm}
          revisions={currentFormRevisions}
          onRestore={(revisionId) => restoreRevision(currentForm.id, revisionId)}
          onDelete={(revisionId) => deleteRevision(currentForm.id, revisionId)}
          onClose={() => setCurrentView('builder')}
        />
      )}

      {currentView === 'submit' && currentFormId && (
        <PublicForm
          formId={currentFormId}
          onSubmit={(response) => submitResponse(currentFormId, response)}
          onBack={() => setCurrentView('list')}
        />
      )}

      {settingsFormId && (() => {
        const settingsForm = forms.find(f => f.id === settingsFormId);
        return settingsForm ? (
          <FormSettingsModal
            form={settingsForm}
            onSave={(settings) => {
              saveFormSettings(settingsFormId, settings);
              setSettingsFormId(null);
            }}
            onClose={() => setSettingsFormId(null)}
          />
        ) : null;
      })()}

      {isCreatingNewForm && (
        <FormSettingsModal
          form={{
            id: 'temp_new_form',
            name: `ฟอร์มใหม่ ${forms.length + 1}`,
            status: 'draft',
            metadata: {},
            elements: [],
            pages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            submissionCount: 0
          } as FormProject}
          onSave={(settings) => saveNewForm(settings)}
          onClose={() => setIsCreatingNewForm(false)}
          isNewForm={true}
        />
      )}
    </>
  );
};

// Wrap AppContainer with ErrorBoundary
const AppContainerWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <AppContainer />
  </ErrorBoundary>
);

export default AppContainerWithErrorBoundary;
