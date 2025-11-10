import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/orders/${id}`, {
        withCredentials: true,
      });
      setOrder(data);
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading order details...</p>;
  if (!order) return <p className="text-center mt-10">Order not found.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Order Details</h2>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Payment:</strong> {order.payment.status}</p>
      
      <p className="mt-4 font-semibold">Items:</p>
      <ul className="list-disc pl-6">
        {order.items?.map((item) => (
          <li key={item.productId}>
            {item.product?.name || "Product"} × {item.quantity}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-gray-700">Address: {order.address?.line1}</p>


      <div className="text-center mt-10">
        <Link
          to="/orders"
          className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          ← Back to orders
        </Link>
      </div>
    </div>
  );
};

export default OrderDetails;
