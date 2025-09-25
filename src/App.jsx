import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './component/SignIn/SignIn';
import SignUp from './component/SiginUp/SignUp';
import ForgotPassword from './component/ForgotPassword/ForgotPassword';
import OTPForgotPassword from './component/ForgotPassword/OTPForgotPassword';
import ResetPassword from './component/ForgotPassword/ResetPassword';
import Dashboard from './component/Dashboard/Dashboard';
import Income from './component/Dashboard/Income';
import PrivateRoute from "./component/PrivateRoute";
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
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/income"
          element={
            <PrivateRoute>
              <Income />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
