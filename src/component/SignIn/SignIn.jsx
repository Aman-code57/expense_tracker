import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "./Inputfield";
import Navbar from "../Navbar";
import "./SignIn.css";




const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const refs = {
    email: useRef(null),
    password: useRef(null),
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6) error = "Password must be at least 6 characters";
        else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value))
          error = "Password must contain at least 1 letter and 1 number";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateAll = () => {
    let firstErrorField = null;
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error && !firstErrorField) firstErrorField = key;
    });
    return firstErrorField;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (e) => {
    validateField(e.target.name, e.target.value);
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

  const fields = [
    { name: "email", label: "Email", type: "text", placeholder: "Enter your email" },
    { name: "password", label: "Password", type: "password", placeholder: "Enter your password" },
  ];

  return (
    <div>
      <Navbar />
      <div className="app">
        <h1>Sign In</h1>
        <form className="input-con" onSubmit={handleSubmit} noValidate>
          {fields.map((field) => (
            <InputField
              key={field.name}
              field={field}
              value={formData[field.name]}
              error={errors[field.name]}
              handleChange={handleChange}
              handleBlur={handleBlur}
              inputRef={refs[field.name]}
            />
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
    </div>
  );
};

export default SignIn;
