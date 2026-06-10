// src/utils/authUtils.js
import { jwtDecode } from "jwt-decode";

export const getUsernameFromToken = () => {
  const token = localStorage.getItem("token"); // O el nombre que uses
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.sub;
  } catch (error) {
    return null;
  }
};