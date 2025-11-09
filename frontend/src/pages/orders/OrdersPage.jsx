import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/orders", {
        withCredentials: true,
      });
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading orders...</p>;

  if (orders.length === 0)
    return (
      <div className="text-center mt-20">
        <p className="text-xl text-gray-600 font-semibold">No orders yet 🛍️</p>
        <Link
          to="/"
          className="inline-block mt-4 bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Shopping →
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Orders</h1>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="text-lg font-semibold">Order ID: {order.id}</p>
              <p className="text-gray-500">Status: {order.status}</p>
              <p className="text-gray-600">Total: ${order.total}</p>
            </div>
            <Link
              to={`/orders/${order.id}`}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
