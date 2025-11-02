// frontend/src/pages/admin/ManageCategories.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import CategoryForm from "../../components/admin/CategoryForm";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    const { data } = await axios.get("/api/categories", { headers: { Authorization: `Bearer ${token}` } });
    setCategories(data);
  };

  const handleEdit = (category) => setEditingCategory(category);
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchCategories();
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>
      <CategoryForm fetchCategories={fetchCategories} editingCategory={editingCategory} setEditingCategory={setEditingCategory} />
      <table className="w-full mt-6 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.id}>
              <td className="p-2 border">{c.name}</td>
              <td className="p-2 border space-x-2">
                <button onClick={() => handleEdit(c)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageCategories;
