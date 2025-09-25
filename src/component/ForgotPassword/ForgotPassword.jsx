import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./forgotpassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateEmail(email);
    setError(errorMsg);

    if (errorMsg) {
      emailRef.current.focus();
      return;
    }
     setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success("OTP sent to your email!");
        // Navigate to OTP verification page with email
        window.location.href = `/otp-forgot-password?email=${encodeURIComponent(email)}`;
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="forgot">
        <h1>Forgot Password</h1>
        <form className="input-boxed" onSubmit={handleSubmit} noValidate>
          <div className="input-boxed">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              ref={emailRef} type="text" id="email" name="email" placeholder="Enter your registered email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setError(validateEmail(e.target.value))}
            />
            <span className="error">{error}</span>
          </div>

          <button type="submit" className="btn-submiteds" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <div className="links">
            <Link to="/signin" className="signup-link">
              Back to Sign In
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

export default ForgotPassword;
