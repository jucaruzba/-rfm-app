import api from "./api";

export const userService = {
  // 1. Listar todos los usuarios (Requiere ADMIN)
  findAll: async () => {
    const { data } = await api.get("/users");
    return data;
  },

  // 2. Buscar usuario por ID
  findById: async (idUser) => {
    const { data } = await api.get(`/users/${idUser}`);
    return data;
  },

  // 3. Buscar usuario por Username
  getByUsername: async (username) => {
    const { data } = await api.get(`/users/username/${username}`);
    return data;
  },

  // 4. Crear un nuevo usuario (Requiere ADMIN)
  create: async (userData) => {
    const { data } = await api.post("/users", userData);
    return data;
  },

  // 5. Actualizar un usuario existente
  update: async (idUser, userData) => {
    const { data } = await api.put(`/users/${idUser}`, userData);
    return data;
  },

  // 6. Subir imagen de perfil (Maneja Multipart/Form-Data)
  uploadImage: async (idUser, imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const { data } = await api.post(`/users/${idUser}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // 7. Solicitar recuperación de contraseña
  forgotPassword: async (forgotPasswordDTO) => {
    const { data } = await api.post(
      "/users/forgot-password",
      forgotPasswordDTO,
    );
    return data; // Retorna el texto "Temporary password sent to your email."
  },
};
