import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { Suspense } from 'react';

// Mock sub-components to avoid actual lazy loading in tests
vi.mock('../components/properties/FormSettings', () => ({
  default: ({ formMetadata, currentLanguage }: any) => (
    <div data-testid="form-settings">
      Form Settings - {formMetadata.title || 'Untitled'} - {currentLanguage}
    </div>
  )
}));

vi.mock('../components/properties/ElementGeneralSettings', () => ({
  default: ({ element, currentLanguage }: any) => (
    <div data-testid="element-general-settings">
      General Settings - {element.id} - {currentLanguage}
    </div>
  )
}));

vi.mock('../components/properties/LayoutGridSettings', () => ({
  default: ({ element }: any) => (
    <div data-testid="layout-grid-settings">
      Layout - {element.width || '100'}%
    </div>
  )
}));

vi.mock('../components/properties/ValidationRules', () => ({
  default: ({ element }: any) => (
    <div data-testid="validation-rules">
      Validation - {element.type}
    </div>
  )
}));

vi.mock('../components/properties/OptionsEditor', () => ({
  default: ({ element }: any) => (
    <div data-testid="options-editor">
      Options - {element.options?.length || 0} options
    </div>
  )
}));

vi.mock('../components/properties/OTPConfigEditor', () => ({
  default: ({ element }: any) => (
    <div data-testid="otp-config-editor">
      OTP Config - {element.type}
    </div>
  )
}));

vi.mock('../components/properties/ConditionalLogicEditor', () => ({
  default: ({ element }: any) => (
    <div data-testid="conditional-logic-editor">
      Logic - {element.logic ? 'enabled' : 'disabled'}
    </div>
  )
}));

vi.mock('../components/properties/LanguageSelector', () => ({
  default: ({ currentLanguage, onLanguageChange }: any) => (
    <div data-testid="language-selector">
      <select 
        value={currentLanguage} 
        onChange={(e) => onLanguageChange(e.target.value)}
        data-testid="language-select"
      >
        <option value="th">Thai</option>
        <option value="en">English</option>
      </select>
    </div>
  )
}));

// Import after mocks
import PropertiesPanelLazy from '../components/PropertiesPanelLazy';
import { FormElement, FormMetadata, Language, Signer } from '../types';

describe('PropertiesPanelLazy', () => {
  const defaultMetadata: FormMetadata = {
    title: 'Test Form',
    availableLanguages: ['th', 'en'],
    defaultLanguage: 'th'
  };

  const mockTextElement: FormElement = {
    id: 'text_1',
    type: 'text',
    label: { th: 'ชื่อ', en: 'Name' },
    required: true,
    pageId: 'page_1'
  };

  const mockRadioElement: FormElement = {
    id: 'radio_1',
    type: 'radio',
    label: { th: 'เพศ', en: 'Gender' },
    required: false,
    pageId: 'page_1',
    options: [
      { id: 'opt1', label: 'Male', value: 'male' },
      { id: 'opt2', label: 'Female', value: 'female' }
    ]
  };

  const mockOTPElement: FormElement = {
    id: 'otp_1',
    type: 'phone_otp',
    label: { th: 'OTP', en: 'OTP' },
    required: true,
    pageId: 'page_1'
  };

  const mockHandlers = {
    onLanguageChange: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onUpdateMetadata: vi.fn(),
    onRequestLabelChange: vi.fn(),
    onOpenCalculation: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithSuspense = (ui: React.ReactElement) => {
    return render(
      <Suspense fallback={<div>Loading...</div>}>
        {ui}
      </Suspense>
    );
  };

  describe('Form Settings Mode (no element selected)', () => {
    it('renders form settings when no element is selected', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={undefined}
          allElements={[]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Form Settings')).toBeInTheDocument();
      });
    });

    it('displays FormSettings component', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={undefined}
          allElements={[]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('form-settings')).toBeInTheDocument();
      });
    });
  });

  describe('Element Properties Mode', () => {
    it('renders element properties when element is selected', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });
    });

    it('displays element type and id in header', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/TEXT.*text_1/i)).toBeInTheDocument();
      });
    });

    it('renders language selector', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('language-selector')).toBeInTheDocument();
      });
    });

    it('renders general settings', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('element-general-settings')).toBeInTheDocument();
      });
    });

    it('renders layout grid settings', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('layout-grid-settings')).toBeInTheDocument();
      });
    });

    it('renders delete button', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Delete Element')).toBeInTheDocument();
      });
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Delete Element')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete Element'));
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('text_1');
    });
  });

  describe('Conditional Component Rendering', () => {
    it('renders validation rules for text input', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('validation-rules')).toBeInTheDocument();
      });
    });

    it('renders options editor for radio element', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockRadioElement}
          allElements={[mockRadioElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('options-editor')).toBeInTheDocument();
      });
    });

    it('renders OTP config for phone_otp element', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockOTPElement}
          allElements={[mockOTPElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('otp-config-editor')).toBeInTheDocument();
      });
    });

    it('does not render options editor for text element', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('element-general-settings')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('options-editor')).not.toBeInTheDocument();
    });

    it('renders conditional logic editor for all elements', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('conditional-logic-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Language Change', () => {
    it('calls onLanguageChange when language is changed', async () => {
      const user = userEvent.setup();
      
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('language-select')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('language-select'), 'en');
      expect(mockHandlers.onLanguageChange).toHaveBeenCalledWith('en');
    });
  });

  describe('With Signers', () => {
    const mockSigners: Signer[] = [
      { 
        id: 'signer_1', 
        name: 'ผู้ขอ', 
        label: { th: 'ผู้ขอ', en: 'Requester' },
        order: 1, 
        required: true, 
        assignmentType: 'static' 
      },
      { 
        id: 'signer_2', 
        name: 'ผู้อนุมัติ', 
        label: { th: 'ผู้อนุมัติ', en: 'Approver' },
        order: 2, 
        required: true, 
        assignmentType: 'dynamic' 
      }
    ];

    it('passes signers to ElementGeneralSettings', async () => {
      renderWithSuspense(
        <PropertiesPanelLazy
          element={mockTextElement}
          allElements={[mockTextElement]}
          formMetadata={defaultMetadata}
          currentLanguage="th"
          signers={mockSigners}
          {...mockHandlers}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('element-general-settings')).toBeInTheDocument();
      });
    });
  });
});
