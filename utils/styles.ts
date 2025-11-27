import { FormElement } from '../types';
import type { CSSProperties } from 'react';

export function buildCustomStyles(element: FormElement): CSSProperties {
  if (!element.customStyles) return {};
  
  const styles: CSSProperties = {};
  
  if (element.customStyles.backgroundColor) {
    styles.backgroundColor = element.customStyles.backgroundColor;
  }
  if (element.customStyles.textColor) {
    styles.color = element.customStyles.textColor;
  }
  if (element.customStyles.borderColor) {
    styles.borderColor = element.customStyles.borderColor;
  }
  if (element.customStyles.borderWidth) {
    styles.borderWidth = element.customStyles.borderWidth;
  }
  if (element.customStyles.borderRadius) {
    styles.borderRadius = element.customStyles.borderRadius;
  }
  if (element.customStyles.fontSize) {
    styles.fontSize = element.customStyles.fontSize;
  }
  if (element.customStyles.fontWeight) {
    styles.fontWeight = element.customStyles.fontWeight;
  }
  if (element.customStyles.padding) {
    styles.padding = element.customStyles.padding;
  }
  if (element.customStyles.margin) {
    styles.margin = element.customStyles.margin;
  }
  
  return styles;
}

export function buildCustomClasses(element: FormElement): string {
  return element.customClass || '';
}

export function mergeStyles(baseStyle: CSSProperties, customStyle: CSSProperties): CSSProperties {
  return { ...baseStyle, ...customStyle };
}
