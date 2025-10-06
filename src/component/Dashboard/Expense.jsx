import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, NavLink } from "react-router-dom";
import "./Expense.css";
import { formatIndianCurrency } from "./utils";

function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

  const [errors, setErrors] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

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
    if (!token) {
      toast.error("No access token found.");
      setLoading(false);
      return;
    }

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
        toast.error(result.message || "Failed to fetch expenses");
      }
    } catch (err) {
      toast.error("Error fetching expenses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "category":
        if (!value.trim()) {
          error = "Category is required";
        } else if (value.length < 3 || value.length > 15) {
          error = "Category must be between 3 and 15 characters";
        } else if (!/^[A-Z]/.test(value)) {
          error = "Category must start with a capital letter";
        }
        break;
      case "amount":
        if (!value || parseFloat(value) <= 0) error = "Amount must be > 0";
        break;
      case "description":
        if (value.length > 150) error = "Description must be 150 characters or less";
        break;
      case "date":
        if (!value) error = "Date is required";
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const validateForm = () => {
    validateField("category", formData.category);
    validateField("amount", formData.amount);
    validateField("date", formData.date);
    return !Object.values(errors).some((error) => error);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      return;
    }

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
        if (editingId) {
          setExpenses(
            expenses.map((exp) => (exp.id === editingId ? result.data : exp))
          );
          toast.success("Expense updated!");
        } else {
          setExpenses([...expenses, result.data]);
          toast.success("Expense added!");
        }
        resetForm();
      } else {
        toast.error(result.message || "Failed to save expense");
      }
    } catch (err) {
      toast.error("Error saving expense: " + err.message);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
    setErrors({ amount: "", category: "", description: "", date: "" });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/expenses/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        setExpenses(expenses.filter((exp) => exp.id !== id));
        toast.success("Expense deleted!");
      } else {
        toast.error(result.message || "Failed to delete expense");
      }
    } catch (err) {
      toast.error("Error deleting expense: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ amount: "", category: "", description: "", date: "" });
    setErrors({ amount: "", category: "", description: "", date: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "description" && value.length > 100) {
      processedValue = value.substring(0, 100);
    }
    if (name === "category") {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }
    setFormData({ ...formData, [name]: processedValue });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.date.includes(searchTerm)
  );

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = sortedExpenses.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  if (loading) return <div className="homepage">Loading...</div>;

  const headers = ["ID","Date", "Category", "Amount", "Description", "Actions"];

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
              <NavLink to={link.href} className={({ isActive }) => isActive ? 'active' : ''}>{link.label}</NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content">
        <div className="income-containers">
        <ToastContainer position="top-right" autoClose={3000} />

        {!showForm && (
          <button className="btn-creates" onClick={() => setShowForm(true)}>
            Create Expense
          </button>
        )}
        {showForm && (
          <button className="btn-cancels" onClick={resetForm}>
            Cancel
          </button>
        )}

        {showForm && (
          <form onSubmit={handleFormSubmit} className="income-forming">
            <div className="form-grouping">
              <label>Amount:</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange}
                onBlur={() => validateField("amount", formData.amount)}
                required
              />
              {errors.amount && <span className="error">{errors.amount}</span>}
            </div>
            <div className="form-grouping">
              <label>Category:</label>
              <input type="text" name="category" value={formData.category} onChange={handleInputChange}
                onBlur={() => validateField("category", formData.category)}
                required
              />
              {errors.category && <span className="error">{errors.category}</span>}
            </div>
            <div className="form-grouping">
              <label>Description:</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange}
                onBlur={() => validateField("description", formData.description)}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>
            <div className="form-grouping">
              <label>Date:</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange}
                onBlur={() => validateField("date", formData.date)}
                required
              />
              {errors.date && <span className="error">{errors.date}</span>}
            </div>
            <button type="submit" className="btn-submits">
              {editingId ? "Update Expense" : "Add Expense"}
            </button>
          </form>
        )}

        {!showForm && (
          <>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-containers">
              <table className="custom-tabled">
                <thead>
                  <tr>
                    {headers.map((h, idx) => (
                      <th
                        key={idx}
                        onClick={() => handleSort(h.toLowerCase())}
                        style={{ cursor: "pointer" }}
                      >
                        {h}{" "}
                        {sortConfig.key === h.toLowerCase()
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length} style={{ textAlign: "center" }}>
                        No data
                      </td>
                    </tr>
                  ) : (
                    currentExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.id}</td>
                        <td>{exp.date}</td>
                        <td>{exp.category}</td>
                        <td>₹{formatIndianCurrency(exp.amount)}</td>
                        <td>{exp.description}</td>
                        <td className="actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(exp)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(exp.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={currentPage === i + 1 ? "active" : ""}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export default Expense;
