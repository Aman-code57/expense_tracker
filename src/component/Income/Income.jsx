import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Income.css";
import { useNavigate, NavLink } from "react-router-dom";
import { formatIndianCurrency } from "../Dashboard/utils";
import DataTable from "../DataTable";
import Layout from "../Layout";
import Form from "../Form";

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

  useEffect(() => {
    fetchIncomes();
  }, []);

  if (loading) return <div className="homepage">Loading...</div>;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "description" && value.length > 150) {
      processedValue = value.substring(0, 150);
    }
    setFormData({ ...formData, [name]: processedValue });
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
      case "description":
        if (value.length > 150) error = "Description must be 150 characters or less";
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

  const handleEdit = (income) => {
    setFormData({
      id: income.id,
      source: income.source,
      amount: income.amount,
      description: income.description,
      income_date: income.income_date,
    });
    setErrors({ source: "", amount: "", description: "", income_date: "" });
    setEditingId(income.id);
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

  const handleFormSubmitWrapper = async (data) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("No access token found.");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://127.0.0.1:8000/api/incomes/${editingId}`
      : "http://127.0.0.1:8000/api/incomes";

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

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, format: (value) => `₹${formatIndianCurrency(value)}` },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'income_date', label: 'Date', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const fields = [
    { name: "source", label: "Source", type: "text", required: true },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "description", label: "Description", type: "text" },
    { name: "income_date", label: "Date", type: "date", required: true },
  ];

return (
    <Layout title="Income Management" sidebarLinks={sidebarLinks}>
      <ToastContainer position="top-right" autoClose={3000} />

      {!showForm && (
        <button className="btn-primaryss" onClick={() => setShowForm(true)}>
          Create Income
        </button>
      )}
      {showForm && (
        <button className="btn-secondaryss" onClick={resetForm}>
          Cancel
        </button>
      )}

      {showForm && (
        <Form
          fields={fields}
          initialData={formData}
          onSubmit={handleFormSubmitWrapper}
          validateField={validateField}
          submitLabel={editingId ? "Update Income" : "Add Income"}
          onCancel={resetForm}
        />
      )}

      {!showForm && (
        <DataTable
          data={incomes}
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

export default Income;
