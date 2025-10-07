import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "./Expense.css";
import { formatIndianCurrency } from "../Dashboard/utils";
import DataTable from "../DataTable";
import Layout from "../Layout";
import Form from "../Form";

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

  if (loading) return <div className="homepage">Loading...</div>;

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, format: (value) => `₹${formatIndianCurrency(value)}` },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const fields = [
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "category", label: "Category", type: "text", required: true },
    { name: "description", label: "Description", type: "text" },
    { name: "date", label: "Date", type: "date", required: true },
  ];

  const handleFormSubmitWrapper = async (data) => {
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
        body: JSON.stringify(data),
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

  return (
    <Layout title="Expense Management" sidebarLinks={sidebarLinks}>
      <ToastContainer position="top-right" autoClose={3000} />

      {!showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Create Expense
        </button>
      )}
      {showForm && (
        <button className="btn-secondary" onClick={resetForm}>
          Cancel
        </button>
      )}

      {showForm && (
        <Form
          fields={fields}
          initialData={formData}
          onSubmit={handleFormSubmitWrapper}
          validateField={validateField}
          submitLabel={editingId ? "Update Expense" : "Add Expense"}
          onCancel={resetForm}
        />
      )}

      {!showForm && (
        <DataTable
          data={expenses}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
      )}
    </Layout>
  );
}

export default Expense;
