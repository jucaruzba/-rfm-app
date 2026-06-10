import { jwtDecode } from "jwt-decode";
import api from "../services/api";

export const getUsernameFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.sub;
  } catch (error) {
    return null;
  }
};

// Versión mejorada: obtiene el userId haciendo una llamada al API
export const getUserIdFromToken = async () => {
  const username = getUsernameFromToken();
  if (!username) return null;

  try {
    const response = await api.get(`/users/username/${username}`);
    return response.data.id; // Ajusta 'id' según el nombre del campo en tu respuesta
  } catch (error) {
    console.error("Error obteniendo userId:", error);
    return null;
  }
};

