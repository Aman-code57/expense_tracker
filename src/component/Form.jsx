import React, { useState, useRef } from "react";
import InputField from "./InputField";
import "./Form.css";

const Form = ({ fields, initialData = {}, onSubmit, validateField, submitLabel = "Submit", cancelLabel = "Cancel", onCancel }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const refs = useRef({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "category" && value) {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (name === "description" && value.length > 150) {
      processedValue = value.substring(0, 150);
    }

    setFormData({ ...formData, [name]: processedValue });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validateField) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((field) => {
      if (validateField) {
        const error = validateField(field.name, formData[field.name]);
        if (error) newErrors[field.name] = error;
      }
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await onSubmit(formData);
      } finally {
        setLoading(false);
      }
    } else {
      const firstErrorField = Object.keys(newErrors)[0];
      if (refs.current[firstErrorField]) {
        refs.current[firstErrorField].focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {fields.map((field) => (
        <InputField
          key={field.name}
          field={field}
          value={formData[field.name] || ""}
          error={errors[field.name]}
          onChange={handleInputChange}
          onBlur={handleBlur}
          inputRef={(el) => (refs.current[field.name] = el)}
        />
      ))}
      <div className="form-buttons">
        <button type="submit" className="btn-primaryer" disabled={loading}>
          {loading ? "Submitting..." : submitLabel}
        </button>
        
      </div>
    </form>
  );
};

export default Form;
