import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignIn.css";

function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const refs = {
    email: useRef(null),
    password: useRef(null),
  };

  // Validate single field
  const validateField = (name, value) => {
    let error = "";

    if (name === "email") {
      if (!value) error = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = "Enter a valid email";
    }

    if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.length < 6)
        error = "Password must be at least 6 characters";
      else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
        error = "Password must contain at least 1 letter and 1 number";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  // Validate all fields
  const validateAll = () => {
    let firstErrorField = null;
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error && !firstErrorField) firstErrorField = field;
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
        toast.success(data.message); // ✅ Success toast
        setFormData({ email: "", password: "" });
        setErrors({});
        localStorage.setItem("access_token", data.access_token);
      } else {
        toast.error(data.message || "Login failed"); // ✅ Error toast
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Something went wrong. Please try again."); // ✅ API error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Sign In</h1>

      <form className="input-container" onSubmit={handleSubmit} noValidate>
        <div className="input-row">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            ref={refs.email}
            type="text"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onBlur={(e) => validateField("email", e.target.value)}
          />
          <span className="error">{errors.email}</span>
        </div>

        <div className="input-row">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <input
            ref={refs.password}
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            onBlur={(e) => validateField("password", e.target.value)}
          />
          <span className="error">{errors.password}</span>
        </div>

        <div className="links-row">
          <a href="#" className="forgot-password">
            Forgot Password?
          </a>
          <Link to="/signup" className="signup-link">
            Sign Up
          </Link>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* Toast container */}
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
}

export default SignIn;
