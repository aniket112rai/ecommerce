import React from "react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

const WishlistPage = () => {
  const { wishlist, loading } = useWishlist();

  if (loading) return <p className="text-center">Loading wishlist...</p>;

  if (wishlist.length === 0)
    return <p className="text-center mt-10">Your wishlist is empty ❤️</p>;

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {wishlist.map((item) => (
        <ProductCard key={item.id} product={item.product} />
      ))}
    </div>
  );
};

export default WishlistPage;
