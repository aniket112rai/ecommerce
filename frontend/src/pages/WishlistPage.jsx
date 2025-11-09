import React from "react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

const WishlistPage = () => {
  const { wishlist, loading } = useWishlist();

  if (loading) return <p className="text-center">Loading wishlist...</p>;

  if (wishlist.length === 0)
    return (
      <div className="text-center mt-10">
        <p className="text-lg mb-6">Your wishlist is empty ❤️</p>
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          ← Back to Home
        </Link>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Your Wishlist ❤️
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {wishlist.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>

      <div className="text-center">
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

export default WishlistPage;
