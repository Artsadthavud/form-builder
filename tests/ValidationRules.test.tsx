import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ValidationRules from '../components/properties/ValidationRules';
import { FormElement, Language } from '../types';

describe('ValidationRules', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockOnOpenCalculation: ReturnType<typeof vi.fn>;

  const mockTextElement: FormElement = {
    id: 'text_1',
    type: 'text',
    label: 'Name',
    required: true,
    pageId: 'page_1'
  };

  const mockNumberElement: FormElement = {
    id: 'num_1',
    type: 'number',
    label: 'Age',
    required: false,
    pageId: 'page_1',
    min: 0,
    max: 120
  };

  const mockEmailElement: FormElement = {
    id: 'email_1',
    type: 'email',
    label: 'Email',
    required: true,
    pageId: 'page_1'
  };

  const mockPhoneElement: FormElement = {
    id: 'phone_1',
    type: 'phone',
    label: 'Phone',
    required: false,
    pageId: 'page_1'
  };

  const mockFileElement: FormElement = {
    id: 'file_1',
    type: 'file',
    label: 'Document',
    required: false,
    pageId: 'page_1',
    maxFileSize: 10
  };

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockOnOpenCalculation = vi.fn();
  });

  describe('Text Element', () => {
    it('renders validation section for text input', () => {
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Validation/i)).toBeInTheDocument();
    });

    it('shows min/max length inputs for text', () => {
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Min Length/i)).toBeInTheDocument();
      expect(screen.getByText(/Max Length/i)).toBeInTheDocument();
    });

    it('shows regex pattern input', () => {
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Regex Pattern/i)).toBeInTheDocument();
    });

    it('shows preset pattern buttons', () => {
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Letters Only/i)).toBeInTheDocument();
      expect(screen.getByText(/Numbers Only/i)).toBeInTheDocument();
    });

    it('applies preset pattern when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText(/Letters Only/i));
      
      expect(mockOnUpdate).toHaveBeenCalled();
      const call = mockOnUpdate.mock.calls[0][0];
      expect(call.pattern).toBe('^[A-Za-z\\s]+$');
    });

    it('updates min length when changed', async () => {
      const user = userEvent.setup();
      
      render(
        <ValidationRules
          element={mockTextElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      const minLengthInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(minLengthInput);
      await user.type(minLengthInput, '5');
      
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe('Number Element', () => {
    it('shows min/max value inputs for number', () => {
      render(
        <ValidationRules
          element={mockNumberElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
          onOpenCalculation={mockOnOpenCalculation}
        />
      );

      expect(screen.getByText(/Min Value/i)).toBeInTheDocument();
      expect(screen.getByText(/Max Value/i)).toBeInTheDocument();
    });

    it('shows auto-calculate section', () => {
      render(
        <ValidationRules
          element={mockNumberElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
          onOpenCalculation={mockOnOpenCalculation}
        />
      );

      expect(screen.getByText(/Auto-Calculate/i)).toBeInTheDocument();
    });

    it('calls onOpenCalculation when setup button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ValidationRules
          element={mockNumberElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
          onOpenCalculation={mockOnOpenCalculation}
        />
      );

      await user.click(screen.getByText(/Setup/i));
      expect(mockOnOpenCalculation).toHaveBeenCalled();
    });

    it('displays current min/max values', () => {
      render(
        <ValidationRules
          element={mockNumberElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      const inputs = screen.getAllByRole('spinbutton');
      const minInput = inputs.find(input => (input as HTMLInputElement).value === '0');
      const maxInput = inputs.find(input => (input as HTMLInputElement).value === '120');
      
      expect(minInput).toBeTruthy();
      expect(maxInput).toBeTruthy();
    });
  });

  describe('Email Element', () => {
    it('shows email-specific preset patterns', () => {
      render(
        <ValidationRules
          element={mockEmailElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Standard Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Company Domain/i)).toBeInTheDocument();
    });
  });

  describe('Phone Element', () => {
    it('shows phone-specific preset patterns', () => {
      render(
        <ValidationRules
          element={mockPhoneElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Thai Mobile/i)).toBeInTheDocument();
      expect(screen.getByText(/\+66 Format/i)).toBeInTheDocument();
    });
  });

  describe('File Element', () => {
    it('shows file upload settings', () => {
      render(
        <ValidationRules
          element={mockFileElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Max File Size/i)).toBeInTheDocument();
      expect(screen.getByText(/Allow Multiple/i)).toBeInTheDocument();
    });

    it('shows file type presets', () => {
      render(
        <ValidationRules
          element={mockFileElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Images/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    });

    it('toggles multiple files option', async () => {
      const user = userEvent.setup();
      
      render(
        <ValidationRules
          element={mockFileElement}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(mockOnUpdate).toHaveBeenCalled();
      const call = mockOnUpdate.mock.calls[0][0];
      expect(call.allowMultiple).toBe(true);
    });
  });

  describe('Clear Pattern', () => {
    it('shows clear button when pattern is set', () => {
      const elementWithPattern: FormElement = {
        ...mockTextElement,
        pattern: '^[A-Za-z]+$'
      };

      render(
        <ValidationRules
          element={elementWithPattern}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Clear/i)).toBeInTheDocument();
    });

    it('clears pattern when clear button is clicked', async () => {
      const user = userEvent.setup();
      const elementWithPattern: FormElement = {
        ...mockTextElement,
        pattern: '^[A-Za-z]+$'
      };

      render(
        <ValidationRules
          element={elementWithPattern}
          currentLanguage="en"
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText(/Clear/i));
      
      expect(mockOnUpdate).toHaveBeenCalled();
      const call = mockOnUpdate.mock.calls[0][0];
      expect(call.pattern).toBe('');
    });
  });
});
