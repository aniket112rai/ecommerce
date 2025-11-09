import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/orders/${id}`, {
        withCredentials: true,
      });
      setOrder(res.data);
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) return <p className="text-center mt-10 text-gray-600">Loading order details...</p>;
  if (!order) return <p className="text-center mt-10 text-gray-600">Order not found.</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>

      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ${order.total}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Items</h2>
      {order.items?.map((item) => (
        <div
          key={item.id}
          className="bg-gray-50 border rounded-md p-3 mb-2 flex justify-between"
        >
          <p>{item.product.name}</p>
          <p>Qty: {item.quantity}</p>
        </div>
      ))}

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => navigate(`/payment/${order.id}`)}
          className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600"
        >
          Proceed to Payment
        </button>
        <Link
          to="/orders"
          className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
