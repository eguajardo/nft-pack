import { useState } from "react";

const useInput = (validateValue) => {
  const [enteredValue, setEnteredValue] = useState("");
  const [enteredFiles, setEnteredFiles] = useState([]);
  const [isTouched, setIsTouched] = useState(false);

  const valueIsValid = validateValue(enteredValue);
  const hasError = !valueIsValid && isTouched;

  const valueChangeHandler = (event) => {
    if (event.target.type === "file") {
      setEnteredFiles(event.target.files);
      // file input is not marked touched when opening file explorer dialog,
      // instead we mark it in here
      setIsTouched(true);
    }
    setEnteredValue(event.target.value);
  };

  const inputBlurHandler = (event) => {
    if (event !== undefined && event.target.type === "file") {
      // file input should not be marked as touched when opening the file explorer
      return;
    }

    setIsTouched(true);
  };

  const reset = () => {
    setEnteredValue("");
    setIsTouched(false);
  };

  return {
    value: enteredValue,
    files: enteredFiles,
    isValid: valueIsValid,
    hasError,
    valueChangeHandler,
    inputBlurHandler,
    reset,
  };
};

export default useInput;
