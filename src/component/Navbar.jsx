import React from 'react';

const Navbar = () => {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '10px', backgroundColor: '#007bff', color: '#ffffff', zIndex: 1000 }}>
      <h2 style={{ margin: 0, color: '#ffffff' }}>Expense Tracker</h2>
    </nav>
  );
};

export default Navbar;
