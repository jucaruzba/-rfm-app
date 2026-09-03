import api from "./api";
import { formatDateToBackend } from "../utils/dateUtils";

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

    // Filtro de búsqueda por título (Backend LIKE)
    if (filters.title) params.append("title", filters.title);

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
    if (filters.title) params.append("title", filters.title);
    if (filters.start)
      params.append("start", formatDateToBackend(filters.start));
    if (filters.end) params.append("end", formatDateToBackend(filters.end));

    const { data } = await api.get(`/tasks/filter?${params.toString()}`);
    return data; // Retorna array de tareas
  },

  createTask: async (taskRequest) => {
    const payload = { ...taskRequest };
    if (payload.startDate && payload.startDate.includes("-")) {
      payload.startDate = formatDateToBackend(payload.startDate);
    }
    if (payload.endDate && payload.endDate.includes("-")) {
      payload.endDate = formatDateToBackend(payload.endDate);
    }
    if (payload.repeatEndDate && payload.repeatEndDate.includes("-")) {
      payload.repeatEndDate = formatDateToBackend(payload.repeatEndDate);
    }
    const { data } = await api.post("/tasks", payload);
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
    const payload = { ...taskData };
    if (payload.startDate && typeof payload.startDate === "string" && payload.startDate.includes("-")) {
      payload.startDate = formatDateToBackend(payload.startDate);
    }
    if (payload.endDate && typeof payload.endDate === "string" && payload.endDate.includes("-")) {
      payload.endDate = formatDateToBackend(payload.endDate);
    }
    if (payload.repeatEndDate && typeof payload.repeatEndDate === "string" && payload.repeatEndDate.includes("-")) {
      payload.repeatEndDate = formatDateToBackend(payload.repeatEndDate);
    }
    const { data } = await api.put(`/tasks/${idTask}`, payload);
    return data;
  },

  // Use existing nodes endpoints (same as activities) to list and upload files for a task
  getTaskNodes: async (parentId) => {
    const { data } = await api.get(`/nodes/parent/${parentId}`);
    return data;
  },

  uploadTaskNodeFile: async ({ file, idParent, idCompany, description }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("idParent", idParent);
    if (idCompany && Number(idCompany) > 0) {
      formData.append("idCompany", idCompany);
    }
    if (description) {
      formData.append("description", description);
    }
    const { data } = await api.post("/nodes/upload", formData, {
      headers: { "Content-Type": undefined },
    });
    return data;
  },

  deleteTask: async (idTask, deleteFuture = false) => {
    const { data } = await api.delete(`/tasks/${idTask}`, {
      params: { deleteFuture },
    });
    return data;
  },
};

