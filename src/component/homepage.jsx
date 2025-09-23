import React from "react";
import Navbar from "./common/Navbar";
import Table from "./common/Table";
import Button from "./common/Button";
import "./HomePage.css";

function HomePage() {
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/expenses', label: 'Expenses' },
    { href: '/reports', label: 'Reports' },
    { href: '/logout', label: 'Logout' },
  ];

  const headers = ['Date', 'Category', 'Amount', 'Description', 'Actions'];

  const data = [
    ['2025-09-20', 'Food', '$20', 'Lunch at Cafe'],
    ['2025-09-21', 'Transport', '$15', 'Cab Ride'],
  ];

  const handleEdit = (index) => {
    console.log('Edit expense at index:', index);
  };

  const handleDelete = (index) => {
    console.log('Delete expense at index:', index);
  };

  return (
    <div className="homepage">
      <Navbar title="Expense Tracker" links={links} />

   
      <section className="summary">
        <h2>Total Spent: $5000</h2>
      </section>

  
      <section className="charts">
        <div className="chart-box">
          <h3>Category Breakdown</h3>
          <div className="chart-placeholder">[Pie Chart Here]</div>
        </div>
        <div className="chart-box">
          <h3>Monthly Trend</h3>
          <div className="chart-placeholder">[Line Chart Here]</div>
        </div>
      </section>

      {/* Expense List */}
      <section className="expense-list">
        <h3>Recent Expenses</h3>
        <Table headers={headers} data={data} onEdit={handleEdit} onDelete={handleDelete} />
      </section>
    </div>
  );
}

export default HomePage;
