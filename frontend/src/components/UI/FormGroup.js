import { useMemo } from "react";
import { ipfsPathToURL } from "../../helpers/ipfs";

function FormGroup(props) {
  let className =
    props.formField.type === "file" ? "custom-file-input" : "form-control";

  if (props.hasError) {
    className += " is-invalid";
  }

  const [previewSrc, fileInputLabel] = useMemo(() => {
    let source = props.previewSrc;
    let label = "[Choose file]";
    if (props.formField.enteredFiles && props.formField.enteredFiles[0]) {
      source = URL.createObjectURL(props.formField.enteredFiles[0]);
      label = props.formField.enteredFiles[0].name;
    } else if (source) {
      source = ipfsPathToURL(props.previewSrc);
      label = "[Change file]";
    }

    return [source, label];
  }, [props.formField.enteredFiles, props.previewSrc]);

  console.log("previewSrc", previewSrc);

  let inputField;
  if (props.formField.type === "textarea") {
    inputField = (
      <textarea
        name={props.formField.id}
        id={props.formField.id}
        onChange={props.valueChangeHandler}
        onBlur={props.inputBlurHandler}
        value={props.formField.value ? props.formField.value : ""}
        placeholder={props.formField.placeholder}
        rows={props.formField.rows}
        className={className}
        disabled={props.disabled}
      />
    );
  } else {
    inputField = (
      <input
        type={props.formField.type}
        name={props.formField.id}
        id={props.formField.id}
        onChange={props.valueChangeHandler}
        onBlur={props.inputBlurHandler}
        value={props.formField.value ? props.formField.value : ""}
        placeholder={props.formField.placeholder}
        step={props.formField.step}
        className={className}
        disabled={props.disabled}
        accept="image/*, video/mp4"
      />
    );
  }

  return (
    <div className="form-group">
      {props.formField.label && (
        <label htmlFor={props.formField.id}>{props.formField.label}</label>
      )}
      {previewSrc && (
        <div>
          <video
            key={previewSrc}
            autoPlay
            muted
            loop
            poster={previewSrc}
            className={props.previewClass}
          >
            <source src={previewSrc} />
          </video>
        </div>
      )}
      <div className={props.formField.type === "file" ? "custom-file" : ""}>
        {inputField}
        {props.formField.type === "file" && (
          <label className="custom-file-label" htmlFor="customFile">
            {fileInputLabel}
          </label>
        )}
        <div className="invalid-feedback">{props.hasError}</div>
      </div>
    </div>
  );
}

export default FormGroup;
