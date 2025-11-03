// frontend/src/components/admin/UserRow.jsx
import React from "react";

const UserRow = ({ user }) => {
  return (
    <tr>
      <td className="p-2 border text-center">{user.name}</td>
      <td className="p-2 border text-center">{user.email}</td>
      <td className="p-2 border text-center">{user.role}</td>
    </tr>
  );
};

export default UserRow;

