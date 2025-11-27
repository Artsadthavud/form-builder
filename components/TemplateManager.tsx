import React, { useState, useEffect } from 'react';
import { FormTemplate, FormMetadata, TemplateCategory, HeaderFooterStyle, TranslatableText, FormElement, FormPage } from '../types';
import { getText } from '../utils/i18n';

const TEMPLATES_STORAGE_KEY = 'formflow_templates_v1';

// Helper to create translatable text
const t = (th: string, en: string): TranslatableText => ({ th, en });

// Helper to generate unique IDs for template elements
const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Built-in Body Templates (Form Element Layouts)
const builtInBodyTemplates: FormTemplate[] = [
  {
    id: 'body_contact_form',
    name: 'Contact Form',
    description: 'Basic contact form with name, email, phone and message',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_name',
        type: 'text',
        label: t('ชื่อ-นามสกุล', 'Full Name'),
        placeholder: t('กรุณากรอกชื่อ-นามสกุล', 'Enter your full name'),
        required: true,
        width: '100',
      } as FormElement,
      {
        id: 'tpl_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        placeholder: t('example@email.com', 'example@email.com'),
        required: true,
        width: '50',
      } as FormElement,
      {
        id: 'tpl_phone',
        type: 'phone',
        label: t('เบอร์โทรศัพท์', 'Phone Number'),
        placeholder: t('0xx-xxx-xxxx', '0xx-xxx-xxxx'),
        required: false,
        width: '50',
      } as FormElement,
      {
        id: 'tpl_message',
        type: 'textarea',
        label: t('ข้อความ', 'Message'),
        placeholder: t('กรุณากรอกข้อความของคุณ', 'Enter your message'),
        required: true,
        width: '100',
      } as FormElement,
    ],
  },
  {
    id: 'body_registration',
    name: 'Registration Form',
    description: 'User registration with personal details',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_section_personal',
        type: 'section',
        label: t('ข้อมูลส่วนตัว', 'Personal Information'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_firstname',
        type: 'text',
        label: t('ชื่อ', 'First Name'),
        placeholder: t('ชื่อ', 'First name'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_lastname',
        type: 'text',
        label: t('นามสกุล', 'Last Name'),
        placeholder: t('นามสกุล', 'Last name'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_reg_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        placeholder: t('example@email.com', 'example@email.com'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_reg_phone',
        type: 'phone',
        label: t('เบอร์โทรศัพท์', 'Phone'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_birthdate',
        type: 'date',
        label: t('วันเกิด', 'Date of Birth'),
        required: false,
        width: '50',
      },
      {
        id: 'tpl_gender',
        type: 'radio',
        label: t('เพศ', 'Gender'),
        required: false,
        width: '50',
        orientation: 'horizontal',
        options: [
          { id: 'g1', label: t('ชาย', 'Male'), value: 'male' },
          { id: 'g2', label: t('หญิง', 'Female'), value: 'female' },
          { id: 'g3', label: t('ไม่ระบุ', 'Prefer not to say'), value: 'unspecified' },
        ],
      },
    ],
  },
  {
    id: 'body_survey',
    name: 'Survey / Feedback',
    description: 'Basic survey with rating and feedback fields',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_survey_intro',
        type: 'paragraph',
        label: '',
        content: t(
          'ขอบคุณที่สละเวลาตอบแบบสำรวจ ความคิดเห็นของท่านมีคุณค่ายิ่ง',
          'Thank you for taking the time to complete this survey. Your feedback is valuable to us.'
        ),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_satisfaction',
        type: 'rating',
        label: t('ความพึงพอใจโดยรวม', 'Overall Satisfaction'),
        required: true,
        width: '100',
        ratingMax: 5,
      },
      {
        id: 'tpl_recommend',
        type: 'radio',
        label: t('คุณจะแนะนำเราให้เพื่อนหรือไม่?', 'Would you recommend us to a friend?'),
        required: true,
        width: '100',
        orientation: 'horizontal',
        options: [
          { id: 'r1', label: t('แน่นอน', 'Definitely'), value: 'definitely' },
          { id: 'r2', label: t('อาจจะ', 'Maybe'), value: 'maybe' },
          { id: 'r3', label: t('ไม่แน่ใจ', 'Not sure'), value: 'not_sure' },
          { id: 'r4', label: t('ไม่', 'No'), value: 'no' },
        ],
      },
      {
        id: 'tpl_improve',
        type: 'checkbox',
        label: t('ด้านใดที่ควรปรับปรุง? (เลือกได้หลายข้อ)', 'What areas need improvement? (Select all that apply)'),
        required: false,
        width: '100',
        options: [
          { id: 'i1', label: t('คุณภาพสินค้า/บริการ', 'Product/Service Quality'), value: 'quality' },
          { id: 'i2', label: t('ราคา', 'Price'), value: 'price' },
          { id: 'i3', label: t('การบริการลูกค้า', 'Customer Service'), value: 'service' },
          { id: 'i4', label: t('ความสะดวกสบาย', 'Convenience'), value: 'convenience' },
          { id: 'i5', label: t('อื่นๆ', 'Other'), value: 'other' },
        ],
      },
      {
        id: 'tpl_comments',
        type: 'textarea',
        label: t('ข้อเสนอแนะเพิ่มเติม', 'Additional Comments'),
        placeholder: t('กรุณาแสดงความคิดเห็นเพิ่มเติม...', 'Please share any additional feedback...'),
        required: false,
        width: '100',
      },
    ],
  },
  {
    id: 'body_event_registration',
    name: 'Event Registration',
    description: 'Event sign-up form with session selection',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_event_name',
        type: 'text',
        label: t('ชื่อ-นามสกุล', 'Full Name'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_event_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_event_phone',
        type: 'phone',
        label: t('เบอร์โทร', 'Phone'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_organization',
        type: 'text',
        label: t('องค์กร/บริษัท', 'Organization/Company'),
        required: false,
        width: '50',
      },
      {
        id: 'tpl_position',
        type: 'text',
        label: t('ตำแหน่ง', 'Position/Title'),
        required: false,
        width: '50',
      },
      {
        id: 'tpl_session',
        type: 'select',
        label: t('เลือก Session', 'Select Session'),
        required: true,
        width: '100',
        options: [
          { id: 's1', label: t('Session 1 - เช้า (09:00-12:00)', 'Session 1 - Morning (09:00-12:00)'), value: 'session1' },
          { id: 's2', label: t('Session 2 - บ่าย (13:00-16:00)', 'Session 2 - Afternoon (13:00-16:00)'), value: 'session2' },
          { id: 's3', label: t('ทั้งสอง Session', 'Both Sessions'), value: 'both' },
        ],
      },
      {
        id: 'tpl_dietary',
        type: 'checkbox',
        label: t('ข้อจำกัดด้านอาหาร', 'Dietary Restrictions'),
        required: false,
        width: '100',
        options: [
          { id: 'd1', label: t('มังสวิรัติ', 'Vegetarian'), value: 'vegetarian' },
          { id: 'd2', label: t('ฮาลาล', 'Halal'), value: 'halal' },
          { id: 'd3', label: t('แพ้อาหารทะเล', 'Seafood Allergy'), value: 'seafood_allergy' },
          { id: 'd4', label: t('ไม่มี', 'None'), value: 'none' },
        ],
      },
    ],
  },
  {
    id: 'body_job_application',
    name: 'Job Application',
    description: 'Basic job application form',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_job_section_personal',
        type: 'section',
        label: t('ข้อมูลผู้สมัคร', 'Applicant Information'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_job_fullname',
        type: 'text',
        label: t('ชื่อ-นามสกุล', 'Full Name'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_job_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_job_phone',
        type: 'phone',
        label: t('เบอร์โทรศัพท์', 'Phone'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_job_section_edu',
        type: 'section',
        label: t('การศึกษาและประสบการณ์', 'Education & Experience'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_education',
        type: 'select',
        label: t('ระดับการศึกษาสูงสุด', 'Highest Education Level'),
        required: true,
        width: '50',
        options: [
          { id: 'e1', label: t('มัธยมศึกษา', 'High School'), value: 'highschool' },
          { id: 'e2', label: t('ปริญญาตรี', 'Bachelor\'s Degree'), value: 'bachelor' },
          { id: 'e3', label: t('ปริญญาโท', 'Master\'s Degree'), value: 'master' },
          { id: 'e4', label: t('ปริญญาเอก', 'Doctorate'), value: 'phd' },
        ],
      },
      {
        id: 'tpl_experience',
        type: 'select',
        label: t('ประสบการณ์ทำงาน', 'Work Experience'),
        required: true,
        width: '50',
        options: [
          { id: 'ex1', label: t('น้อยกว่า 1 ปี', 'Less than 1 year'), value: 'less_1' },
          { id: 'ex2', label: t('1-3 ปี', '1-3 years'), value: '1_3' },
          { id: 'ex3', label: t('3-5 ปี', '3-5 years'), value: '3_5' },
          { id: 'ex4', label: t('มากกว่า 5 ปี', 'More than 5 years'), value: 'more_5' },
        ],
      },
      {
        id: 'tpl_position_applied',
        type: 'text',
        label: t('ตำแหน่งที่สมัคร', 'Position Applied For'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_salary',
        type: 'number',
        label: t('เงินเดือนที่คาดหวัง (บาท)', 'Expected Salary (Baht)'),
        required: false,
        width: '50',
      },
      {
        id: 'tpl_resume',
        type: 'file',
        label: t('แนบ Resume/CV', 'Attach Resume/CV'),
        required: true,
        width: '100',
        validation: {
          acceptedFileTypes: ['.pdf', '.doc', '.docx'],
        },
        maxFileSize: 5,
      },
      {
        id: 'tpl_cover_letter',
        type: 'textarea',
        label: t('จดหมายแนะนำตัว', 'Cover Letter'),
        placeholder: t('บอกเราเกี่ยวกับตัวคุณ...', 'Tell us about yourself...'),
        required: false,
        width: '100',
      },
    ],
  },
  {
    id: 'body_order_form',
    name: 'Order Form',
    description: 'Product order form with quantity and shipping',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_order_section_customer',
        type: 'section',
        label: t('ข้อมูลลูกค้า', 'Customer Information'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_order_name',
        type: 'text',
        label: t('ชื่อ-นามสกุล', 'Full Name'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_order_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_order_phone',
        type: 'phone',
        label: t('เบอร์โทร', 'Phone'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_order_section_product',
        type: 'section',
        label: t('ข้อมูลสินค้า', 'Product Information'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_product',
        type: 'select',
        label: t('สินค้า', 'Product'),
        required: true,
        width: '50',
        options: [
          { id: 'p1', label: t('สินค้า A - ฿500', 'Product A - ฿500'), value: 'product_a' },
          { id: 'p2', label: t('สินค้า B - ฿750', 'Product B - ฿750'), value: 'product_b' },
          { id: 'p3', label: t('สินค้า C - ฿1,200', 'Product C - ฿1,200'), value: 'product_c' },
        ],
      },
      {
        id: 'tpl_quantity',
        type: 'number',
        label: t('จำนวน', 'Quantity'),
        required: true,
        width: '50',
        min: 1,
        max: 100,
      },
      {
        id: 'tpl_order_section_shipping',
        type: 'section',
        label: t('ข้อมูลจัดส่ง', 'Shipping Information'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_address',
        type: 'textarea',
        label: t('ที่อยู่จัดส่ง', 'Shipping Address'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_notes',
        type: 'textarea',
        label: t('หมายเหตุ', 'Additional Notes'),
        placeholder: t('หมายเหตุหรือคำขอพิเศษ...', 'Any special requests or notes...'),
        required: false,
        width: '100',
      },
    ],
  },
  {
    id: 'body_appointment',
    name: 'Appointment Booking',
    description: 'Schedule an appointment with date, time and contact info',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_appt_intro',
        type: 'paragraph',
        label: '',
        content: t(
          'กรุณากรอกข้อมูลเพื่อจองนัดหมาย',
          'Please fill out the form below to book your appointment.'
        ),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_appt_name',
        type: 'text',
        label: t('ชื่อ-นามสกุล', 'Full Name'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_appt_email',
        type: 'email',
        label: t('อีเมล', 'Email'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_appt_phone',
        type: 'phone',
        label: t('เบอร์โทร', 'Phone'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_appt_service',
        type: 'select',
        label: t('ประเภทบริการ', 'Service Type'),
        required: true,
        width: '100',
        options: [
          { id: 'sv1', label: t('ให้คำปรึกษา', 'Consultation'), value: 'consultation' },
          { id: 'sv2', label: t('นัดประชุม', 'Meeting'), value: 'meeting' },
          { id: 'sv3', label: t('บริการตรวจสอบ', 'Review/Check'), value: 'review' },
          { id: 'sv4', label: t('อื่นๆ', 'Other'), value: 'other' },
        ],
      },
      {
        id: 'tpl_appt_date',
        type: 'date',
        label: t('วันที่ต้องการนัด', 'Preferred Date'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_appt_time',
        type: 'time',
        label: t('เวลาที่ต้องการ', 'Preferred Time'),
        required: true,
        width: '50',
      },
      {
        id: 'tpl_appt_notes',
        type: 'textarea',
        label: t('หมายเหตุหรือคำถามเพิ่มเติม', 'Notes or Questions'),
        placeholder: t('กรุณาระบุรายละเอียดเพิ่มเติมที่ต้องการแจ้งให้ทราบ...', 'Please provide any additional details...'),
        required: false,
        width: '100',
      },
    ],
  },
  {
    id: 'body_newsletter',
    name: 'Newsletter Subscription',
    description: 'Simple newsletter signup form',
    category: 'form',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    elements: [
      {
        id: 'tpl_news_intro',
        type: 'paragraph',
        label: '',
        content: t(
          '📬 สมัครรับข่าวสารจากเรา! เราจะส่งข้อมูลที่เป็นประโยชน์ให้คุณทางอีเมล',
          '📬 Subscribe to our newsletter! Get the latest updates and news delivered to your inbox.'
        ),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_news_email',
        type: 'email',
        label: t('อีเมลของคุณ', 'Your Email'),
        placeholder: t('example@email.com', 'example@email.com'),
        required: true,
        width: '100',
      },
      {
        id: 'tpl_news_name',
        type: 'text',
        label: t('ชื่อ (ไม่บังคับ)', 'Name (Optional)'),
        required: false,
        width: '100',
      },
      {
        id: 'tpl_news_interests',
        type: 'checkbox',
        label: t('หัวข้อที่สนใจ', 'Topics of Interest'),
        required: false,
        width: '100',
        options: [
          { id: 'int1', label: t('ข่าวสารทั่วไป', 'General News'), value: 'general' },
          { id: 'int2', label: t('โปรโมชั่นและส่วนลด', 'Promotions & Discounts'), value: 'promotions' },
          { id: 'int3', label: t('ผลิตภัณฑ์ใหม่', 'New Products'), value: 'new_products' },
          { id: 'int4', label: t('บทความและเคล็ดลับ', 'Tips & Articles'), value: 'tips' },
        ],
      },
    ],
  },
];

// Built-in Header Templates
const builtInHeaderTemplates: FormTemplate[] = [
  {
    id: 'header_minimal',
    name: 'Minimal',
    description: 'Clean and simple header with centered text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_corporate_blue',
    name: 'Corporate Blue',
    description: 'Professional blue header with left-aligned text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      textAlignment: 'left',
    }
  },
  {
    id: 'header_gradient_purple',
    name: 'Gradient Purple',
    description: 'Modern gradient header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_dark',
    name: 'Dark Mode',
    description: 'Dark background with light text',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      textAlignment: 'center',
    }
  },
  {
    id: 'header_warm',
    name: 'Warm Orange',
    description: 'Friendly warm-toned header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#ea580c',
      textColor: '#ffffff',
      textAlignment: 'left',
    }
  },
  {
    id: 'header_nature',
    name: 'Nature Green',
    description: 'Fresh green header',
    category: 'header',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    headerStyle: {
      backgroundColor: '#16a34a',
      textColor: '#ffffff',
      textAlignment: 'center',
    }
  },
];

// Built-in Footer Templates
const builtInFooterTemplates: FormTemplate[] = [
  {
    id: 'footer_minimal',
    name: 'Minimal',
    description: 'Simple footer with centered text',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#f8fafc',
      textColor: '#64748b',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_dark',
    name: 'Dark Footer',
    description: 'Dark background footer',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#1e293b',
      textColor: '#94a3b8',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_branded',
    name: 'Branded Blue',
    description: 'Blue branded footer',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: '#1e40af',
      textColor: '#bfdbfe',
      textAlignment: 'center',
    }
  },
  {
    id: 'footer_transparent',
    name: 'Transparent',
    description: 'No background, subtle text',
    category: 'footer',
    isBuiltIn: true,
    createdAt: '2024-01-01',
    footerStyle: {
      backgroundColor: 'transparent',
      textColor: '#94a3b8',
      textAlignment: 'center',
    }
  },
];

interface TemplateManagerProps {
  currentMetadata: FormMetadata;
  currentLanguage: string;
  currentElements: FormElement[];
  currentPages: FormPage[];
  onApplyHeader: (style: FormTemplate['headerStyle']) => void;
  onApplyFooter: (style: FormTemplate['footerStyle']) => void;
  onApplyBody: (elements: FormElement[], mode: 'replace' | 'append') => void;
  onSaveAsTemplate: (name: string, category: TemplateCategory) => void;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentMetadata,
  currentLanguage,
  currentElements,
  currentPages,
  onApplyHeader,
  onApplyFooter,
  onApplyBody,
  onSaveAsTemplate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'body'>('header');
  const [userTemplates, setUserTemplates] = useState<FormTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [applyBodyMode, setApplyBodyMode] = useState<'replace' | 'append'>('replace');
  const [showApplyBodyConfirm, setShowApplyBodyConfirm] = useState<FormTemplate | null>(null);

  // Load user templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      try {
        setUserTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, []);

  // Save user templates to localStorage
  const saveUserTemplates = (templates: FormTemplate[]) => {
    setUserTemplates(templates);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) return;

    let newTemplate: FormTemplate;
    
    if (activeTab === 'body') {
      // Save current form elements as body template
      newTemplate = {
        id: `user_body_${Date.now()}`,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
        category: 'form',
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        elements: currentElements.map(el => ({
          ...el,
          id: el.id, // Keep original IDs, will be regenerated when applied
        })),
        pages: currentPages,
      };
    } else if (activeTab === 'header') {
      newTemplate = {
        id: `user_header_${Date.now()}`,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
        category: 'header',
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        headerStyle: {
          backgroundColor: currentMetadata.headerBackgroundColor,
          textColor: currentMetadata.headerTitleColor,
          textAlignment: currentMetadata.headerTextAlignment,
          logoUrl: currentMetadata.logoUrl,
          logoPlacement: currentMetadata.logoPlacement,
          logoAlignment: currentMetadata.logoAlignment,
          logoWidth: currentMetadata.logoWidth,
          title: currentMetadata.title,
          description: currentMetadata.description,
        }
      };
    } else {
      newTemplate = {
        id: `user_footer_${Date.now()}`,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
        category: 'footer',
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        footerStyle: {
          backgroundColor: currentMetadata.footerBackgroundColor,
          textColor: currentMetadata.footerTextColor,
          textAlignment: 'center',
          footerText: currentMetadata.footerText,
        }
      };
    }

    saveUserTemplates([...userTemplates, newTemplate]);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setShowSaveModal(false);
  };

  const handleDeleteUserTemplate = (templateId: string) => {
    saveUserTemplates(userTemplates.filter(t => t.id !== templateId));
  };

  // Handle applying body template
  const handleApplyBodyTemplate = (template: FormTemplate, mode: 'replace' | 'append') => {
    if (!template || !template.elements || template.elements.length === 0) {
      console.error('Template has no elements:', template);
      return;
    }
    
    // Generate new unique IDs for elements
    const newElements: FormElement[] = template.elements.map(el => ({
      ...el,
      id: generateId(),
      options: el.options?.map(opt => ({
        ...opt,
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    })) as FormElement[];
    
    onApplyBody(newElements, mode);
    setShowApplyBodyConfirm(null);
  };

  const getTemplatesForTab = () => {
    if (activeTab === 'header') {
      return [...builtInHeaderTemplates, ...userTemplates.filter(t => t.category === 'header')];
    } else if (activeTab === 'footer') {
      return [...builtInFooterTemplates, ...userTemplates.filter(t => t.category === 'footer')];
    } else {
      return [...builtInBodyTemplates, ...userTemplates.filter(t => t.category === 'form')];
    }
  };

  const allTemplates = getTemplatesForTab();

  const renderPreview = (template: FormTemplate) => {
    // Body template preview
    if (template.category === 'form') {
      const elementCount = template.elements?.length || 0;
      const elementTypes = template.elements?.map(e => e.type) || [];
      const uniqueTypes = [...new Set(elementTypes)];
      
      return (
        <div className="h-24 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-2 overflow-hidden">
          <div className="flex flex-col gap-1">
            {template.elements?.slice(0, 4).map((el, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[10px]">
                  {el.type === 'text' ? '📝' : 
                   el.type === 'email' ? '✉️' : 
                   el.type === 'phone' ? '📞' : 
                   el.type === 'textarea' ? '📄' :
                   el.type === 'select' ? '📋' :
                   el.type === 'radio' ? '🔘' :
                   el.type === 'checkbox' ? '☑️' :
                   el.type === 'number' ? '🔢' :
                   el.type === 'date' ? '📅' :
                   el.type === 'rating' ? '⭐' :
                   el.type === 'file' ? '📎' :
                   el.type === 'section' ? '📁' :
                   el.type === 'paragraph' ? '📃' :
                   '📦'}
                </span>
                <div className="h-2 bg-slate-300 rounded flex-1" style={{ maxWidth: `${60 + Math.random() * 30}%` }}></div>
              </div>
            ))}
            {(template.elements?.length || 0) > 4 && (
              <div className="text-[10px] text-slate-400 text-center">+{(template.elements?.length || 0) - 4} more</div>
            )}
          </div>
        </div>
      );
    }
    
    // Header/Footer preview
    const isHeader = template.category === 'header';
    const style = isHeader ? template.headerStyle : template.footerStyle;
    const bgColor = style?.backgroundColor || '#ffffff';
    const textColor = style?.textColor || '#000000';
    const textAlign = style?.textAlignment || 'center';

    return (
      <div 
        className="h-16 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ 
          background: bgColor,
          color: textColor,
        }}
      >
        <div style={{ textAlign: textAlign as any }} className="px-3 w-full">
          {isHeader ? (
            <>
              <div className="font-bold text-sm truncate">Form Title</div>
              <div className="text-xs opacity-75 truncate">Description text</div>
            </>
          ) : (
            <div className="text-xs truncate">Footer text here</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Template Manager</h2>
              <p className="text-violet-200 text-sm">Manage header, footer and body templates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('header')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'header'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              🎨 Header
            </button>
            <button
              onClick={() => setActiveTab('footer')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'footer'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 Footer
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'body'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📝 Body (Form Elements)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Save Current Button */}
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-violet-900">
                  {activeTab === 'header' ? 'Current Header' : activeTab === 'footer' ? 'Current Footer' : 'Current Form Elements'}
                </h3>
                <p className="text-sm text-violet-700">
                  {activeTab === 'body' 
                    ? `Save your current ${currentElements.length} element(s) as a reusable template`
                    : 'Save your current design as a reusable template'}
                </p>
              </div>
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={activeTab === 'body' && currentElements.length === 0}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save as Template
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allTemplates.map(template => (
              <div 
                key={template.id}
                className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-violet-400 hover:shadow-lg transition-all group"
              >
                {/* Preview */}
                <div className="p-3 bg-slate-50">
                  {renderPreview(template)}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate">{template.name}</h4>
                      {template.description && (
                        <p className="text-xs text-slate-500 truncate">{template.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {template.isBuiltIn ? (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">Built-in</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">Custom</span>
                        )}
                        {template.category === 'form' && template.elements && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                            {template.elements.length} elements
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {activeTab === 'body' ? (
                      <button
                        onClick={() => setShowApplyBodyConfirm(template)}
                        className="flex-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        Apply
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeTab === 'header') {
                            onApplyHeader(template.headerStyle);
                          } else {
                            onApplyFooter(template.footerStyle);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                    {!template.isBuiltIn && (
                      <button
                        onClick={() => handleDeleteUserTemplate(template.id)}
                        className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete template"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Save {activeTab === 'header' ? 'Header' : activeTab === 'footer' ? 'Footer' : 'Body'} Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={activeTab === 'body' ? 'e.g., Contact Form Layout' : 'e.g., My Custom Header'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              {activeTab === 'body' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Will save {currentElements.length} element(s) from your current form</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Body Template Confirm Modal */}
      {showApplyBodyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Apply Body Template
            </h3>
            <p className="text-slate-600 mb-4">
              How would you like to apply "<span className="font-medium">{showApplyBodyConfirm.name}</span>"?
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-violet-400 transition-colors"
                style={{ borderColor: applyBodyMode === 'replace' ? '#8b5cf6' : '#e2e8f0' }}>
                <input
                  type="radio"
                  name="applyMode"
                  value="replace"
                  checked={applyBodyMode === 'replace'}
                  onChange={() => setApplyBodyMode('replace')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-slate-800">Replace All</div>
                  <div className="text-sm text-slate-500">Remove all existing elements and replace with template</div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-violet-400 transition-colors"
                style={{ borderColor: applyBodyMode === 'append' ? '#8b5cf6' : '#e2e8f0' }}>
                <input
                  type="radio"
                  name="applyMode"
                  value="append"
                  checked={applyBodyMode === 'append'}
                  onChange={() => setApplyBodyMode('append')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-slate-800">Append to End</div>
                  <div className="text-sm text-slate-500">Add template elements after existing elements</div>
                </div>
              </label>
            </div>

            {applyBodyMode === 'replace' && currentElements.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>This will remove your {currentElements.length} existing element(s)</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApplyBodyConfirm(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showApplyBodyConfirm) {
                    handleApplyBodyTemplate(showApplyBodyConfirm, applyBodyMode);
                  }
                }}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
