import api from "./api";

// Convierte el formato HTML (YYYY-MM-DD) al formato de tu @DateTimeFormat (DD/MM/YYYY)
const formatDateToBackend = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const taskService = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();

    // Filtros por ID numérico (Long)
    if (filters.idCompany) params.append("idCompany", filters.idCompany);
    if (filters.idUserAssigned)
      params.append("idUserAssigned", filters.idUserAssigned);

    // Filtro por String de estado
    if (filters.status && filters.status !== "ALL")
      params.append("status", filters.status);

    // Filtros por Fecha exactos: mapeados a 'start' y 'end' como pide tu @GetMapping
    if (filters.start)
      params.append("start", formatDateToBackend(filters.start));
    if (filters.end) params.append("end", formatDateToBackend(filters.end));

    // NUEVO: Parámetros de paginación leídos por Spring Data Jpa a través de Pageable
    if (filters.page !== undefined) params.append("page", filters.page);
    if (filters.size !== undefined) params.append("size", filters.size);

    const { data } = await api.get(`/tasks/filters?${params.toString()}`);
    return data; // Ahora retorna el objeto 'Page' con el nodo .content interno
  },

  getTasksList: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.idCompany) params.append("idCompany", filters.idCompany);
    if (filters.idUserAssigned)
      params.append("idUserAssigned", filters.idUserAssigned);
    if (filters.status && filters.status !== "ALL")
      params.append("status", filters.status);
    if (filters.start)
      params.append("start", formatDateToBackend(filters.start));
    if (filters.end) params.append("end", formatDateToBackend(filters.end));

    const { data } = await api.get(`/tasks/filter?${params.toString()}`);
    return data; // Retorna array de tareas
  },

  createTask: async (taskRequest) => {
    const { data } = await api.post("/tasks", taskRequest);
    return data;
  },

  updateStatus: async (idTask, status) => {
    const { data } = await api.patch(
      `/tasks/${idTask}/status?status=${status}`,
    );
    return data;
  },

  // --- NUEVOS MÉTODOS MAPEADOS DEL TASKCOMMENTCONTROLLER ---

  getTaskComments: async (idTask) => {
    const { data } = await api.get(`/comments/task/${idTask}`);
    return data;
  },

  createTaskComment: async (taskCommentRequest) => {
    const { data } = await api.post("/comments/task", taskCommentRequest);
    return data;
  },

  deleteTaskComment: async (idComment, idUser) => {
    const { data } = await api.delete(`/comments/task/${idComment}`, {
      params: { idUser },
    });
    return data;
  },

  // --- NUEVOS MÉTODOS PARA TASK DETAIL VIEW ---

  getTask: async (idTask) => {
    const { data } = await api.get(`/tasks/${idTask}`);
    return data;
  },

  updateTask: async (idTask, taskData) => {
    const { data } = await api.put(`/tasks/${idTask}`, taskData);
    return data;
  },

  // Use existing nodes endpoints (same as activities) to list and upload files for a task
  getTaskNodes: async (parentId) => {
    const { data } = await api.get(`/nodes/parent/${parentId}`);
    return data;
  },

  uploadTaskNodeFile: async (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    const { data } = await api.post("/nodes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
