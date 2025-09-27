import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Expense.css";

function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

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
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch("http://127.0.0.1:8000/api/expenses", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        setExpenses(result.data);
      } else {
        setError(result.message || "Failed to fetch expenses");
      }
    } catch (err) {
      setError("Error fetching expenses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://127.0.0.1:8000/api/expenses/${editingId}`
      : "http://127.0.0.1:8000/api/expenses";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.status === "success") {
        fetchExpenses();
        setShowForm(false);
        setEditingId(null);
        setFormData({ amount: "", category: "", description: "", date: "" });
      } else {
        setError(result.message || "Failed to save expense");
      }
    } catch (err) {
      setError("Error saving expense: " + err.message);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        fetchExpenses();
      } else {
        setError(result.message || "Failed to delete expense");
      }
    } catch (err) {
      setError("Error deleting expense: " + err.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="homepage">Loading...</div>;
  if (error) return <div className="homepage">Error: {error}</div>;

  const headers = ["Date", "Category", "Amount", "Description", "Actions"];

  const data = expenses.map((expense) => [
    expense.date,
    expense.category,
    `₹${expense.amount}`,
    expense.description,
    <div key={expense.id} className="actionss">
      <button onClick={() => handleEdit(expense)}>Edit</button>
      <button onClick={() => handleDelete(expense.id)}>Delete</button>
    </div>,
  ]);

  return (
    <div className="homepage">
      <nav className="navbar">
        <h1 className="navbar-title">Expense Management</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      <div className="sidebar">
        <ul className="sidebar-links">
          {sidebarLinks.map((link, idx) => (
            <li key={idx}>
              <Link to={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-contents">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Expense"}
        </button>

        {showForm && (
          <form className="expense-form" onSubmit={handleFormSubmit}>
            <h3>{editingId ? "Edit Expense" : "Add Expense"}</h3>
            <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleInputChange}
              required/>
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleInputChange}
              required/>
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange}
            />
            <input type="date" name="date" value={formData.date} onChange={handleInputChange}
              required/>
            <button type="submit">{editingId ? "Update" : "Add"}</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        )}

        <section className="expense-list">
          <h3>Expenses</h3>
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
                      No expenses found
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

export default Expense;
