/**
 * PropertiesPanelLazy - Refactored version with lazy-loaded sub-components
 * This version optimizes bundle splitting by lazy loading heavy sections
 */
import React, { useState, Suspense, lazy, memo, useCallback } from 'react';
import { FormElement, Option, Condition, Logic, FormMetadata, Language, TranslatableText, Calculation, OTPConfig, Signer } from '../types';
import { getText, isTranslatable, makeTranslatable } from '../utils/i18n';

// Lazy load heavy sub-components
const FormSettings = lazy(() => import('./properties/FormSettings'));
const ElementGeneralSettings = lazy(() => import('./properties/ElementGeneralSettings'));
const LayoutGridSettings = lazy(() => import('./properties/LayoutGridSettings'));
const ValidationRules = lazy(() => import('./properties/ValidationRules'));
const OptionsEditor = lazy(() => import('./properties/OptionsEditor'));
const OTPConfigEditor = lazy(() => import('./properties/OTPConfigEditor'));
const ConditionalLogicEditor = lazy(() => import('./properties/ConditionalLogicEditor'));
const LanguageSelector = lazy(() => import('./properties/LanguageSelector'));

// Loading fallback component
const SectionLoader: React.FC<{ height?: string }> = ({ height = 'h-32' }) => (
  <div className={`${height} flex items-center justify-center bg-slate-50 rounded-xl border-2 border-slate-200 animate-pulse`}>
    <div className="flex items-center gap-2 text-slate-400">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-sm">Loading...</span>
    </div>
  </div>
);

interface PropertiesPanelProps {
  element?: FormElement;
  allElements: FormElement[];
  formMetadata: FormMetadata;
  currentLanguage: Language;
  signers?: Signer[];
  onLanguageChange: (lang: Language) => void;
  onUpdate: (element: FormElement) => void;
  onDelete: (id: string) => void;
  onUpdateMetadata: (meta: FormMetadata) => void;
  onRequestLabelChange: (id: string, newLabel: string) => void;
  onOpenCalculation?: () => void;
}

const PropertiesPanelLazy: React.FC<PropertiesPanelProps> = memo(({ 
  element, 
  allElements, 
  formMetadata,
  currentLanguage,
  signers = [],
  onLanguageChange,
  onUpdate, 
  onDelete, 
  onUpdateMetadata,
  onRequestLabelChange,
  onOpenCalculation
}) => {
  // Panel header component
  const PanelHeader = memo(({ icon, title, subtitle, colors }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string;
    colors: { from: string; via: string; to: string; iconBg: string };
  }) => (
    <div className={`p-5 border-b-2 border-slate-200 bg-gradient-to-br ${colors.from} ${colors.via} ${colors.to}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 ${colors.iconBg} rounded-lg shadow-md`}>
          {icon}
        </div>
        <h2 className="font-bold text-lg text-slate-800">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-slate-600 ml-9">{subtitle}</p>}
    </div>
  ));

  // If no element is selected, show Form Settings
  if (!element) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
        <PanelHeader 
          icon={
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Form Settings"
          subtitle="Header & Footer Configuration"
          colors={{ 
            from: 'from-slate-50', 
            via: 'via-indigo-50', 
            to: 'to-purple-50',
            iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-500'
          }}
        />
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <Suspense fallback={<SectionLoader height="h-96" />}>
            <FormSettings
              formMetadata={formMetadata}
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
              onUpdateMetadata={onUpdateMetadata}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // Element type checks
  const hasOptions = element.type === 'radio' || element.type === 'checkbox' || element.type === 'select';
  const hasValidation = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'file'].includes(element.type);
  const hasOTPConfig = element.type === 'phone_otp' || element.type === 'email_otp';
  const hasPlaceholder = ['text', 'email', 'phone', 'number', 'textarea'].includes(element.type);
  const isImage = element.type === 'image';
  const isParagraph = element.type === 'paragraph';

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10">
      <PanelHeader 
        icon={
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        }
        title="Properties"
        subtitle={`${element.type.toUpperCase()} • ${element.id}`}
        colors={{ 
          from: 'from-slate-50', 
          via: 'via-blue-50', 
          to: 'to-indigo-50',
          iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Language Selector */}
        <Suspense fallback={<SectionLoader height="h-24" />}>
          <LanguageSelector
            formMetadata={formMetadata}
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            onUpdateMetadata={onUpdateMetadata}
          />
        </Suspense>

        {/* General Settings */}
        <Suspense fallback={<SectionLoader height="h-48" />}>
          <ElementGeneralSettings
            element={element}
            allElements={allElements}
            formMetadata={formMetadata}
            currentLanguage={currentLanguage}
            signers={signers}
            onUpdate={onUpdate}
          />
        </Suspense>

        {/* Layout Grid */}
        <Suspense fallback={<SectionLoader height="h-32" />}>
          <LayoutGridSettings
            element={element}
            onUpdate={onUpdate}
          />
        </Suspense>

        {/* Validation Rules - only for input types */}
        {hasValidation && (
          <Suspense fallback={<SectionLoader height="h-64" />}>
            <ValidationRules
              element={element}
              currentLanguage={currentLanguage}
              onUpdate={onUpdate}
              onOpenCalculation={onOpenCalculation}
            />
          </Suspense>
        )}

        {/* Options Editor - for radio, checkbox, select */}
        {hasOptions && (
          <Suspense fallback={<SectionLoader height="h-48" />}>
            <OptionsEditor
              element={element}
              currentLanguage={currentLanguage}
              formMetadata={formMetadata}
              onUpdate={onUpdate}
            />
          </Suspense>
        )}

        {/* OTP Config - for phone_otp, email_otp */}
        {hasOTPConfig && (
          <Suspense fallback={<SectionLoader height="h-48" />}>
            <OTPConfigEditor
              element={element}
              currentLanguage={currentLanguage}
              onUpdate={onUpdate}
            />
          </Suspense>
        )}

        {/* Conditional Logic */}
        <Suspense fallback={<SectionLoader height="h-48" />}>
          <ConditionalLogicEditor
            element={element}
            allElements={allElements}
            currentLanguage={currentLanguage}
            onUpdate={onUpdate}
          />
        </Suspense>

        {/* Delete Button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={() => onDelete(element.id)}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Element
          </button>
        </div>
      </div>
    </div>
  );
});

PropertiesPanelLazy.displayName = 'PropertiesPanelLazy';

export default PropertiesPanelLazy;
