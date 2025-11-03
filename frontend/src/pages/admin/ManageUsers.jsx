// frontend/src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import UserRow from "../../components/admin/UserRow";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../components/admin/AdminNav";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/users", {
        withCredentials: true,
      });
  
      console.log("Fetched users:", data);
  
      // handle different response shapes safely
      const usersArray = data.users || data.data || data; 
      setUsers(Array.isArray(usersArray) ? usersArray : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      navigate("/login");
    }
  };
  
  
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Users</h1>
      <AdminNav/>
      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageUsers;
