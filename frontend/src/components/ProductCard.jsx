// frontend/src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

const ProductCard = ({ product }) => {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const isWishlisted = wishlist.some(
    (item) => item.product?.id === product.id
  );

  const toggleWishlist = () => {
    const wishlistItem = wishlist.find(
      (item) => item.product?.id === product.id
    );
    if (isWishlisted && wishlistItem) removeFromWishlist(wishlistItem.id);
    else addToWishlist(product.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 flex flex-col overflow-hidden w-[270px]">
      <div className="relative">
        <img
          src={product.images}
          alt={product.name}
          className="h-56 w-full object-cover p-4 rounded-4xl"
        />
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            Out of Stock
          </span>
        )}
        {/* ❤️ Wishlist Icon */}
        <button
          onClick={toggleWishlist}
          className={`absolute top-2 right-2 text-xl ${
            isWishlisted ? "text-red-500" : "text-gray-400"
          } hover:scale-110 transition`}
        >
          {isWishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-semibold text-lg text-gray-800 mb-1 truncate">
          {product.name}
        </h2>
        <p className="text-gray-500 mb-2">${product.price.toFixed(2)}</p>
        <p className="text-yellow-500 mb-4">⭐ {product.rating ? product.rating.toFixed(1) : "0"}</p>
        <Link
          to={`/products/${product.id}`}
          className="mt-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 text-center font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
