import { ipfsPathToURL } from "../../helpers/ipfs";

function FormGroup(props) {
  let className =
    props.formField.type === "file" ? "custom-file-input" : "form-control";

  if (props.hasError) {
    className += " is-invalid";
  }

  let previewSrc = props.previewSrc;
  let imageInputLabel = "[Choose image]";
  if (props.formField.enteredFiles && props.formField.enteredFiles[0]) {
    previewSrc = URL.createObjectURL(props.formField.enteredFiles[0]);
    imageInputLabel = props.formField.enteredFiles[0].name;
  } else if (previewSrc) {
    previewSrc = ipfsPathToURL(props.previewSrc);
    imageInputLabel = "[Change image]";
  }

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
          <img
            accept="image/*"
            src={previewSrc}
            alt="Profile"
            className={props.previewClass}
          />
        </div>
      )}
      <div className={props.formField.type === "file" ? "custom-file" : ""}>
        {inputField}
        {props.formField.type === "file" && (
          <label className="custom-file-label" htmlFor="customFile">
            {imageInputLabel}
          </label>
        )}
        <div className="invalid-feedback">{props.hasError}</div>
      </div>
    </div>
  );
}

export default FormGroup;
