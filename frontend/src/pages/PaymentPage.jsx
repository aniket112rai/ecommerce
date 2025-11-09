import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { cartItems, selectedAddress, paymentMethod: checkoutMethod } =
    location.state || {};

  const [paymentMethod, setPaymentMethod] = useState(checkoutMethod || "COD");
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);

  const handlePayment = async () => {
    if (!cartItems || !selectedAddress) {
      alert("Checkout details missing!");
      navigate("/checkout");
      return;
    }

    try {
      setLoading(true);

      // 🧾 Step 1: Create order directly (simulate payment success)
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        addressId: selectedAddress,
        paymentMethod,
        paymentStatus: "Paid", // ✅ directly mark paid
        status: "Confirmed",
      };

      const orderRes = await axios.post(
        "http://localhost:3000/api/orders",
        orderPayload,
        { withCredentials: true }
      );

      const newOrder = orderRes.data;
      setOrder(newOrder);

      // 🧾 Step 2: Simulate payment success (no real API call)
      const fakePayment = {
        id: "PAY-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        method: paymentMethod,
        status: "Success",
      };

      setPayment(fakePayment);

      // 🧾 Step 3: Redirect after short delay
      setTimeout(() => navigate("/orders"), 2000);
    } catch (err) {
      console.error("Order creation or payment failed:", err);
      alert("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Payment</h1>

      {!payment ? (
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h2 className="text-lg mb-3 font-medium text-gray-800">
            Choose Payment Method
          </h2>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border p-2 rounded mb-6"
          >
            <option value="COD">Cash on Delivery</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Credit/Debit Card</option>
          </select>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      ) : (
        <div className="text-center mt-10">
          <h2 className="text-2xl font-bold text-green-600 mb-3">
            Payment Successful ✅
          </h2>
          <p className="text-gray-600 mb-6">
            Payment ID: {payment.id} <br />
            Order ID: {order?.id}
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to My Orders
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
