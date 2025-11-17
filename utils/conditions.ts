
import { FormElement, FormValues, Condition } from '../types';

const checkCondition = (condition: Condition, formValues: FormValues): boolean => {
    const targetValue = formValues[condition.targetId];

    // For checkboxes, the value is a boolean. Convert condition value to boolean for comparison.
    if (typeof targetValue === 'boolean') {
        const conditionValueBool = condition.value.toLowerCase() === 'true';
        switch (condition.operator) {
            case 'equals': return targetValue === conditionValueBool;
            case 'not_equals': return targetValue !== conditionValueBool;
            default: return false; // 'contains' is not applicable for booleans
        }
    }
    
    const conditionValue = condition.value;

    switch (condition.operator) {
        case 'equals':
            return targetValue == conditionValue;
        case 'not_equals':
            return targetValue != conditionValue;
        case 'contains':
            return typeof targetValue === 'string' && targetValue.includes(conditionValue);
        default:
            return false;
    }
};

export const evaluateConditions = (element: FormElement, formValues: FormValues): { visible: boolean; enabled: boolean } => {
    if (element.conditions.length === 0) {
        return { visible: true, enabled: true };
    }

    let isVisible = true;
    let isEnabled = true;

    element.conditions.forEach(condition => {
        const result = checkCondition(condition, formValues);
        if (result) {
            if (condition.action === 'hide') isVisible = false;
            if (condition.action === 'disable') isEnabled = false;
        } else {
            if (condition.action === 'show') isVisible = false;
            if (condition.action === 'enable') isEnabled = false;
        }
    });
    
    // Complex logic: what if one rule says show and another says hide?
    // Current logic: the last matching rule wins. This can be improved.
    // A better approach might be to default to visible/enabled and only change if a condition is met.
    
    // Simplified approach: Default to visible unless a 'show' condition is not met or a 'hide' condition is met.
    // Default to enabled unless an 'enable' condition is not met or a 'disable' condition is met.

    const showConditions = element.conditions.filter(c => c.action === 'show');
    const hideConditions = element.conditions.filter(c => c.action === 'hide');
    const enableConditions = element.conditions.filter(c => c.action === 'enable');
    const disableConditions = element.conditions.filter(c => c.action === 'disable');

    // Visibility logic
    if (showConditions.length > 0) {
        isVisible = showConditions.some(c => checkCondition(c, formValues));
    }
    if (hideConditions.some(c => checkCondition(c, formValues))) {
        isVisible = false;
    }

    // Enabled logic
    if (enableConditions.length > 0) {
        isEnabled = enableConditions.some(c => checkCondition(c, formValues));
    }
    if (disableConditions.some(c => checkCondition(c, formValues))) {
        isEnabled = false;
    }

    return { visible: isVisible, enabled: isEnabled };
};
