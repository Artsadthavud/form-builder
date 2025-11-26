import { FormElement, Condition } from '../types';

/**
 * Helper functions for conditional logic
 */

export const checkCondition = (
  condition: Condition,
  formData: Record<string, any>
): boolean => {
  const targetValue = formData[condition.targetId];
  const condVal = condition.value;

  // Handle undefined/null values
  if (targetValue === undefined || targetValue === null || targetValue === '') {
    if (condition.operator === 'not_equals' && condVal !== '') return true;
    if (condition.operator === 'not_contains') return true;
    return false;
  }

  // Handle array values (checkboxes)
  if (Array.isArray(targetValue)) {
    const stringArray = targetValue.map(String);
    switch (condition.operator) {
      case 'contains':
        return stringArray.includes(condVal);
      case 'not_contains':
        return !stringArray.includes(condVal);
      case 'equals':
        return stringArray.sort().join(',') === condVal;
      case 'not_equals':
        return stringArray.sort().join(',') !== condVal;
      default:
        return false;
    }
  }

  // Handle string/number values
  const valStr = String(targetValue);
  switch (condition.operator) {
    case 'equals':
      return valStr === condVal;
    case 'not_equals':
      return valStr !== condVal;
    case 'contains':
      return valStr.toLowerCase().includes(condVal.toLowerCase());
    case 'not_contains':
      return !valStr.toLowerCase().includes(condVal.toLowerCase());
    default:
      return false;
  }
};

export const isElementVisible = (
  element: FormElement,
  formData: Record<string, any>,
  visibleElements: Set<string>
): boolean => {
  // Check parent visibility first
  if (element.parentId && !visibleElements.has(element.parentId)) {
    return false;
  }

  // If no logic, element is visible
  if (!element.logic || element.logic.conditions.length === 0) {
    return true;
  }

  // Check all conditions
  const results = element.logic.conditions.map(cond => 
    checkCondition(cond, formData)
  );

  // Apply combinator
  return element.logic.combinator === 'AND'
    ? results.every(r => r)
    : results.some(r => r);
};

export const calculateVisibleElements = (
  elements: FormElement[],
  formData: Record<string, any>,
  maxIterations: number = 10
): Set<string> => {
  const visible = new Set<string>();
  let changed = true;
  let iterations = 0;

  // Iteratively calculate visibility (handles nested dependencies)
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const element of elements) {
      const shouldBeVisible = isElementVisible(element, formData, visible);
      const isCurrentlyVisible = visible.has(element.id);

      if (shouldBeVisible && !isCurrentlyVisible) {
        visible.add(element.id);
        changed = true;
      } else if (!shouldBeVisible && isCurrentlyVisible) {
        visible.delete(element.id);
        changed = true;
      }
    }
  }

  return visible;
};

export const getLogicDescription = (
  element: FormElement,
  allElements: FormElement[]
): string | null => {
  if (!element.logic || element.logic.conditions.length === 0) {
    return null;
  }

  const conditionDescriptions = element.logic.conditions.map(cond => {
    const targetElement = allElements.find(el => el.id === cond.targetId);
    if (!targetElement) return null;

    const targetLabel = typeof targetElement.label === 'string'
      ? targetElement.label
      : targetElement.label.th || targetElement.label.en;

    const operatorText = {
      equals: 'is',
      not_equals: 'is not',
      contains: 'contains',
      not_contains: 'does not contain'
    }[cond.operator];

    return `"${targetLabel}" ${operatorText} "${cond.value}"`;
  }).filter(Boolean);

  if (conditionDescriptions.length === 0) return null;

  const combinator = element.logic.combinator === 'AND' ? 'AND' : 'OR';
  return conditionDescriptions.join(` ${combinator} `);
};
