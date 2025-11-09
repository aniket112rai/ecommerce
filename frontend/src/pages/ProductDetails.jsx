import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { cart, addToCart } = useCart();

  // ✅ Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/auth/me", {
          withCredentials: true,
        });
        setCurrentUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // ✅ Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/products/${id}`, {
          withCredentials: true,
        });
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ✅ Fetch reviews
  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/reviews/${id}`, {
        withCredentials: true,
      });
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  // ✅ Add review
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      setReviewLoading(true);
      await axios.post(
        "http://localhost:3000/api/reviews",
        { productId: id, rating, comment: reviewText },
        { withCredentials: true }
      );
      setReviewText("");
      setRating(5);
      fetchReviews();
    } catch (err) {
      console.error("Error adding review:", err);
    } finally {
      setReviewLoading(false);
    }
  };

  // ✅ Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/reviews/${reviewId}`, {
        withCredentials: true,
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  // ✅ Wishlist & Cart sync
  useEffect(() => {
    if (!product) return;
    setIsWishlisted(wishlist.some((item) => item.product?.id === product.id));
    setIsInCart(cart.some((item) => item.product?.id === product.id));
  }, [wishlist, cart, product]);

  const toggleWishlist = () => {
    if (!product) return;
    const wishlistItem = wishlist.find((item) => item.product?.id === product.id);
    if (isWishlisted && wishlistItem) removeFromWishlist(wishlistItem.id);
    else addToWishlist(product.id);
  };

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    await addToCart(product.id, 1);
  };

  if (loading)
    return <p className="text-center text-gray-600 mt-10">Loading product details...</p>;

  if (!product)
    return (
      <div className="text-center mt-10 text-red-500">
        <p>Product not found 😔</p>
        <Link to="/" className="text-blue-500 underline mt-3 block">
          Go back home
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      {/* Product & Info */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative flex justify-center items-center">
          <img
            src={product.images}
            alt={product.name}
            className="rounded-xl object-cover w-[90%] max-h-[400px]"
          />
          <button
            onClick={toggleWishlist}
            className={`absolute top-4 right-8 text-3xl ${
              isWishlisted ? "text-red-500" : "text-gray-400"
            } hover:scale-110 transition`}
          >
            {isWishlisted ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
          <p className="text-gray-600 mb-2 text-lg">
            Price: <span className="text-blue-600 font-semibold">${product.price.toFixed(2)}</span>
          </p>
          <p className="text-yellow-500 font-medium mb-2">
            ⭐ {product.rating ? `${product.rating.toFixed(1)} (${reviews.length} reviews)` : "No rating yet"}
          </p>
          <p className={`mb-4 font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </p>
          <p className="text-gray-700 mb-6 leading-relaxed">{product.description || "No description available."}</p>

          <div className="flex gap-4">
            <button
              onClick={toggleWishlist}
              className={`px-5 py-2 rounded-lg font-medium border transition ${
                isWishlisted
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-white text-red-500 border-red-500 hover:bg-red-50"
              }`}
            >
              {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>

            {isInCart ? (
              <button onClick={() => navigate("/cart")} className="px-5 py-2 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition">
                Go to Cart
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`px-5 py-2 rounded-lg font-medium transition ${
                  product.stock === 0 ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                Add to Cart
              </button>
            )}
          </div>

          <Link to="/" className="mt-6 inline-block text-blue-600 underline hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="w-full max-w-5xl mt-10 bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customer Reviews</h2>

        <form onSubmit={handleAddReview} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <label className="font-medium text-gray-700">Rating:</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded px-3 py-1">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} ⭐
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review..."
            className="w-full border rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="3"
            required
          />
          <button type="submit" disabled={reviewLoading} className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition">
            {reviewLoading ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 bg-gray-50 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">{r.user?.name || "Anonymous"}</p>
                  <span className="text-yellow-500">{r.rating} ⭐</span>
                </div>
                <p className="text-gray-700">{r.comment}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                  {currentUser && (r.userId === currentUser.id || currentUser.role === "admin") && (
                    <button onClick={() => handleDeleteReview(r.id)} className="text-red-500 text-sm hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
