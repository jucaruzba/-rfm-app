// pendingItemService.js
import api from "./api";

export const pendingItemService = {
  // Crear un nuevo pending item
  create: async (pendingItemRequest) => {
    const { data } = await api.post("/pending-items", pendingItemRequest);
    return data;
  },

  // Actualizar un pending item existente
  update: async (id, pendingItemRequest) => {
    const { data } = await api.put(`/pending-items/${id}`, pendingItemRequest);
    return data;
  },

  // Eliminar un pending item
  delete: async (id) => {
    await api.delete(`/pending-items/${id}`);
    // No retorna data porque el endpoint retorna 204 No Content
  },

  // Obtener un pending item por ID
  getById: async (id) => {
    const { data } = await api.get(`/pending-items/${id}`);
    return data;
  },
  // Obtener pending items por referenceId (lista de elementos)
  getByReferenceId: async (referenceId) => {
    const { data } = await api.get(`/pending-items/reference/${referenceId}`);
    return data;
  },

  // Obtener pending items paginados con filtros
  getFilters: async (page = 0, size = 10, filters = {}) => {
    const params = new URLSearchParams();

    // Filtros opcionales
    if (filters.status) params.append("status", filters.status);
    if (filters.createdBy) params.append("createdBy", filters.createdBy);
    if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters.referenceType)
      params.append("referenceType", filters.referenceType);

    // Parámetros de paginación
    params.append("page", page);
    params.append("size", size);

    const { data } = await api.get(
      `/pending-items/filters?${params.toString()}`,
    );
    return data; // Retorna Page<PendingItemDTO>
  },

  // Obtener lista de pending items sin paginación (todos los filtros)
  getFilter: async (filters = {}) => {
    const params = new URLSearchParams();

    // Filtros opcionales
    if (filters.status) params.append("status", filters.status);
    if (filters.createdBy) params.append("createdBy", filters.createdBy);
    if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
    if (filters.referenceType)
      params.append("referenceType", filters.referenceType);

    const { data } = await api.get(
      `/pending-items/filter?${params.toString()}`,
    );
    return data; // Retorna List<PendingItemDTO>
  },
};
