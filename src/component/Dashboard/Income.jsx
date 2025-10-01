import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Income.css";
import { useNavigate, Link } from "react-router-dom";

function Income() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    source: "",
    amount: "",
    description: "",
    income_date: "",
  });

  const [errors, setErrors] = useState({
    source: "",
    amount: "",
    description: "",
    income_date: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const navigate = useNavigate();

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/income", label: "Income" },
    { href: "/expense", label: "Expense" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/signin");
  };

  const headers = ["ID","Source", "Amount", "Description", "Date", "Actions"];

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/incomes", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.status === "success") setIncomes(result.data);
      else toast.error(result.message || "Failed to fetch incomes");
    } catch (err) {
      toast.error("Error fetching data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "source":
        if (!value.trim()) error = "Source is required";
        break;
      case "amount":
        if (!value || parseFloat(value) <= 0) error = "Amount must be > 0";
        break;
      case "income_date":
        if (!value) error = "Date is required";
        break;
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const validateForm = () => {
    validateField("source", formData.source);
    validateField("amount", formData.amount);
    validateField("income_date", formData.income_date);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://127.0.0.1:8000/api/incomes/${editingId}`
        : "http://127.0.0.1:8000/api/incomes";

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
          setIncomes(
            incomes.map((inc) => (inc.id === editingId ? result.data : inc))
          );
          toast.success("Income updated!");
        } else {
          setIncomes([...incomes, result.data]);
          toast.success("Income added!");
        }
        resetForm();
      } else {
        toast.error(result.message || "Failed to save income");
      }
    } catch (err) {
      toast.error("Error saving income: " + err.message);
    }
  };

  const handleEdit = (id) => {
    const income = incomes.find((inc) => inc.id === id);
    setFormData({
      id : income.id,
      source: income.source,
      amount: income.amount,
      description: income.description,
      income_date: income.income_date,
    });
    setErrors({ source: "", amount: "", description: "", income_date: "" });
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this income?")) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/incomes/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        setIncomes(incomes.filter((inc) => inc.id !== id));
        toast.success("Income deleted!");
      } else {
        toast.error(result.message || "Failed to delete income");
      }
    } catch (err) {
      toast.error("Error deleting income: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ source: "", amount: "", description: "", income_date: "" });
    setErrors({ source: "", amount: "", description: "", income_date: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredIncomes = incomes.filter(
    (inc) =>
      inc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.income_date.includes(searchTerm)
  );

  const sortedIncomes = [...filteredIncomes].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIncomes = sortedIncomes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedIncomes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  if (loading) return <div className="homepage">Loading...</div>;

  return (
    <div className="homepage">
      <nav className="navbar">
        <h1 className="navbar-title">Income Management</h1>
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

      <div className="main-content">
        <div className="income-containers">
          <ToastContainer position="top-right" autoClose={3000} />

          {!showForm && (
            <button className="btn-creates" onClick={() => setShowForm(true)}>
              Create Income
            </button>
          )}
          {showForm && (
            <button className="btn-cancels" onClick={resetForm}>
              Cancel
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="income-forming">
              <div className="form-grouping">
                <label>Source:</label>
                <input type="text" name="source" value={formData.source} onChange={handleInputChange} onBlur={() => validateField("source", formData.source)}
                  required
                />
                {errors.source && <span className="error">{errors.source}</span>}
              </div>
              <div className="form-grouping">
                <label>Amount:</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} onBlur={() => validateField("amount", formData.amount)}
                  required
                />
                {errors.amount && <span className="error">{errors.amount}</span>}
              </div>
              <div className="form-grouping">
                <label>Description:</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange}/>
              </div>
              <div className="form-grouping">
                <label>Date:</label>
                <input
                  type="date"
                  name="income_date"
                  value={formData.income_date}
                  onChange={handleInputChange}
                  onBlur={() => validateField("income_date", formData.income_date)}
                  required
                />
                {errors.income_date && <span className="error">{errors.income_date}</span>}
              </div>
              <button type="submit" className="btn-submits">
                {editingId ? "Update Income" : "Add Income"}
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
                    {currentIncomes.length === 0 ? (
                      <tr>
                        <td colSpan={headers.length} style={{ textAlign: "center" }}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      currentIncomes.map((inc) => (
                        <tr key={inc.id}>
                          <td>{inc.id}</td>
                          <td>{inc.source}</td>
                          <td>₹{inc.amount}</td>
                          <td>{inc.description}</td>
                          <td>{inc.income_date}</td>
                          <td className="actions">
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(inc.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(inc.id)}
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

export default Income;
