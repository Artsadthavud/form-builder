
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

export interface TokenSource {
  token: string; // token name, e.g. "user.name" or "Address"
  source: {
    type: 'static' | 'api';
    // for static: `value` may contain a literal or templated JSON string
    // for api: `url` may be a real endpoint or a mock:// key
    url?: string;
    value?: string;
    mock?: boolean;
    dataPath?: string; // path inside the returned JSON to pick the data (e.g. "data.items")
    valueField?: string; // field name inside array/object to use as value
  };
}

export type ConditionOperator = 
  | 'equals' | 'not_equals' 
  | 'contains' | 'not_contains'
  | 'is_empty' | 'is_not_empty'
  | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal'
  | 'starts_with' | 'ends_with';

export interface Condition {
  id: string;
  targetId: string;
  operator: ConditionOperator;
  value: string;
}

export interface Logic {
  combinator: 'AND' | 'OR';
  conditions: Condition[];
  action?: 'show' | 'hide'; // what to do when conditions match
}

// --- Advanced Logic: Skip Logic ---
export interface SkipRule {
  id: string;
  conditions: Condition[];
  combinator: 'AND' | 'OR';
  targetPageId: string; // page to skip to when conditions are met
}

// --- Advanced Logic: Calculation ---
export type CalculationOperator = '+' | '-' | '*' | '/' | '%';

export interface CalculationOperand {
  type: 'field' | 'constant';
  fieldId?: string;   // when type = 'field'
  value?: number;     // when type = 'constant'
}

export interface Calculation {
  enabled: boolean;
  formula: CalculationStep[];
  decimalPlaces?: number;
  prefix?: string;  // e.g. '฿' or '$'
  suffix?: string;  // e.g. 'บาท'
}

export interface CalculationStep {
  operand: CalculationOperand;
  operator?: CalculationOperator; // undefined for last operand
}

// --- Advanced Logic: Piping (Answer Recall) ---
export interface PipeToken {
  token: string;      // e.g. "answer:field_123"
  sourceFieldId: string;
  fallback?: string;  // fallback text if field has no answer
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
  // Default selected value(s) for choice fields (radio/select => string, checkbox => string[])
  defaultValue?: string | string[];
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
  content?: string | TranslatableText;

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

  // Token sources for template replacement in label/content/placeholder
  tokenSources?: TokenSource[];
  
  // For rating
  maxRating?: number;

  // Advanced Logic: Calculation (for number fields)
  calculation?: Calculation;

  // Advanced Logic: Piping - reference answers from other fields
  // Used in label/placeholder/content like "Hello {answer:field_123}"
  pipedFields?: string[]; // list of field IDs referenced via piping
}

// Form Project Types
export type FormStatus = 'draft' | 'published' | 'archived';

// Page with optional skip rules
export interface FormPage {
  id: string;
  label: string;
  skipRules?: SkipRule[]; // Skip to another page based on conditions
}

export interface FormRevision {
  id: string;
  version: number;
  name: string;
  metadata: FormMetadata;
  elements: FormElement[];
  pages: FormPage[];
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
  pages: FormPage[];
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
