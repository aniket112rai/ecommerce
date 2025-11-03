import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductForm = ({ fetchProducts, editingProduct, setEditingProduct }) => {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    description:"",
    images: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (editingProduct) {
      setForm({ ...editingProduct });
    }
  }, [editingProduct]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/categories", {
          withCredentials: true,
        });
        setCategories(data.categories || data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await axios.put(
          `http://localhost:3000/api/products/${editingProduct.id}`,
          form,
          { withCredentials: true }
        );
      } else {
        await axios.post("http://localhost:3000/api/products", form, {
          withCredentials: true,
        });
      }

      setForm({ name: "", price: "", stock: "", images: "", categoryId: "" , description:""});
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
    
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4"
    >
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="border p-2 rounded"
      />
      <input
        type="number"
        name="price"
        value={form.price}
        onChange={handleChange}
        placeholder="Price"
        className="border p-2 rounded"
      />
      <input
        type="text" 
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="description"
        className="border p-2 rounded"
      />
      <input
        type="number"
        name="stock"
        value={form.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="border p-2 rounded"
      />
      <input
        type="text"
        name="images"
        value={form.images}
        onChange={handleChange}
        placeholder="Image URLs (comma separated)"
        className="border p-2 rounded"
      />

      <select
        name="categoryId"
        value={form.categoryId}
        onChange={handleChange}
        className="border p-2 rounded"
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        {editingProduct ? "Update" : "Add"} Product
      </button>
    </form>
  );
};

export default ProductForm;
