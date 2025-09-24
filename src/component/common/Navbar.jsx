import React from 'react';
import './Navbar.css';

function Navbar({ title, links }) {
  return (
    <nav className="navbar">
      <h1 className="navbar-title">{title}</h1>
      <ul className="navbar-links">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
