
export type ElementType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'section' | 'signature' | 'image' | 'date' | 'time' | 'file' | 'rating' | 'paragraph';

export type Language = 'th' | 'en';

export interface TranslatableText {
  th: string;
  en: string;
}

export interface Option {
  id: string;
  label: string | TranslatableText;
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
  title: string | TranslatableText;
  description?: string | TranslatableText;
  logoUrl?: string;
  footerText?: string | TranslatableText;
  // Styling
  headerBackgroundColor?: string;
  headerTitleColor?: string; // Title & Description color
  logoPlacement?: 'top' | 'bottom' | 'left' | 'right';
  logoAlignment?: 'left' | 'center' | 'right';
  headerTextAlignment?: 'left' | 'center' | 'right';
  logoWidth?: number; // Percentage width (5-100)
  footerBackgroundColor?: string;
  footerTextColor?: string;
  // Multi-language
  defaultLanguage?: Language;
  availableLanguages?: Language[];
}

export interface FormElement {
  id: string;
  type: ElementType;
  label: string | TranslatableText;
  pageId?: string;
  placeholder?: string | TranslatableText;
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
  
  // Phone specific
  phoneFormat?: 'international' | 'national' | 'custom';
  countryCode?: string; // e.g., '+66', '+1'
  
  // Custom Styling
  customClass?: string; // CSS classes
  customStyles?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: string;
    borderRadius?: string;
    fontSize?: string;
    fontWeight?: string;
    padding?: string;
    margin?: string;
  };
  
  // File upload specific
  allowMultiple?: boolean;
  maxFileSize?: number; // in MB
  
  // Validation object
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    acceptedFileTypes?: string[];
  };
  
  // For sections
  children?: FormElement[];
  
  // For rating
  maxRating?: number;
}

// Form Project Types
export type FormStatus = 'draft' | 'published' | 'archived';

export interface FormRevision {
  id: string;
  version: number;
  name: string;
  metadata: FormMetadata;
  elements: FormElement[];
  pages: { id: string; label: string }[];
  createdAt: string;
  createdBy?: string;
  description?: string; // คำอธิบายการเปลี่ยนแปลง
}

export interface FormProject {
  id: string;
  name: string;
  codeName?: string; // รหัสฟอร์ม สำหรับอ้างอิง
  site?: string; // ชื่อ site/project ที่ใช้ฟอร์ม
  status: FormStatus;
  metadata: FormMetadata;
  elements: FormElement[];
  pages: { id: string; label: string }[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  version: number;
  shareUrl?: string;
  submissionCount?: number;
  revisions?: FormRevision[]; // เก็บประวัติการแก้ไข
  tags?: string[]; // แท็กสำหรับจัดหมวดหมู่
  description?: string; // คำอธิบายฟอร์ม
}

// Form Response Types
export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  completionTime?: number; // in seconds
  metadata?: {
    userAgent?: string;
    language?: Language;
    ipAddress?: string;
    screenResolution?: string;
  };
}

export interface FormStatistics {
  formId: string;
  totalSubmissions: number;
  averageCompletionTime: number;
  completionRate: number;
  lastSubmission?: string;
}
