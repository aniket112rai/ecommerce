// frontend/src/pages/CartPage.jsx
import React from "react";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { Link } from "react-router-dom";
const CartPage = () => {
  const { cart, loading } = useCart();

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading your cart...</p>;

  if (cart.length === 0)
    return (
      <div className="text-center mt-20">
        <p className="text-2xl text-gray-600 font-semibold">
          Your cart is empty 🛒
        </p>
        <p className="text-gray-400 mt-2">
          Browse products and add them to your cart!
        </p>
      </div>
    );

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Cart</h1>
      <div className="grid grid-cols-1 gap-4">
        {cart.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-semibold mb-2">Total</h2>
          <p className="text-2xl font-bold text-blue-600">
            ${totalPrice.toFixed(2)}
          </p>
          <button className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
            Proceed to Checkout
          </button>
          
        </div>
        
      </div>
      <div className="text-center mt-10">
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
