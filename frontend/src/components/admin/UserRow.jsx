// frontend/src/components/admin/UserRow.jsx
import React from "react";

const UserRow = ({ user }) => {
  return (
    <tr>
      <td className="p-2 border">{user.name}</td>
      <td className="p-2 border">{user.email}</td>
      <td className="p-2 border">{user.role}</td>
    </tr>
  );
};

export default UserRow;

