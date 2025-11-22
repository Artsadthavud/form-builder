
export type ElementType = 'text' | 'number' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'section' | 'signature' | 'image' | 'date' | 'time' | 'file' | 'rating' | 'paragraph';

export interface Option {
  id: string;
  label: string;
  value: string;
}

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains';

export interface Condition {
  id: string;
  targetId: string;
  operator: ConditionOperator;
  value: string;
}

export interface Logic {
  combinator: 'AND' | 'OR';
  conditions: Condition[];
}

export interface FormMetadata {
  title: string;
  description?: string;
  logoUrl?: string;
  footerText?: string;
  // Styling
  headerBackgroundColor?: string;
  headerTitleColor?: string; // Title & Description color
  logoPlacement?: 'top' | 'bottom' | 'left' | 'right';
  logoAlignment?: 'left' | 'center' | 'right';
  headerTextAlignment?: 'left' | 'center' | 'right';
  logoWidth?: number; // Percentage width (5-100)
  footerBackgroundColor?: string;
  footerTextColor?: string;
}

export interface FormElement {
  id: string;
  type: ElementType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: Option[]; // For radio, checkbox, select
  logic?: Logic;      // Complex dependency logic
  parentId?: string;  // For nesting inside sections
  orientation?: 'vertical' | 'horizontal'; // For radio and checkbox groups
  
  // Layout
  width?: string; // '100', '50', '33', '67', '25' representing percentage
  
  // Image specific properties
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number; // percentage 10-100
  imageAlign?: 'left' | 'center' | 'right';

  // Signature specific properties
  signatureHeight?: number;

  // Paragraph / Rich Text specific
  content?: string;

  // Rating specific
  ratingMax?: number;

  // Validation properties
  min?: number;       // For number inputs
  max?: number;       // For number inputs
  minLength?: number; // For text/textarea
  maxLength?: number; // For text/textarea
  pattern?: string;   // Regex pattern
  validationType?: 'text' | 'email'; // specific format validation
  customErrorMsg?: string; // Custom validation message
}
