// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import StatsCard from "../../components/admin/StatsCard";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const users = await axios.get("/api/users", { headers: { Authorization: `Bearer ${token}` } });
        const orders = await axios.get("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
        const products = await axios.get("/api/products", { headers: { Authorization: `Bearer ${token}` } });

        setStats({ users: users.data.length, orders: orders.data.length, products: products.data.length });
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Users" value={stats.users} />
        <StatsCard title="Orders" value={stats.orders} />
        <StatsCard title="Products" value={stats.products} />
      </div>
    </div>
  );
};

export default AdminDashboard;
