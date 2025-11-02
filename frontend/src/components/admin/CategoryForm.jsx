// frontend/src/components/admin/CategoryForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const CategoryForm = ({ fetchCategories, editingCategory, setEditingCategory }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingCategory) setName(editingCategory.name);
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (editingCategory) {
      await axios.put(`/api/categories/${editingCategory.id}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("/api/categories", { name }, { headers: { Authorization: `Bearer ${token}` } });
    }
    setName("");
    setEditingCategory(null);
    fetchCategories();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 flex gap-4">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category Name" className="border p-2 rounded" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">{editingCategory ? "Update" : "Add"} Category</button>
    </form>
  );
};

export default CategoryForm;
