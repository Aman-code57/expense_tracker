import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./otpforgotpass.css";

const OTPForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const emailRef = useRef(null);
  const otpRef = useRef(null);
  const passwordRef = useRef(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      setStep(2); // Skip to OTP step
    }
  }, [searchParams]);

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
    return "";
  };

  const validateOTP = (value) => {
    if (!value) return "OTP is required";
    if (!/^\d{6}$/.test(value)) return "OTP must be 6 digits";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return "Password must contain at least 1 letter and 1 number";
    }
    return "";
  };

  const validateConfirmPassword = (value) => {
    if (!value) return "Please confirm your password";
    if (value !== newPassword) return "Passwords do not match";
    return "";
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const errorMsg = validateEmail(email);
    if (errorMsg) {
      emailRef.current.focus();
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success("OTP sent to your email!");
        setStep(2);
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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    const errorMsg = validateOTP(trimmedOtp);
    if (errorMsg) {
      otpRef.current.focus();
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: trimmedOtp }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success("OTP verified successfully!");
        setResetToken(data.reset_token);
        setStep(3);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      passwordRef.current.focus();
      toast.error(passwordError);
      return;
    }

    const confirmError = validateConfirmPassword(confirmPassword);
    if (confirmError) {
      toast.error(confirmError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/reset-password-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success("Password reset successfully!");
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h1>Forgot Password</h1>
      <form className="input-boxes" onSubmit={handleSendOTP} noValidate>
        <div className="input-boxes">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-submited" disabled={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <div className="links">
          <Link to="/signin" className="signup-link">
            Back to Sign In
          </Link>
        </div>
      </form>
    </>
  );

  const renderStep2 = () => (
    <>
      <h1>Enter OTP</h1>
      <p>We've sent a 6-digit OTP to {email}</p>
      <form className="input-box" onSubmit={handleVerifyOTP} noValidate>
        <div className="input-box">
          <label htmlFor="otp">
            OTP <span className="required">*</span>
          </label>
          <input
            ref={otpRef}
            type="text"
            id="otp"
            name="otp"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
          />
        </div>

        <button type="submit" className="btn-submited" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="links">
          <button
            type="button"
            className="resend-link"
            onClick={handleSendOTP}
            disabled={loading}
          >
            Resend OTP
          </button>
        </div>
      </form>
    </>
  );

  const renderStep3 = () => (
    <>
      <h1>Reset Password</h1>
      <form className="input-box" onSubmit={handleResetPassword} noValidate>
        <div className="input-box">
          <label htmlFor="newPassword">
            New Password <span className="required">*</span>
          </label>
          <input
            ref={passwordRef}
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="input-box">
          <label htmlFor="confirmPassword">
            Confirm Password <span className="required">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-submited" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div className="links">
          <Link to="/signin" className="signup-link">
            Back to Sign In
          </Link>
        </div>
      </form>
    </>
  );

  return (
    <div style={{
      margin: 0,
      fontFamily: 'Arial, sans-serif',
      background: '#f3f4f6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div className="otp-forgot">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

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

export default OTPForgotPassword;
