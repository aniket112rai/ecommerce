import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    id: null,
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // ✅ Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/addresses", {
        withCredentials: true,
      });
      setAddresses(data);
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Add or Update address
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        // Update existing address
        await axios.put(
          `http://localhost:3000/api/addresses/${form.id}`,
          form,
          { withCredentials: true }
        );
      } else {
        // Add new address
        await axios.post("http://localhost:3000/api/addresses", form, {
          withCredentials: true,
        });
      }

      setForm({
        id: null,
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal: "",
        country: "",
      });
      setEditing(false);
      fetchAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete address
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/addresses/${id}`, {
        withCredentials: true,
      });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  // ✅ Edit address
  const handleEdit = (address) => {
    setForm(address);
    setEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-5 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-5 text-gray-800">Manage Addresses</h1>

        {/* Address Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="line1"
              value={form.line1}
              onChange={handleChange}
              placeholder="Address Line 1"
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="line2"
              value={form.line2}
              onChange={handleChange}
              placeholder="Address Line 2"
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="State"
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="postal"
              value={form.postal}
              onChange={handleChange}
              placeholder="Postal Code"
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Country"
              required
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`mt-5 px-6 py-2 rounded-lg text-white ${
              editing ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
            } transition`}
          >
            {loading
              ? "Saving..."
              : editing
              ? "Update Address"
              : "Add Address"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({
                  id: null,
                  line1: "",
                  line2: "",
                  city: "",
                  state: "",
                  postal: "",
                  country: "",
                });
              }}
              className="ml-3 px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800 transition"
            >
              Cancel
            </button>
          )}
        </form>

        <div className="text-center mt-10">
            <Link
            to="/"
            className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
            >
            ← Back to Home
            </Link>
        </div>

        {/* Address List */}
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Your Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-gray-500">No addresses added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="border rounded-xl p-4 bg-gray-50 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <p className="font-medium text-gray-700">{a.line1}</p>
                  {a.line2 && <p className="text-gray-600">{a.line2}</p>}
                  <p className="text-gray-600">
                    {a.city}, {a.state} - {a.postal}
                  </p>
                  <p className="text-gray-600">{a.country}</p>
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => handleEdit(a)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressPage;
