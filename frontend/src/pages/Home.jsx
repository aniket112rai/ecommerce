// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import Filters from "../components/Filters";
import axios from "axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);

  const fetchProducts = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await axios.get(
        `http://localhost:3000/api/products?${params}`
      );
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/auth/me", {
        withCredentials: true,
      });
      setUser(data);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUser();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {/* ✅ Top Right Buttons */}
      <div className="absolute top-4 right-6 flex gap-3">
        {user ? (
          <>
          <Link
              to="/cart"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-md font-medium"
            >
              🛒 Cart
            </Link>
            <Link
              to="/wishlist"
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            >
              ❤️ Wishlist
            </Link>
            <button
              onClick={async () => {
                await axios.post("http://localhost:3000/api/auth/logout", {}, { withCredentials: true });
                setUser(null);
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition duration-200 shadow-md font-medium"
          >
            Login
          </Link>
        )}
      </div>

      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Our Products
        </h1>
        <Filters onFilter={fetchProducts} />
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png"
              alt="empty shop"
              className="w-48 h-48 mb-6"
            />
            <p className="text-2xl text-gray-500 font-semibold">
              Shop is empty 😔
            </p>
            <p className="text-gray-400 mt-2">
              Check back later for new products!
            </p>
          </div>
        ) : (
          <ProductList products={products} />
        )}
      </div>
    </div>
  );
};

export default Home;
