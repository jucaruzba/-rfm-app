import api from "./api";

const formDataFromPayload = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
};

export const activityService = {
  getActivities: async (params) => {
    const { data } = await api.get("/activities/filters", { params });
    return data;
  },

  getActivity: async (activityId) => {
    const { data } = await api.get(`/activities/${activityId}`);
    return data;
  },

  createActivity: async (activityData) => {
    const { data } = await api.post("/activities", activityData);
    return data;
  },

  updateActivity: async (activityId, activityData) => {
    const { data } = await api.put(`/activities/${activityId}`, activityData);
    return data;
  },

  deleteActivity: async (activityId) => {
    const { data } = await api.delete(`/activities/${activityId}`);
    return data;
  },

  getNodes: async (parentId) => {
    const { data } = await api.get(`/nodes/parent/${parentId}`);
    return data;
  },

  uploadNodeFile: async (payload) => {
    const formData = formDataFromPayload(payload);
    const { data } = await api.post("/nodes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getComments: async (activityId) => {
    const { data } = await api.get(`/comments/activity/${activityId}`);
    return data;
  },

  createComment: async (payload) => {
    const { data } = await api.post("/comments", payload);
    return data;
  },

  deleteComment: async (commentId, params) => {
    const { data } = await api.delete(`/comments/${commentId}`, { params });
    return data;
  },
};
