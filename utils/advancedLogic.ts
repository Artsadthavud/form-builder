/**
 * Advanced Logic Utilities
 * - Condition evaluation (extended operators)
 * - Field calculation
 * - Piping (answer recall)
 * - Skip logic evaluation
 */

import { 
  Condition, 
  ConditionOperator, 
  Calculation, 
  CalculationStep,
  SkipRule,
  FormElement 
} from '../types';

// ============================================
// Condition Evaluation
// ============================================

/**
 * Evaluate a single condition against form data
 */
export function evaluateCondition(
  condition: Condition, 
  formData: Record<string, any>
): boolean {
  const targetValue = formData[condition.targetId];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(targetValue ?? '') === String(conditionValue);
    
    case 'not_equals':
      return String(targetValue ?? '') !== String(conditionValue);
    
    case 'contains':
      return String(targetValue ?? '').toLowerCase().includes(String(conditionValue).toLowerCase());
    
    case 'not_contains':
      return !String(targetValue ?? '').toLowerCase().includes(String(conditionValue).toLowerCase());
    
    case 'is_empty':
      return targetValue === undefined || targetValue === null || targetValue === '' || 
        (Array.isArray(targetValue) && targetValue.length === 0);
    
    case 'is_not_empty':
      return targetValue !== undefined && targetValue !== null && targetValue !== '' &&
        !(Array.isArray(targetValue) && targetValue.length === 0);
    
    case 'greater_than':
      return parseFloat(targetValue) > parseFloat(conditionValue);
    
    case 'less_than':
      return parseFloat(targetValue) < parseFloat(conditionValue);
    
    case 'greater_equal':
      return parseFloat(targetValue) >= parseFloat(conditionValue);
    
    case 'less_equal':
      return parseFloat(targetValue) <= parseFloat(conditionValue);
    
    case 'starts_with':
      return String(targetValue ?? '').toLowerCase().startsWith(String(conditionValue).toLowerCase());
    
    case 'ends_with':
      return String(targetValue ?? '').toLowerCase().endsWith(String(conditionValue).toLowerCase());
    
    case 'not_starts_with':
      return !String(targetValue ?? '').toLowerCase().startsWith(String(conditionValue).toLowerCase());
    
    case 'not_ends_with':
      return !String(targetValue ?? '').toLowerCase().endsWith(String(conditionValue).toLowerCase());
    
    default:
      return true;
  }
}

/**
 * Evaluate multiple conditions with AND/OR combinator
 */
export function evaluateConditions(
  conditions: Condition[],
  combinator: 'AND' | 'OR',
  formData: Record<string, any>
): boolean {
  if (conditions.length === 0) return true;

  const results = conditions.map(cond => evaluateCondition(cond, formData));

  if (combinator === 'AND') {
    return results.every(Boolean);
  } else {
    return results.some(Boolean);
  }
}

/**
 * Check if an element should be visible based on its logic rules
 */
export function isElementVisible(
  element: FormElement,
  formData: Record<string, any>
): boolean {
  if (!element.logic || element.logic.conditions.length === 0) {
    return true;
  }

  const { conditions, combinator, action = 'show' } = element.logic;
  const conditionsMet = evaluateConditions(conditions, combinator, formData);

  // action = 'show' means show when conditions met, hide otherwise
  // action = 'hide' means hide when conditions met, show otherwise
  return action === 'show' ? conditionsMet : !conditionsMet;
}

// ============================================
// Calculation
// ============================================

/**
 * Get numeric value from form data for a field
 */
function getFieldNumericValue(fieldId: string, formData: Record<string, any>): number {
  const value = formData[fieldId];
  if (value === undefined || value === null || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate value based on calculation formula
 */
export function calculateValue(
  calculation: Calculation,
  formData: Record<string, any>
): number {
  if (!calculation.enabled || calculation.formula.length === 0) {
    return 0;
  }

  let result = 0;
  let pendingOperator: '+' | '-' | '*' | '/' | '%' | undefined;

  for (const step of calculation.formula) {
    // Get operand value
    let operandValue: number;
    if (step.operand.type === 'constant') {
      operandValue = step.operand.value ?? 0;
    } else {
      operandValue = getFieldNumericValue(step.operand.fieldId!, formData);
    }

    // Apply pending operator
    if (pendingOperator === undefined) {
      result = operandValue;
    } else {
      switch (pendingOperator) {
        case '+':
          result += operandValue;
          break;
        case '-':
          result -= operandValue;
          break;
        case '*':
          result *= operandValue;
          break;
        case '/':
          result = operandValue !== 0 ? result / operandValue : 0;
          break;
        case '%':
          result = operandValue !== 0 ? result % operandValue : 0;
          break;
      }
    }

    // Set next operator
    pendingOperator = step.operator;
  }

  // Apply decimal places
  if (calculation.decimalPlaces !== undefined) {
    const factor = Math.pow(10, calculation.decimalPlaces);
    result = Math.round(result * factor) / factor;
  }

  return result;
}

/**
 * Format calculated value with prefix/suffix
 */
export function formatCalculatedValue(
  value: number,
  calculation: Calculation
): string {
  const prefix = calculation.prefix || '';
  const suffix = calculation.suffix || '';
  const formatted = calculation.decimalPlaces !== undefined 
    ? value.toFixed(calculation.decimalPlaces)
    : String(value);
  return `${prefix}${formatted}${suffix}`;
}

// ============================================
// Piping (Answer Recall)
// ============================================

/**
 * Pattern to match piping tokens: {answer:field_id} or {answer:field_id|fallback}
 */
const PIPE_PATTERN = /\{answer:([^}|]+)(?:\|([^}]*))?\}/g;

/**
 * Extract piped field IDs from a string
 */
export function extractPipedFieldIds(text: string): string[] {
  const ids: string[] = [];
  let match;
  
  // Reset regex
  PIPE_PATTERN.lastIndex = 0;
  
  while ((match = PIPE_PATTERN.exec(text)) !== null) {
    const fieldId = match[1].trim();
    if (!ids.includes(fieldId)) {
      ids.push(fieldId);
    }
  }
  
  return ids;
}

/**
 * Replace piping tokens with actual values from form data
 */
export function resolvePiping(
  text: string,
  formData: Record<string, any>,
  elements?: FormElement[]
): string {
  // Reset regex
  PIPE_PATTERN.lastIndex = 0;
  
  return text.replace(PIPE_PATTERN, (_, fieldId: string, fallback?: string) => {
    const trimmedId = fieldId.trim();
    const value = formData[trimmedId];
    
    // If value exists and is not empty
    if (value !== undefined && value !== null && value !== '') {
      // For arrays (checkboxes), join with comma
      if (Array.isArray(value)) {
        // Try to get labels from elements if available
        if (elements) {
          const element = elements.find(el => el.id === trimmedId);
          if (element?.options) {
            const labels = value.map(v => {
              const opt = element.options?.find(o => o.value === v);
              return opt ? (typeof opt.label === 'string' ? opt.label : opt.label.th) : v;
            });
            return labels.join(', ');
          }
        }
        return value.join(', ');
      }
      
      // For select/radio, try to get the label
      if (elements) {
        const element = elements.find(el => el.id === trimmedId);
        if (element?.options) {
          const opt = element.options.find(o => o.value === value);
          if (opt) {
            return typeof opt.label === 'string' ? opt.label : opt.label.th;
          }
        }
      }
      
      return String(value);
    }
    
    // Return fallback or empty string
    return fallback?.trim() || '';
  });
}

/**
 * Check if text contains piping tokens
 */
export function hasPiping(text: string): boolean {
  PIPE_PATTERN.lastIndex = 0;
  return PIPE_PATTERN.test(text);
}

// ============================================
// Skip Logic
// ============================================

/**
 * Determine the next page based on skip rules
 * @returns target page ID or null to continue normally
 */
export function evaluateSkipRules(
  skipRules: SkipRule[] | undefined,
  formData: Record<string, any>,
  allPageIds: string[]
): string | null {
  if (!skipRules || skipRules.length === 0) {
    return null;
  }

  for (const rule of skipRules) {
    const conditionsMet = evaluateConditions(rule.conditions, rule.combinator, formData);
    if (conditionsMet && allPageIds.includes(rule.targetPageId)) {
      return rule.targetPageId;
    }
  }

  return null;
}

/**
 * Get all available operator labels (for UI)
 */
export const operatorLabels: Record<ConditionOperator, { th: string; en: string }> = {
  equals: { th: 'เท่ากับ', en: 'Equals' },
  not_equals: { th: 'ไม่เท่ากับ', en: 'Is not equal to' },
  contains: { th: 'มีคำว่า', en: 'Contains' },
  not_contains: { th: 'ไม่มีคำว่า', en: 'Does not contain' },
  is_empty: { th: 'ว่างเปล่า (NULL)', en: 'Is NULL' },
  is_not_empty: { th: 'ไม่ว่างเปล่า (NOT NULL)', en: 'Is not NULL' },
  greater_than: { th: 'มากกว่า', en: 'Greater than' },
  less_than: { th: 'น้อยกว่า', en: 'Less than' },
  greater_equal: { th: 'มากกว่าหรือเท่ากับ', en: 'Greater or equal' },
  less_equal: { th: 'น้อยกว่าหรือเท่ากับ', en: 'Less or equal' },
  starts_with: { th: 'เริ่มต้นด้วย', en: 'Starts with' },
  ends_with: { th: 'ลงท้ายด้วย', en: 'Ends with' },
  not_starts_with: { th: 'ไม่เริ่มต้นด้วย', en: 'Does not start with' },
  not_ends_with: { th: 'ไม่ลงท้ายด้วย', en: 'Does not end with' },
};

/**
 * Get operators suitable for a field type
 */
export function getOperatorsForType(fieldType: string): ConditionOperator[] {
  const textOperators: ConditionOperator[] = [
    'equals', 'not_equals', 'contains', 'not_contains', 
    'starts_with', 'not_starts_with', 'ends_with', 'not_ends_with',
    'is_empty', 'is_not_empty'
  ];
  
  const numericOperators: ConditionOperator[] = [
    'equals', 'not_equals', 'is_empty', 'is_not_empty',
    'greater_than', 'less_than', 'greater_equal', 'less_equal'
  ];
  
  const choiceOperators: ConditionOperator[] = [
    'equals', 'not_equals', 'is_empty', 'is_not_empty', 'contains'
  ];

  switch (fieldType) {
    case 'number':
    case 'rating':
      return numericOperators;
    case 'select':
    case 'radio':
    case 'checkbox':
      return choiceOperators;
    case 'date':
    case 'time':
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty', 'greater_than', 'less_than'];
    default:
      return textOperators;
  }
}
