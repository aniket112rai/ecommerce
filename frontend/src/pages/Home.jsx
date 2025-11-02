// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import Filters from "../components/Filters";
import axios from "axios";

const Home = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await axios.get(`/api/products?${params}`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <ProductList products={products} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
