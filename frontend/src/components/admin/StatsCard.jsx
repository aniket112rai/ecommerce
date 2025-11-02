// frontend/src/components/admin/StatsCard.jsx
import React from "react";

const StatsCard = ({ title, value }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
};

export default StatsCard;
