// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import StatsCard from "../../components/admin/StatsCard";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../components/admin/AdminNav";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Backend will validate the admin via cookie-based auth
        const [users, orders, products] = await Promise.all([
          axios.get("http://localhost:3000/api/users", { withCredentials: true }),
          axios.get("http://localhost:3000/api/orders/all", { withCredentials: true }),
          axios.get("http://localhost:3000/api/products", { withCredentials: true }),
        ]);

        setStats({
          users: users.data.users.length,
          orders: orders.data.length,
          products: products.data.length,
        });
        
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        navigate("/login"); // not authenticated or not admin
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <AdminNav/>
        {console.log(stats.orders)}
      {/* Admin Route Buttons
      <div className="flex flex-wrap gap-4 my-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Manage Users
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
      </div> */}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Users" value={stats.users} />
        <StatsCard title="Orders" value={stats.orders} />
        {console.log(stats.orders)}
        <StatsCard title="Products" value={stats.products} />
      </div>
    </div>
  );
};

export default AdminDashboard;
