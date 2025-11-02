// frontend/src/components/Filters.jsx
import React, { useState } from "react";

const Filters = ({ onFilter }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({ search, category, priceMin, priceMax });
  };

  return (
    <form
      className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-center"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-3 rounded-lg w-full md:w-1/4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-3 rounded-lg w-full md:w-1/4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Min Price"
        value={priceMin}
        onChange={(e) => setPriceMin(e.target.value)}
        className="border p-3 rounded-lg w-full md:w-1/6 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <input
        type="number"
        placeholder="Max Price"
        value={priceMax}
        onChange={(e) => setPriceMax(e.target.value)}
        className="border p-3 rounded-lg w-full md:w-1/6 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <button
        type="submit"
        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
      >
        Apply
      </button>
    </form>
  );
};

export default Filters;
