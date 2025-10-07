import React, { useState, useEffect } from "react";
import { Pie, Line } from "react-chartjs-2";
import { useNavigate, NavLink } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Dashboard.css";
import { formatIndianCurrency } from "./utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/signin");
  };

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/income", label: "Income" },
    { href: "/expense", label: "Expense" },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch("http://127.0.0.1:8000/dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (result.status === "success") setDashboardData(result.data);
        else setError(result.message || "Failed to fetch dashboard data");
      } catch (err) {
        setError("Error fetching data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="homepage">Loading...</div>;
  if (error) return <div className="homepage">Error: {error}</div>;

  const headers = ["Date", "Category", "Amount", "Description"];

  const data =
    dashboardData?.recent_expenses?.map((expense) => [
      expense.date,
      expense.category,
      `₹${formatIndianCurrency(expense.amount)}`,
      expense.description,
    ]) || [];

  
  const pieData = {
    labels: Object.keys(dashboardData?.category_breakdown || {}),
    datasets: [
      {
        label: "Category",
        data: Object.values(dashboardData?.category_breakdown || {}),
        backgroundColor: [
          "#007bff",
          "#28a745",
          "#ffc107",
          "#dc3545",
          "#6f42c1",
          "#17a2b8",
          "red",
          "yellowgreen",
          "purple",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  
  const pieOptions = {
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false, 
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ₹${formatIndianCurrency(value)}`;
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 6,
        padding: 10,
      },
    },
  };

  const lineData = {
    labels: dashboardData?.monthly_trend?.map((m) => m.month) || [],
    datasets: [
      {
        label: "Monthly Income",
        data: dashboardData?.monthly_trend?.map((m) => m.income) || [],
        fill: true,
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderColor: "#28a745",
        tension: 0.3,
      },
      {
        label: "Monthly Expense",
        data: dashboardData?.monthly_trend?.map((m) => m.expense) || [],
        fill: true,
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        borderColor: "#dc3545",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="homepage">
     
      <nav className="navbar">
        <h1 className="navbar-title">Expense Tracker</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      
      <div className="sidebar">
        <ul className="sidebar-links">
          {sidebarLinks.map((link, idx) => (
            <li key={idx}>
              <NavLink
                to={link.href}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content">
        <section className="summary">
          <div className="summary-card gradient1">
            <h3>Total Spent</h3>
            <p>₹{formatIndianCurrency(dashboardData?.total_spent ?? 0)}</p>
          </div>
          <div className="summary-card gradient2">
            <h3>Total Income</h3>
            <p>₹{formatIndianCurrency(dashboardData?.total_income ?? 0)}</p>
          </div>
          <div className="summary-card gradient3">
            <h3>Monthly Avg</h3>
            <p>₹{formatIndianCurrency(dashboardData?.monthly_average ?? 0)}</p>
          </div>
        </section>

        <section className="charts">
          <div className="chart-box">
            <h3>Category Breakdown</h3>
            <Pie data={pieData} options={pieOptions} />
          </div>

          <div className="chart-box">
            <h3>Monthly Trend</h3>
            <Line data={lineData} />
          </div>
        </section>

        {/* ✅ Recent Expenses */}
        <section className="expenseds-lists">
          <h3>Recent Expenses</h3>
          <div className="table-container">
            <table className="custom-tables">
              <thead>
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} style={{ textAlign: "center" }}>
                      No data
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, i) => (
                        <td key={i}>
                          {React.isValidElement(cell) ? cell : cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
