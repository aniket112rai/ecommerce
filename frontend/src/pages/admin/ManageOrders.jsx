// frontend/src/pages/admin/ManageOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNav from "../../components/admin/AdminNav";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      
      const { data } = await axios.get("http://localhost:3000/api/orders/all", {
        withCredentials: true,
      });
      console.log("Fetched orders:", data); // check what backend sends
      setOrders(data); // fix
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]); // prevents crash if error
    }
  };
  

  const handleStatusChange = async (orderId, status) => {
    
    await axios.put(`http://localhost:3000/api/orders/${orderId}/status`, { status }, {withCredentials: true, });
    fetchOrders();
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      <AdminNav/>
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
