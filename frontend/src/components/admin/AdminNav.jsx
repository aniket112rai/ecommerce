import React from 'react'
import { useNavigate } from "react-router-dom";

const AdminNav = () => {
    const navigate = useNavigate();
  return (
    <div>
      <div className="flex flex-wrap gap-4 my-6">
      <button
          onClick={() => navigate("/admin")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Admin Dashboard
        </button>
        <button
          onClick={() => navigate("/admin/products")}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Manage Products
        </button>
        <button
          onClick={() => navigate("/admin/orders")}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
        >
          Manage Orders
        </button>
        <button
          onClick={() => navigate("/admin/categories")}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Manage Categories
        </button>
        <button
          onClick={() => navigate("/admin/users")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Manage Users
        </button>
      </div>
    </div>
  )
}

export default AdminNav
