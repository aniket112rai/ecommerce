import React from 'react'
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useState } from 'react';
const AdminNav = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] =useState(false);
    const handleLogout = async () => {
        try {
          await axios.post("http://localhost:3000/api/auth/logout", {}, { withCredentials: true });
        //   setIsAuthenticated(false);
          navigate("/login");
        } catch (err) {
          console.error("Logout failed:", err);
        }
      };
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
        <button
          onClick={handleLogout}
          className="absolute right-10 bg-black text-white py-2 px-4 rounded hover:bg-stone-700"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default AdminNav
