// frontend/src/pages/admin/ManageProducts.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductForm from "../../components/admin/ProductForm";
import AdminNav from "../../components/admin/AdminNav";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      
      const { data } = await axios.get("http://localhost:3000/api/products", {
        withCredentials: true, 
      });
      
      console.log("Fetched products:", data);
      console.log(data)
      setProducts(data|| []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]); // prevents crash
    }
  };
  
  const handleEdit = (product) => setEditingProduct(product);
  const handleDelete = async (id) => {
    
    await axios.delete(`http://localhost:3000/api/products/${id}`, {withCredentials: true, });
    fetchProducts();
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Products</h1>
      <AdminNav/>
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
              <td className="p-2 border text-center">{p.name}</td>
              <td className="p-2 border text-center">${p.price}</td>
              <td className="p-2 border text-center">{p.stock}</td>
              <td className="p-2 border space-x-2  text-center">
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
