
export enum FormFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SELECT = 'select',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
}

export type ViewMode = 'design' | 'preview';

export type WidthOption = 'w-full' | 'w-1/2' | 'w-1/3' | 'w-2/3';

export interface FormElementOption {
  id: string;
  label: string;
  value: string;
}

export type ConditionAction = 'show' | 'hide' | 'enable' | 'disable';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains';

export interface Condition {
  id: string;
  targetId: string;
  operator: ConditionOperator;
  value: string;
  action: ConditionAction;
}

interface BaseFormElement {
  id: string;
  type: FormFieldType;
  label: string;
  width: WidthOption;
  conditions: Condition[];
}

export interface InputElement extends BaseFormElement {
  type: FormFieldType.TEXT | FormFieldType.EMAIL | FormFieldType.PASSWORD | FormFieldType.NUMBER;
  placeholder: string;
  required: boolean;
}

export interface TextAreaElement extends BaseFormElement {
  type: FormFieldType.TEXTAREA;
  placeholder: string;
  required: boolean;
  rows: number;
}

export interface CheckboxElement extends BaseFormElement {
  type: FormFieldType.CHECKBOX;
  required: boolean;
}

export interface RadioElement extends BaseFormElement {
  type: FormFieldType.RADIO;
  options: FormElementOption[];
  required: boolean;
}

export interface SelectElement extends BaseFormElement {
  type: FormFieldType.SELECT;
  options: FormElementOption[];
  required: boolean;
}

export interface HeadingElement extends BaseFormElement {
    type: FormFieldType.HEADING;
    text: string;
    level: 'h1' | 'h2' | 'h3' | 'h4';
}

export interface ParagraphElement extends BaseFormElement {
    type: FormFieldType.PARAGRAPH;
    text: string;
}

export type FormElement = InputElement | TextAreaElement | CheckboxElement | RadioElement | SelectElement | HeadingElement | ParagraphElement;

export type FormValues = Record<string, any>;
