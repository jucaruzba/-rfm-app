import api from "./api";

export const nodeService = {
  // GET /api/v1/nodes/root/{idCompany}
  getRootNode: async (idCompany) => {
    const { data } = await api.get(`/nodes/root/${idCompany}`);
    return data;
  },

  // GET /api/v1/nodes/parent/{idParent}
  getNodesByParent: async (idParent) => {
    const { data } = await api.get(`/nodes/parent/${idParent}`);
    return data;
  },

  // POST /api/v1/nodes/folder
  createFolder: async (createFolderDTO) => {
    const { data } = await api.post("/nodes/folder", createFolderDTO);
    return data;
  },

  // POST /api/v1/nodes/upload (multipart/form-data)
  uploadFile: async (idParent, file, description = null, idCompany = null) => {
    const formData = new FormData();
    formData.append("idParent", idParent);
    formData.append("file", file);

    if (description) {
      formData.append("description", description);
    }

    if (idCompany) {
      formData.append("idCompany", idCompany);
    }

    const { data } = await api.post("/nodes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // DELETE /api/v1/nodes/{idNode}
  deleteFile: async (idNode) => {
    const { data } = await api.delete(`/nodes/${idNode}`);
    return data;
  },
};
