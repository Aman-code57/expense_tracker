import React from "react";
import "./SignUp.css";


const InputField = ({ field, value, error, onChange, onBlur, inputRef }) => {
  switch (field.type) {
    case "select":
      return (
        <div className="input-container">
          <label htmlFor={field.name}>
            {field.label} <span className="required">*</span>
          </label>
          <select
            ref={inputRef}
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
          >
            <option value="">--Select--</option>
            {field.options.map((opt) => (
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
        <div className="input-container">
          <label htmlFor={field.name}>
            {field.label} <span className="required">*</span>
          </label>
          <input
            ref={inputRef}
            type={field.type}
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ""}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
          />
          <span className="error">{error}</span>
        </div>
      );
  }
};
export default InputField