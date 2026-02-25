import { useRef } from "react";

/**
 * useFormValidation Hook
 * Provides shake animation for field validation errors
 * Usage:
 *   const { shakeField } = useFormValidation();
 *   // Trigger shake on validation error
 *   if (error) shakeField('fieldId');
 */
export function useFormValidation() {
  const fieldsRef = useRef<Record<string, HTMLElement | null>>({});

  const shakeField = (fieldId: string) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing animation
    field.classList.remove("animate-shake");
    
    // Trigger reflow to restart animation
    void field.offsetWidth;
    
    // Add animation
    field.classList.add("animate-shake");

    // Remove animation class after it completes
    setTimeout(() => {
      field.classList.remove("animate-shake");
    }, 400);
  };

  const registerField = (fieldId: string, element: HTMLElement | null) => {
    if (element) {
      fieldsRef.current[fieldId] = element;
    }
  };

  const shakeAllInvalidFields = (errorFields: string[]) => {
    errorFields.forEach((fieldId) => {
      shakeField(fieldId);
    });
  };

  return {
    shakeField,
    registerField,
    shakeAllInvalidFields,
  };
}
