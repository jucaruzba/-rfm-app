import api from "./api";

export const projectObjectService = {
  getObject: async (projectId, objectId) => {
    const { data } = await api.get(
      `/projects/${projectId}/objects/${objectId}`
    );
    return data;
  },

  getObjectsByProject: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/objects`);
    return data;
  },

  getObjectChildren: async (projectId, objectId) => {
    const { data } = await api.get(
      `/projects/${projectId}/objects/${objectId}/children`
    );
    return data;
  },

  createObject: async (projectId, objectData) => {
    const { data } = await api.post(`/projects/${projectId}/objects`, objectData);
    return data;
  },

  updateObject: async (projectId, objectId, objectData) => {
    const { data } = await api.put(
      `/projects/${projectId}/objects/${objectId}`,
      objectData
    );
    return data;
  },

  deleteObject: async (projectId, objectId) => {
    await api.delete(`/projects/${projectId}/objects/${objectId}`);
  },
};
