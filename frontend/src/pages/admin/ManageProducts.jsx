// frontend/src/pages/admin/ManageProducts.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductForm from "../../components/admin/ProductForm";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    const { data } = await axios.get("/api/products", { headers: { Authorization: `Bearer ${token}` } });
    setProducts(data);
  };

  const handleEdit = (product) => setEditingProduct(product);
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchProducts();
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <ProductForm fetchProducts={fetchProducts} editingProduct={editingProduct} setEditingProduct={setEditingProduct} />
      <table className="w-full mt-6 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">${p.price}</td>
              <td className="p-2 border">{p.stock}</td>
              <td className="p-2 border space-x-2">
                <button onClick={() => handleEdit(p)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProducts;
