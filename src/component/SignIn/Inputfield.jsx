import React from "react";
import "./SignIn.css";


const InputField = ({ field, value, error, handleChange, handleBlur, inputRef }) => (
  <div className="input-con">
    <label htmlFor={field.name}>
      {field.label} <span className="required">*</span>
    </label>
    <input ref={inputRef} type={field.type} id={field.name} name={field.name} placeholder={field.placeholder} value={value}
      onChange={handleChange}
      onBlur={handleBlur}
    />
    <span className="error">{error}</span>
  </div>
);
export default InputField