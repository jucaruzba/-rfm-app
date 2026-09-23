import api from "./api";

export const leadService = {
  // Get active leads for the pipeline board (excludes WON, includes NEW, CONTACTED, QUOTED, CLOSED_LOST)
  getActiveLeads: async () => {
    const { data } = await api.get("/leads");
    return data;
  },

  // Get all leads (including WON)
  getAllLeads: async () => {
    const { data } = await api.get("/leads/all");
    return data;
  },

  // Get lead by ID
  getLeadById: async (id) => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  // Create new lead
  createLead: async (leadData) => {
    const { data } = await api.post("/leads", leadData);
    return data;
  },

  // Update lead details
  updateLead: async (id, leadData) => {
    const { data } = await api.put(`/leads/${id}`, leadData);
    return data;
  },

  // Change stage (with "Log it" note and required new nextFollowUp date)
  changeStage: async (id, stageData) => {
    const { data } = await api.patch(`/leads/${id}/stage`, stageData);
    return data;
  },

  // Mark as Won (converts lead into Client Company and creates 5 onboarding tasks)
  markAsWon: async (id) => {
    const { data } = await api.post(`/leads/${id}/won`);
    return data;
  },

  // Mark as Lost / Not moving forward
  markAsLost: async (id, reason) => {
    const { data } = await api.post(`/leads/${id}/lost`, { reason });
    return data;
  },

  // Delete lead permanently
  deleteLead: async (id) => {
    await api.delete(`/leads/${id}`);
  },
};
