import React, { useState, useEffect } from "react";
import Navbar from "./common/Navbar";
import Table from "./common/Table";
import "./dashboard.css";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/expenses', label: 'Expenses' },
    { href: '/reports', label: 'Reports' },
    { href: '/logout', label: 'Logout' },
  ];

  const headers = ['Date', 'Category', 'Amount', 'Description', 'Actions'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.status === 'success') {
          setDashboardData(result.data);
        } else {
          setError(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Error fetching data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const data = dashboardData?.recent_expenses?.map((expense, index) => [
    expense.date,
    expense.category,
    `$${expense.amount}`,
    expense.description,
    <div key={index} className="actions">
      <button onClick={() => handleEdit(index)}>Edit</button>
      <button onClick={() => handleDelete(index)}>Delete</button>
    </div>
  ]) || [];

  const handleEdit = (index) => {
    console.log('Edit expense at index:', index);
  };

  const handleDelete = (index) => {
    console.log('Delete expense at index:', index);
  };

  if (loading) {
    return <div className="homepage">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="homepage">Error: {error}</div>;
  }

  return (
    <div className="homepage">
  <Navbar title="Expense Tracker" links={links} />

  <section className="summary">
    <h2>Total Spent: ₹{dashboardData?.total_spent ?? 0}</h2>
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

  <section className="expense-list">
    <h3>Recent Expenses</h3>
    <Table headers={headers} data={data} />
  </section>
</div>

  );
}

export default Dashboard;
