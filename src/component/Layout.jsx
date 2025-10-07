import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import "./Layout.css";

const Layout = ({ title, sidebarLinks, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/signin");
  };

  return (
    <div className="homepage">
      <nav className="navbar">
        <h1 className="navbar-title">{title}</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      <div className="sidebar">
        <ul className="sidebar-links">
          {sidebarLinks.map((link, idx) => (
            <li key={idx}>
              <NavLink to={link.href} className={({ isActive }) => isActive ? 'active' : ''}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
