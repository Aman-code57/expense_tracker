import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignUp.css";

function SignUp() {
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

  const validateField = (name, value) => {
    let error = "";

    if (name === "fullName") {
      if (!value.trim()) error = "Full name is required";
      else if (!/^[A-Z][a-zA-Z]*$/.test(value))
        error = "Must start with capital & contain only letters";
      else if (value.length < 3 || value.length > 15)
        error = "Name must be 3-15 characters";
    }

    if (name === "email") {
      if (!value) error = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = "Enter a valid email";
    }

    if (name === "gender") {
      if (!value) error = "Gender is required";
    }

    if (name === "mobilenumber") {
      if (!value.trim()) error = "Mobile number is required";
      else if (!/^\d{10}$/.test(value)) error = "Enter a valid 10-digit number";
    }

    if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.length < 6) error = "Password must be at least 6 characters";
      else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
        error = "Password must contain at least 1 letter and 1 number";
    }

    if (name === "confirmPassword") {
      if (!value) error = "Please confirm password";
      else if (value !== formData.password) error = "Passwords do not match";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

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
    let newValue = value;

    if (name === "fullName") {
      newValue = newValue.replace(/[^a-zA-Z]/g, "");
      if (newValue.length > 0)
        newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    }

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
      const response = await fetch('http://127.0.0.1:8000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: formData.fullName,
          email: formData.email,
          gender: formData.gender,
          mobilenumber: formData.mobilenumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
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
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please check if the backend server is running.');
    }
  };

  return (
    <div className="app">
      <h1>Sign Up</h1>
      <form className="input-container" onSubmit={handleSubmit} noValidate>
        {/* Full Name & Email */}
        <div className="input-row two-cols">
          <div className="input-container">
            <label htmlFor="fullName">Full Name <span className="required">*</span></label>
            <input ref={refs.fullName} type="text" id="fullName" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} onBlur={(e) => validateField("fullName", e.target.value)} />
            <span className="error">{errors.fullName}</span>
          </div>
          <div className="input-container">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input ref={refs.email} type="text" id="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} onBlur={(e) => validateField("email", e.target.value)} />
            <span className="error">{errors.email}</span>
          </div>
        </div>

        {/* Gender & Mobile */}
        <div className="input-row two-cols">
          <div className="input-container">
            <label htmlFor="gender">Gender <span className="required">*</span></label>
            <select ref={refs.gender} id="gender" name="gender" value={formData.gender} onChange={handleChange} onBlur={(e) => validateField("gender", e.target.value)}>
              <option value="">--Select--</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Trans">Trans</option>
            </select>
            <span className="error">{errors.gender}</span>
          </div>
          <div className="input-container">
            <label htmlFor="mobilenumber">Mobile Number <span className="required">*</span></label>
            <input ref={refs.mobilenumber} type="text" id="mobilenumber" name="mobilenumber" placeholder="10-digit number" value={formData.mobilenumber} onChange={handleChange} onBlur={(e) => validateField("mobilenumber", e.target.value)} />
            <span className="error">{errors.mobilenumber}</span>
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="input-row two-cols">
          <div className="input-container">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input ref={refs.password} type="password" id="password" name="password" value={formData.password} onChange={handleChange} onBlur={(e) => validateField("password", e.target.value)} />
            <span className="error">{errors.password}</span>
          </div>
          <div className="input-container">
            <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
            <input ref={refs.confirmPassword} type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={(e) => validateField("confirmPassword", e.target.value)} />
            <span className="error">{errors.confirmPassword}</span>
          </div>
        </div>

        {/* Terms & Submit */}
        <div className="input-row">
          <label>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} /> I accept the <a href="#">Terms & Conditions</a> <span className="required">*</span>
          </label>
        </div>

        <button type="submit" className="btn-submit">Submit</button>
      </form>

      <div className="links-row">
        <p>Already have an account? <Link to="/signin">Sign In</Link></p>
      </div>

      {/* Toast Container */}
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
}

export default SignUp;
