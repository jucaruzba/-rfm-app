import api from "./api";

export const projectService = {
  getProject: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}`);
    return data;
  },

  getProjects: async () => {
    const { data } = await api.get("/projects");
    return data;
  },

  createProject: async (projectData) => {
    const { data } = await api.post("/projects", projectData);
    return data;
  },

  updateProject: async (projectId, projectData) => {
    const { data } = await api.put(`/projects/${projectId}`, projectData);
    return data;
  },

  deleteProject: async (projectId) => {
    await api.delete(`/projects/${projectId}`);
  },

  getProjectsByUser: async (userId) => {
    const { data } = await api.get(`/projects/user/${userId}`);
    return data;
  },
};
