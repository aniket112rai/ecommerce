// frontend/src/components/admin/ProductForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductForm = ({ fetchProducts, editingProduct, setEditingProduct }) => {
  const [form, setForm] = useState({ name: "", price: "", stock: "", images: [] });

  useEffect(() => {
    if (editingProduct) {
      setForm({ ...editingProduct });
    }
  }, [editingProduct]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (editingProduct) {
      await axios.put(`/api/products/${editingProduct.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post("/api/products", form, { headers: { Authorization: `Bearer ${token}` } });
    }
    setForm({ name: "", price: "", stock: "", images: [] });
    setEditingProduct(null);
    fetchProducts();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4">
      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" />
      <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price" className="border p-2 rounded" />
      <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" className="border p-2 rounded" />
      <input type="text" name="images" value={form.images} onChange={handleChange} placeholder="Image URLs (comma separated)" className="border p-2 rounded" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        {editingProduct ? "Update" : "Add"} Product
      </button>
    </form>
  );
};

export default ProductForm;
