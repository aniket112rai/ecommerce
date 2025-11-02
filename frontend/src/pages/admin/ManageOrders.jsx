// frontend/src/pages/admin/ManageOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    const { data } = await axios.get("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
    setOrders(data);
  };

  const handleStatusChange = async (orderId, status) => {
    const token = localStorage.getItem("token");
    await axios.put(`/api/orders/${orderId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
    fetchOrders();
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Order ID</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td className="p-2 border">{o.id}</td>
              <td className="p-2 border">{o.user?.name}</td>
              <td className="p-2 border">{o.status}</td>
              <td className="p-2 border space-x-2">
                {["pending","shipped","delivered"].map(s => (
                  <button key={s} onClick={() => handleStatusChange(o.id, s)} className="bg-green-500 text-white px-3 py-1 rounded">{s}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrders;
