import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './component/SignIn/SignIn';
import SignUp from './component/SiginUp/SignUp';
import ForgotPassword from './component/ForgotPassword/ForgotPassword';
import OTPForgotPassword from './component/ForgotPassword/OTPForgotPassword';
import ResetPassword from './component/ForgotPassword/ResetPassword';
import Dashboard from './component/Dashboard/Dashboard';
import Income from './component/Income/Income';
import Expense from './component/Expense/Expense';
import PrivateRoute from "./component/PrivateRoute";
import PublicRoute from "./component/PublicRoute";
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
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/forgotpassword" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/otp-forgot-password" element={<PublicRoute><OTPForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
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
        <Route
          path="/expense"
          element={
            <PrivateRoute>
              <Expense />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<PublicRoute><Navigate to="/signin" replace /></PublicRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
