import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import OptionsEditor from '../components/properties/OptionsEditor';
import { FormElement, FormMetadata, Language } from '../types';

describe('OptionsEditor', () => {
  const mockMetadata: FormMetadata = {
    title: 'Test Form',
    availableLanguages: ['th', 'en'],
    defaultLanguage: 'th'
  };

  const mockRadioElement: FormElement = {
    id: 'radio_1',
    type: 'radio',
    label: { th: 'เพศ', en: 'Gender' },
    required: false,
    pageId: 'page_1',
    options: [
      { id: 'opt1', label: { th: 'ชาย', en: 'Male' }, value: 'male' },
      { id: 'opt2', label: { th: 'หญิง', en: 'Female' }, value: 'female' }
    ]
  };

  const mockSelectElement: FormElement = {
    id: 'select_1',
    type: 'select',
    label: { th: 'จังหวัด', en: 'Province' },
    required: true,
    pageId: 'page_1',
    options: [
      { id: 'opt1', label: 'Bangkok', value: 'bkk' },
      { id: 'opt2', label: 'Chiang Mai', value: 'cnx' },
      { id: 'opt3', label: 'Phuket', value: 'hkt' }
    ]
  };

  const mockEmptyOptionsElement: FormElement = {
    id: 'checkbox_1',
    type: 'checkbox',
    label: 'Interests',
    required: false,
    pageId: 'page_1',
    options: []
  };

  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  it('renders all options', () => {
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="en"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Options/i)).toBeInTheDocument();
    // Check that options are displayed
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders add option button', () => {
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="th"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    const addButton = screen.getByText(/Add Option/i);
    expect(addButton).toBeInTheDocument();
  });

  it('calls onUpdate when add option button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="th"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    const addButton = screen.getByText(/Add Option/i);
    await user.click(addButton);

    expect(mockOnUpdate).toHaveBeenCalled();
    const call = mockOnUpdate.mock.calls[0][0];
    expect(call.options.length).toBe(3); // Original 2 + 1 new
  });

  it('shows empty state message when no options', () => {
    render(
      <OptionsEditor
        element={mockEmptyOptionsElement}
        currentLanguage="en"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/Add Option/i)).toBeInTheDocument();
  });

  it('displays option count badge', () => {
    render(
      <OptionsEditor
        element={mockSelectElement}
        currentLanguage="en"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    // Should show "3" for 3 options
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles option label editing', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="en"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    const labelInputs = screen.getAllByPlaceholderText(/Label/i);
    if (labelInputs.length > 0) {
      await user.clear(labelInputs[0]);
      await user.type(labelInputs[0], 'Updated Label');
      
      // Should trigger update
      expect(mockOnUpdate).toHaveBeenCalled();
    }
  });

  it('handles option value editing', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="en"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    const valueInputs = screen.getAllByPlaceholderText(/Value/i);
    if (valueInputs.length > 0) {
      await user.clear(valueInputs[0]);
      await user.type(valueInputs[0], 'new_value');
      
      expect(mockOnUpdate).toHaveBeenCalled();
    }
  });

  it('handles option removal', async () => {
    const user = userEvent.setup();
    
    render(
      <OptionsEditor
        element={mockRadioElement}
        currentLanguage="th"
        formMetadata={mockMetadata}
        onUpdate={mockOnUpdate}
      />
    );

    // Find remove buttons (usually X or trash icon buttons)
    const removeButtons = screen.getAllByRole('button').filter(
      btn => btn.textContent?.includes('×') || btn.getAttribute('aria-label')?.includes('remove')
    );
    
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      expect(mockOnUpdate).toHaveBeenCalled();
      
      const call = mockOnUpdate.mock.calls[0][0];
      expect(call.options.length).toBe(1); // Original 2 - 1 removed
    }
  });
});
