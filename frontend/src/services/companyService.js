import api from "./api";

const buildFormData = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return formData;
};

export const companyService = {
  getCompany: async (companyId) => {
    const { data } = await api.get(`/companies/${companyId}`);
    return data;
  },

  // Obtener todas las empresas (excluye archivadas)
  getCompanies: async () => {
    const { data } = await api.get("/companies");
    return data;
  },

  // Obtener todas las empresas incluyendo archivadas
  getCompaniesIncludingArchived: async () => {
    const { data } = await api.get("/companies/all");
    return data;
  },

  // Obtener solo empresas archivadas
  getArchivedCompanies: async () => {
    const { data } = await api.get("/companies/archived");
    return data;
  },

  // Obtener solo empresas activas
  getActiveCompanies: async () => {
    const { data } = await api.get("/companies/active");
    return data;
  },

  createCompany: async (companyData) => {
    const { data } = await api.post("/companies", companyData);
    return data;
  },

  uploadLogo: async (companyId, file) => {
    const { data } = await api.post(
      `/companies/${companyId}/logo`,
      buildFormData(file),
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  // Archivar empresa (soft delete)
  archiveCompany: async (companyId) => {
    const { data } = await api.delete(`/companies/${companyId}`);
    return data;
  },

  // Restaurar empresa archivada
  restoreCompany: async (companyId) => {
    const { data } = await api.patch(`/companies/${companyId}/restore`);
    return data;
  },

  // Hard delete (solo para empresas sin datos)
  hardDeleteCompany: async (companyId) => {
    await api.delete(`/companies/${companyId}/hard`);
  },

  // Verificar si tiene datos importantes
  checkHasData: async (companyId) => {
    const { data } = await api.get(`/companies/${companyId}/has-data`);
    return data;
  },

  updateTypeAndStatus: async (companyId, type, status) => {
    const { data } = await api.patch(
      `/companies/${companyId}/type-status-params`,
      {
        type: type,
        status: status,
      }
    );
    return data;
  },
};