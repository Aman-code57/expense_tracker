import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignUp.css";
import InputField from "./Inputfield";
import Navbar from "../Navbar";

const validateField = (name, value, formData) => {
  switch (name) {
    case "fullname":
      if (!value.trim()) return "Full name is required";
      if (!/^[A-Z][a-zA-Z]*$/.test(value))
        return "Must start with capital & contain only letters";
      if (value.length < 3 || value.length > 15)
        return "Name must be 3–15 characters";
      return "";

    case "email":
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email";
      return "";

    case "gender":
      return !value ? "Gender is required" : "";

    case "mobilenumber":
      if (!value.trim()) return "Mobile number is required";
      if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit number";
      return "";

    case "password":
      if (!value) return "Password is required";
      if (value.length < 6) return "Password must be at least 6 characters";
      if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
        return "Password must contain at least 1 letter & 1 number";

      if (formData.confirmPassword && value !== formData.confirmPassword)
        return "Passwords do not match";

    return "";
  }
};

const formatField = (name, value) => {
  switch (name) {
    case "fullname":
      let newValue = value.replace(/[^a-zA-Z]/g, "");
      if (newValue.length > 0)
        newValue =
          newValue.charAt(0).toUpperCase() + newValue.slice(1);
      return newValue;
    default:
      return value;
  }
};

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    gender: "",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const refs = {
    fullname: useRef(null),
    email: useRef(null),
    gender: useRef(null),
    mobilenumber: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  const fields = [
    { name: "fullname", label: "Full Name", type: "text", placeholder: "Enter full name" },
    { name: "email", label: "Email", type: "text", placeholder: "Enter email" },
    { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Trans"] },
    { name: "mobilenumber", label: "Mobile Number", type: "text", placeholder: "10-digit number" },
    { name: "password", label: "Password", type: "password" },
    { name: "confirmPassword", label: "Confirm Password", type: "password" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatField(name, value);
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formattedValue, formData),
    }));
  };

  const validateAll = () => {
    let firstErrorField = null;
    const newErrors = {};
    for (let field of fields) {
      const error = validateField(field.name, formData[field.name], formData);
      newErrors[field.name] = error;
      if (error && !firstErrorField) firstErrorField = field.name;
    }
    setErrors(newErrors);
    return firstErrorField;
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
      const response = await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success(data.message);
        setFormData({
          fullname: "",
          email: "",
          gender: "",
          mobilenumber: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        setTermsAccepted(false);
        refs.fullname.current.focus();
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Network error. Please check if backend is running.");
    }
  };

  const fieldPairs = [
    ["fullname", "email"],
    ["gender", "mobilenumber"],
    ["password", "confirmPassword"],
  ];

  return (
    <div>
      <Navbar />
      <div className="apps">
        <h1>Sign Up</h1>
        <form className="input-container" onSubmit={handleSubmit} noValidate>
          {fieldPairs.map((pair, idx) => (
            <div key={idx} className="input-row two-cols">
              {pair.map((name) => {
                const field = fields.find((f) => f.name === name);
                return (
                  <InputField
                    key={name}
                    field={field}
                    value={formData[name]}
                    error={errors[name]}
                    onChange={handleChange}
                    onBlur={(e) =>
                      setErrors((prev) => ({
                        ...prev,
                        [name]: validateField(name, e.target.value, formData),
                      }))
                    }
                    inputRef={refs[name]}
                  />
                );
              })}
            </div>
          ))}

          <div className="checkbox-container">
            <label>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />{" "}
              I accept the <a href="#">Terms & Conditions</a>{" "}
              <span className="required">*</span>
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

        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </div>
    </div>
  );
};

export default SignUp;
