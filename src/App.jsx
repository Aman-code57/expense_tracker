import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './component/SignIn';
import SignUp from './component/SignUp';
import ForgotPassword from './component/ForgotPassword';
import OTPForgotPassword from './component/OTPForgotPassword';
import ResetPassword from './component/ResetPassword';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        draggable
        theme="colored"
      />

      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/otp-forgot-password" element={<OTPForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
