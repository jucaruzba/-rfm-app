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

  getCompanies: async () => {
    const { data } = await api.get("/companies");
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
      },
    );
    return data;
  },

updateTypeAndStatus: async (companyId, type, status) => {
  const { data } = await api.patch(`/companies/${companyId}/type-status-params`, {
    type: type,
    status: status,
  });
  return data;
},
};
