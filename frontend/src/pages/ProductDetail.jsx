// frontend/src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      setProduct(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (!product) return <p>Loading...</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img src={product.images[0]} alt={product.name} className="w-full h-96 object-cover rounded"/>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-2">{product.description}</p>
          <p className="text-xl font-semibold mb-2">${product.price}</p>
          <p className="text-yellow-500 mb-4">Rating: {product.rating || "N/A"}</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2">
            Add to Cart
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Add to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
