// frontend/src/pages/orders/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/addresses", {
          withCredentials: true,
        });
        setAddresses(res.data);
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    const fetchCart = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/cart", {
          withCredentials: true,
        });
        setCartItems(res.data.items || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };

    fetchAddresses();
    fetchCart();
  }, []);

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      alert("Please select an address");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Navigate to payment page with order details
    navigate("/payment", {
      state: {
        cartItems,
        selectedAddress,
        paymentMethod,
      },
    });
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Address Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Select Delivery Address</h2>
        {addresses.length === 0 ? (
          <p className="text-gray-600">You have no saved addresses.</p>
        ) : (
          <div className="grid gap-3">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`border p-4 rounded-lg cursor-pointer transition ${
                  selectedAddress === addr.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddress === addr.id}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="mr-2"
                />
                <span className="font-medium">{addr.line1}</span>, {addr.city},{" "}
                {addr.state} - {addr.postal}, {addr.country}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Payment Method</h2>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border p-2 rounded w-60"
        >
          <option value="COD">Cash on Delivery</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Credit/Debit Card</option>
        </select>
      </div>

      {/* Order Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Order Summary</h2>
        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <div className="border rounded-lg p-4 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b pb-2 last:border-b-0"
              >
                <span>{item.product.title}</span>
                <span>
                  ₹{item.product.price} × {item.quantity}
                </span>
              </div>
            ))}
            <p className="font-semibold text-right mt-2">
              Total: ₹{totalPrice.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleProceedToPayment}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default CheckoutPage;
