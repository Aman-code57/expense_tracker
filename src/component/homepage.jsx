import React from "react";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="homepage">
      {/* Navbar */}
      <header className="navbar">
        <h1>Expense Tracker</h1>
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/expenses">Expenses</a>
          <a href="/reports">Reports</a>
          <a href="/logout">Logout</a>
        </nav>
      </header>

      {/* Dashboard Summary */}
      <section className="summary">
        <h2>Total Spent: $5000</h2>
      </section>

      {/* Charts Section */}
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
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-09-20</td>
              <td>Food</td>
              <td>$20</td>
              <td>Lunch at Cafe</td>
              <td>
                <button className="edit-btn">Edit</button>
                <button className="delete-btn">Delete</button>
              </td>
            </tr>
            <tr>
              <td>2025-09-21</td>
              <td>Transport</td>
              <td>$15</td>
              <td>Cab Ride</td>
              <td>
                <button className="edit-btn">Edit</button>
                <button className="delete-btn">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default HomePage;
