import { useCallback, useState } from "react";

function mergeAttributes(prev, key, changedAttrs) {
  return {
    ...prev,
    [key]: { ...prev[key], ...changedAttrs },
  };
}

/**
 * Hook to manage the form input fields states
 *
 * @param {object} initialValues input fields initial values
 * {
 *    fieldId: {
 *      type: "text",
 *      id: "name",
 *      label: "Input label",
 *      placeholder: "Input placeholder",
 *      value: "Some value",
 *      isTouched: true, // set automatically
 *      enteredFiles: [], // set automatically only when input type = file
 *      validator: (field) => { return "Error message" } // validates and return error
 *    }
 * }
 * @returns
 */
export function useFormFields(initialValues) {
  const [formFields, setFormFields] = useState(initialValues);

  const hasError = (key) => {
    if (key.isTouched && key.validator) {
      return key.validator(key, formFields);
    }

    return null;
  };

  const validateForm = useCallback(() => {
    let isValid = true;

    for (const key in formFields) {
      if (
        formFields[key].validator &&
        formFields[key].validator(formFields[key], formFields)
      ) {
        isValid = false;
        break;
      }
    }

    for (const key in formFields) {
      // create function and execute blur
      createInputBlurHandler(key)();
    }

    return isValid;
  }, [formFields]);

  const resetForm = useCallback(() => {
    for (const key in formFields) {
      formFields[key].isTouched = false;
      formFields[key].value = "";
    }

    setFormFields(formFields);
  }, [formFields]);

  const createValueChangeHandler = (key) => (event) => {
    const changedAttrs = {};

    if (event.target.type === "file") {
      changedAttrs.enteredFiles = event.target.files;
      // file input is not marked touched when opening file explorer dialog,
      // instead we mark it in here
      changedAttrs.isTouched = true;
    }
    changedAttrs.value = event.target.value;
    setFormFields((prev) => mergeAttributes(prev, key, changedAttrs));
  };

  const createInputBlurHandler = (key) => (event) => {
    if (event !== undefined && event.target.type === "file") {
      // file input should not be marked as touched when opening the file explorer
      return;
    }

    const changedAttrs = { isTouched: true };
    setFormFields((prev) => mergeAttributes(prev, key, changedAttrs));
  };

  return {
    formFields,
    createValueChangeHandler,
    createInputBlurHandler,
    validateForm,
    hasError,
    resetForm,
  };
}
