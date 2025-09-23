import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignUp.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gender: "",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const refs = {
    fullName: useRef(null),
    email: useRef(null),
    gender: useRef(null),
    mobilenumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  // Field configuration
  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter full name",
      validate: (value) => {
        if (!value.trim()) return "Full name is required";
        if (!/^[A-Z][a-zA-Z]*$/.test(value)) return "Must start with capital & contain only letters";
        if (value.length < 3 || value.length > 15) return "Name must be 3-15 characters";
        return "";
      },
      format: (value) => {
        let newValue = value.replace(/[^a-zA-Z]/g, "");
        if (newValue.length > 0) newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
        return newValue;
      },
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter email",
      validate: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
        return "";
      },
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: ["Male", "Female", "Trans"],
      validate: (value) => (!value ? "Gender is required" : ""),
    },
    {
      name: "mobilenumber",
      label: "Mobile Number",
      type: "text",
      placeholder: "10-digit number",
      validate: (value) => {
        if (!value.trim()) return "Mobile number is required";
        if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit number";
        return "";
      },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      validate: (value) => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
          return "Password must contain at least 1 letter and 1 number";
        return "";
      },
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      validate: (value) =>
        value !== formData.password ? "Passwords do not match" : value ? "" : "Please confirm password",
    },
  ];

  // Validate a single field
  const validateField = (name, value) => {
    const field = fields.find((f) => f.name === name);
    const error = field?.validate(value) || "";
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAll = () => {
    let firstErrorField = null;
    fields.forEach(({ name }) => {
      const error = validateField(name, formData[name]);
      if (error && !firstErrorField) firstErrorField = name;
    });
    return firstErrorField;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const field = fields.find((f) => f.name === name);
    const newValue = field?.format ? field.format(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    validateField(name, newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firstErrorField = validateAll();

    if (firstErrorField) {
      refs[firstErrorField].current.focus();
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept Terms & Conditions");
      return;
    }

    try {
    const response = await fetch("http://127.0.0.1:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullName,
          email: formData.email,
          gender: formData.gender,
          mobilenumber: formData.mobilenumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(data.message);
        setFormData({
          fullName: "",
          email: "",
          gender: "",
          mobilenumber: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        setTermsAccepted(false);
        refs.fullName.current.focus();
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check if the backend server is running.");
    }
  };

 
  const fieldPairs = [
    ["fullName", "email"],
    ["gender", "mobilenumber"],
    ["password", "confirmPassword"],
  ];

  return (
    <div className="apps">
      <h1>Sign Up</h1>
      <form className="input-container" onSubmit={handleSubmit} noValidate>
        {fieldPairs.map((pair, idx) => (
          <div key={idx} className="input-row two-cols">
            {pair.map((name) => {
              const field = fields.find((f) => f.name === name);
              return (
                <div key={name} className="input-container">
                  <label htmlFor={name}>
                    {field.label} <span className="required">*</span>
                  </label>
                  {field.type === "select" ? (
                    <select ref={refs[name]} id={name} name={name} value={formData[name]} onChange={handleChange}
                      onBlur={(e) => validateField(name, e.target.value)}
                    >
                      <option value="">--Select--</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={refs[name]} type={field.type} id={name} name={name} placeholder={field.placeholder || ""} value={formData[name]}
                      onChange={handleChange}
                      onBlur={(e) => validateField(name, e.target.value)}
                    />
                  )}

                  <span className="error">{errors[name]}</span>
                </div>
              );
            })}
          </div>
        ))}

        <div className="checkbox-container">
          <label>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} /> I accept the{" "}
            <a href="#">Terms & Conditions</a> <span className="required">*</span>
          </label>
        </div>

        <button type="submit" className="btn-submit">
          Submit
        </button>
      </form>

      <div className="link-row">
        <p>
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
};

export default SignUp;
