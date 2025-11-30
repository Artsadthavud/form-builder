
export type ElementType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'section' | 'signature' | 'image' | 'date' | 'time' | 'file' | 'rating' | 'paragraph' | 'phone_otp' | 'email_otp';

// Element type categories for type-safe operations
export type TextInputType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'date' | 'time';
export type ChoiceType = 'radio' | 'checkbox' | 'select';
export type OTPType = 'phone_otp' | 'email_otp';
export type LayoutType = 'section' | 'paragraph' | 'image';
export type SpecialType = 'signature' | 'file' | 'rating';

// Built-in languages that have full translation support
export type BuiltInLanguage = 'th' | 'en';
// Extended language type allows custom languages to be added dynamically
export type Language = BuiltInLanguage | (string & {});

export interface TranslatableText {
  th: string;
  en: string;
  [key: string]: string; // Allow dynamic language keys
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
  | 'starts_with' | 'ends_with'
  | 'not_starts_with' | 'not_ends_with';

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

  // OTP Verification Configuration (for phone_otp, email_otp)
  otpConfig?: OTPConfig;
  
  // Multi-Signer: กำหนดว่า element นี้เป็นของ signer คนไหน
  signerId?: string;              // ID ของ signer ที่เป็นเจ้าของ element นี้
  signerRequired?: boolean;       // signer คนนี้ต้องกรอก element นี้
}

// ========================================
// Type Guards for Element Type Categories
// ========================================

/** Check if element is a text input type */
export const isTextInputElement = (el: FormElement): el is FormElement & { type: TextInputType } =>
  ['text', 'email', 'phone', 'number', 'textarea', 'date', 'time'].includes(el.type);

/** Check if element is a choice/selection type */
export const isChoiceElement = (el: FormElement): el is FormElement & { type: ChoiceType } =>
  ['radio', 'checkbox', 'select'].includes(el.type);

/** Check if element is an OTP verification type */
export const isOTPElement = (el: FormElement): el is FormElement & { type: OTPType } =>
  ['phone_otp', 'email_otp'].includes(el.type);

/** Check if element is a layout/display type */
export const isLayoutElement = (el: FormElement): el is FormElement & { type: LayoutType } =>
  ['section', 'paragraph', 'image'].includes(el.type);

/** Check if element requires options array */
export const requiresOptions = (type: ElementType): boolean =>
  ['radio', 'checkbox', 'select'].includes(type);

/** Check if element supports validation */
export const supportsValidation = (type: ElementType): boolean =>
  ['text', 'email', 'phone', 'number', 'textarea', 'file'].includes(type);

/** Check if element supports calculation */
export const supportsCalculation = (type: ElementType): boolean =>
  type === 'number';

/** Get default width for element type */
export const getDefaultWidth = (type: ElementType): string => {
  switch (type) {
    case 'section':
    case 'paragraph':
    case 'image':
      return '100';
    case 'checkbox':
    case 'radio':
      return '100';
    default:
      return '100';
  }
};

// OTP Verification Configuration
export interface OTPConfig {
  // API Endpoints
  sendOtpEndpoint: string;      // API endpoint to send OTP (POST)
  verifyOtpEndpoint: string;    // API endpoint to verify OTP (POST)
  
  // Request Configuration
  requestMethod?: 'POST' | 'GET';
  requestHeaders?: Record<string, string>;  // Custom headers
  
  // Field mapping - which field in request body contains the phone/email
  valueFieldName?: string;       // Default: 'phone' or 'email'
  otpFieldName?: string;         // Default: 'otp'
  
  // OTP Settings
  otpLength?: number;            // 4 or 6 digits, default 6
  expireSeconds?: number;        // OTP expiry time, default 300 (5 min)
  resendDelaySeconds?: number;   // Delay before allowing resend, default 60
  maxAttempts?: number;          // Max verification attempts, default 3
  
  // UI Customization
  sendButtonText?: string | TranslatableText;     // "ส่ง OTP" / "Send OTP"
  verifyButtonText?: string | TranslatableText;   // "ยืนยัน" / "Verify"
  resendButtonText?: string | TranslatableText;   // "ส่งใหม่" / "Resend"
  
  // Messages
  successMessage?: string | TranslatableText;     // "ยืนยันสำเร็จ"
  errorMessage?: string | TranslatableText;       // "รหัส OTP ไม่ถูกต้อง"
  expiredMessage?: string | TranslatableText;     // "รหัส OTP หมดอายุ"
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
  
  // Multi-Signer Configuration
  signers?: Signer[];
  signerMode?: SignerMode;
}

// --- Multi-Signer Types ---
export type SignerMode = 
  | 'single'           // ฟอร์มปกติ ไม่มี multi-signer
  | 'sequential'       // เซ็นตามลำดับ
  | 'parallel'         // เซ็นพร้อมกันได้
  | 'approval';        // เซ็นแบบ approval chain

export interface Signer {
  id: string;
  name: string;                           // ชื่อ role เช่น "ผู้ขอ", "ผู้อนุมัติ", "พยาน"
  label: string | TranslatableText;       // Label แสดงในฟอร์ม
  order: number;                          // ลำดับการเซ็น (สำหรับ sequential mode)
  required: boolean;                      // จำเป็นต้องเซ็นหรือไม่
  
  // การกำหนดคนเซ็น
  assignmentType: SignerAssignmentType;
  assignedEmail?: string;                 // กำหนดคนเซ็นล่วงหน้า (predefined)
  assignedField?: string;                 // ดึง email จาก field ในฟอร์ม (form_field)
  signerOptions?: SignerOption[];         // รายชื่อให้เลือกตอน submit (on_submit)
  
  // การแจ้งเตือน
  notifyOnReady?: boolean;               // แจ้งเมื่อถึงคิวเซ็น
  reminderDays?: number;                 // เตือนซ้ำทุก X วัน
  
  // Section ที่คนนี้เข้าถึงได้ (สำหรับแบ่งส่วน)
  accessibleSections?: string[];         // array ของ section IDs
  canEditOtherSections?: boolean;        // สามารถแก้ไขส่วนอื่นได้หรือไม่
  
  // ลายเซ็น
  signatureElementId?: string;           // element ID ของช่องลายเซ็นสำหรับคนนี้
  signaturePosition?: 'inline' | 'end';  // เซ็นในส่วนของตัวเอง หรือตอนท้ายฟอร์ม
}

// ตัวเลือกผู้เซ็นสำหรับ on_submit type
export interface SignerOption {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

export type SignerAssignmentType = 
  | 'predefined'       // กำหนดล่วงหน้า (assignedEmail)
  | 'form_field'       // ดึงจาก field ในฟอร์ม
  | 'manual'           // ระบุตอน submit โดยผู้ส่ง
  | 'on_submit'        // กำหนดจากการกด Submit (popup ให้เลือก)
  | 'self';            // คนกรอกเซ็นเอง

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

// --- Templates ---
export type TemplateCategory = 'header' | 'footer' | 'form' | 'element-group';

export interface HeaderFooterStyle {
  backgroundColor?: string;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  logoUrl?: string;
  logoPlacement?: 'top' | 'bottom' | 'left' | 'right';
  logoAlignment?: 'left' | 'center' | 'right';
  logoWidth?: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  isBuiltIn: boolean; // true = preset, false = user-created
  createdAt: string;
  updatedAt?: string;
  thumbnail?: string; // preview image URL or data URL
  
  // For header templates
  headerStyle?: HeaderFooterStyle & {
    title?: string | TranslatableText;
    description?: string | TranslatableText;
  };
  
  // For footer templates
  footerStyle?: HeaderFooterStyle & {
    footerText?: string | TranslatableText;
  };
  
  // For full form templates
  metadata?: FormMetadata;
  elements?: FormElement[];
  pages?: FormPage[];
}
