import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignIn.css";

const SignIn = () => {
  const navigate = useNavigate(); // for redirecting
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Dynamic refs
  const refs = {
    email: useRef(null),
    password: useRef(null),
  };

  // Field configuration
  const fields = [
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter your email",
      validate: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
        return "";
      },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter your password",
      validate: (value) => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
          return "Password must contain at least 1 letter and 1 number";
        return "";
      },
    },
  ];

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firstErrorField = validateAll();

    if (firstErrorField) {
      refs[firstErrorField].current.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(data.message);
        setFormData({ email: "", password: "" });
        setErrors({});
        localStorage.setItem("access_token", data.access_token);

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Sign In</h1>
      <form className="input-con" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => (
          <div key={field.name} className="input-con">
            <label htmlFor={field.name}>
              {field.label} <span className="required">*</span>
            </label>
            <input
              ref={refs[field.name]}
              type={field.type}
              id={field.name}
              name={field.name}
              placeholder={field.placeholder || ""}
              value={formData[field.name]}
              onChange={handleChange}
              onBlur={(e) => validateField(field.name, e.target.value)}
            />
            <span className="error">{errors[field.name]}</span>
          </div>
        ))}

        <button type="submit" className="btn-submits" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div className="links-rows">
          <Link to="/forgotpassword" className="forgot-password">
            Forgot Password?
          </Link>
          <Link to="/signup" className="signup-link">
            Register account? Sign Up
          </Link>
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
};

export default SignIn;
