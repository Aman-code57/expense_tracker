import React from "react";
import "./InputField.css";

const InputField = ({ field, value, error, onChange, onBlur, handleChange, handleBlur, inputRef, containerClass = "input-container" }) => {
  const changeHandler = handleChange || onChange;
  const blurHandler = handleBlur || onBlur;

  const handleChangeInternal = (e) => {
    if (changeHandler) changeHandler(e);
  };

  const handleBlurInternal = (e) => {
    if (blurHandler) blurHandler(e);
  };

  switch (field.type) {
    case "select":
      return (
        <div className={containerClass}>
          <label htmlFor={field.name}>
            {field.label} {field.required && <span className="required">*</span>}
          </label>
          <select
            ref={inputRef}
            id={field.name}
            name={field.name}
            value={value}
            onChange={handleChangeInternal}
            onBlur={handleBlurInternal}
          >
            <option value="">{field.placeholder || "--Select--"}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="error">{error}</span>
        </div>
      );

    default:
      return (
        <div className={containerClass}>
          <label htmlFor={field.name}>
            {field.label} {field.required && <span className="required">*</span>}
          </label>
          <input
            ref={inputRef}
            type={field.type}
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={handleChangeInternal}
            onBlur={handleBlurInternal}
          />
          <span className="error">{error}</span>
        </div>
      );
  }
};

export default InputField;
