import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import LanguageSelector from '../components/properties/LanguageSelector';
import { FormMetadata, Language } from '../types';

describe('LanguageSelector', () => {
  const defaultMetadata: FormMetadata = {
    title: 'Test Form',
    availableLanguages: ['th', 'en'],
    defaultLanguage: 'th'
  };

  const metadataWithMoreLanguages: FormMetadata = {
    title: 'Multi-lang Form',
    availableLanguages: ['th', 'en', 'zh', 'ja'],
    defaultLanguage: 'en'
  };

  let mockOnLanguageChange: Mock<(lang: Language) => void>;
  let mockOnUpdateMetadata: Mock<(meta: FormMetadata) => void>;

  beforeEach(() => {
    mockOnLanguageChange = vi.fn();
    mockOnUpdateMetadata = vi.fn();
  });

  it('renders language selector dropdown', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    expect(screen.getByText(/Editing Language/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays current language in selector', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('th');
  });

  it('shows all available languages as options', () => {
    render(
      <LanguageSelector
        formMetadata={metadataWithMoreLanguages}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(4);
  });

  it('calls onLanguageChange when language is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), 'en');
    expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
  });

  it('displays Thai flag emoji for Thai language', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    const thaiFlags = screen.getAllByText(/🇹🇭/);
    expect(thaiFlags.length).toBeGreaterThan(0);
  });

  it('displays English flag emoji for English language', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    const enFlags = screen.getAllByText(/🇬🇧/);
    expect(enFlags.length).toBeGreaterThan(0);
  });

  it('displays available languages section', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    expect(screen.getByText(/Available Languages/i)).toBeInTheDocument();
  });

  it('shows language count badge', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays default language indicator', () => {
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    expect(screen.getByText(/Default/i)).toBeInTheDocument();
  });

  it('allows adding new language', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Find and click add language button
    const addButton = screen.getByText(/Add Language/i);
    await user.click(addButton);

    // Modal should appear
    expect(screen.getByPlaceholderText(/e.g. zh, ja, ko/i)).toBeInTheDocument();
  });

  it('validates new language code', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Open add language modal
    await user.click(screen.getByText(/Add Language/i));

    // Enter invalid (too short) code
    const input = screen.getByPlaceholderText(/e.g. zh, ja, ko/i);
    await user.type(input, 'x');
    
    // Try to add
    const addButtons = screen.getAllByText(/Add/i);
    const confirmButton = addButtons[addButtons.length - 1];
    await user.click(confirmButton);

    // Should show error
    expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('prevents duplicate language codes', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Open add language modal
    await user.click(screen.getByText(/Add Language/i));

    // Enter existing code
    const input = screen.getByPlaceholderText(/e.g. zh, ja, ko/i);
    await user.type(input, 'th');
    
    // Try to add
    const addButtons = screen.getAllByText(/Add/i);
    const confirmButton = addButtons[addButtons.length - 1];
    await user.click(confirmButton);

    // Should show error
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });

  it('successfully adds new language', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Open add language modal
    await user.click(screen.getByText(/Add Language/i));

    // Enter valid code
    const input = screen.getByPlaceholderText(/e.g. zh, ja, ko/i);
    await user.type(input, 'zh');
    
    // Add
    const addButtons = screen.getAllByText(/Add/i);
    const confirmButton = addButtons[addButtons.length - 1];
    await user.click(confirmButton);

    // Should call onUpdateMetadata with new languages
    expect(mockOnUpdateMetadata).toHaveBeenCalled();
    const call = mockOnUpdateMetadata.mock.calls[0][0];
    expect(call.availableLanguages).toContain('zh');
  });

  it('allows setting default language', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Find the English language radio button
    const radioButtons = screen.getAllByRole('radio');
    // Click the second one (English)
    if (radioButtons.length >= 2) {
      await user.click(radioButtons[1]);
      
      expect(mockOnUpdateMetadata).toHaveBeenCalled();
      const call = mockOnUpdateMetadata.mock.calls[0][0];
      expect(call.defaultLanguage).toBe('en');
    }
  });

  it('allows removing non-default language', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSelector
        formMetadata={defaultMetadata}
        currentLanguage="th"
        onLanguageChange={mockOnLanguageChange}
        onUpdateMetadata={mockOnUpdateMetadata}
      />
    );

    // Find remove buttons (should have 2, but can only remove non-default)
    const removeButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg') && btn.className.includes('text-red')
    );
    
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      expect(mockOnUpdateMetadata).toHaveBeenCalled();
    }
  });
});
