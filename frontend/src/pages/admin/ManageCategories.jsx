// frontend/src/pages/admin/ManageCategories.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import CategoryForm from "../../components/admin/CategoryForm";
import AdminNav from "../../components/admin/AdminNav";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      
      const { data } = await axios.get("http://localhost:3000/api/categories", {
        withCredentials: true, 
      });
      console.log("Fetched categories:", data); // <-- check what backend sends
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]); // prevent crash
    }
  };
  

  const handleEdit = (category) => setEditingCategory(category);
  const handleDelete = async (id) => {
    
    await axios.delete(`http://localhost:3000/api/categories/${id}`, { withCredentials: true, });
    fetchCategories();
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>
      <AdminNav/>
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
              <td className="p-2 border text-center">{c.name}</td>
              <td className="p-2 border space-x-2 text-center">
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
