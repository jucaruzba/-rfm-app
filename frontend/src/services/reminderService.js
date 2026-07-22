import api from "./api";

export const reminderService = {
  createReminder: async (reminderData) => {
    const { data } = await api.post("/reminders", reminderData);
    return data;
  },

  getReminder: async (reminderId) => {
    const { data } = await api.get(`/reminders/${reminderId}`);
    return data;
  },

  getRemindersByUser: async (userId) => {
    const { data } = await api.get("/reminders", {
      params: { idUser: userId },
    });
    return data;
  },

  getRemindersByObject: async (objectId) => {
    const { data } = await api.get("/reminders/object", {
      params: { idObject: objectId },
    });
    return data;
  },

  getActiveReminders: async (userId) => {
    const { data } = await api.get("/reminders/active", {
      params: { idUser: userId },
    });
    return data;
  },

  getRemindersByRepeatType: async (userId, repeatType) => {
    const { data } = await api.get("/reminders/by-repeat-type", {
      params: { idUser: userId, repeatType },
    });
    return data;
  },

  getRemindersByDateRange: async (startDate, endDate) => {
    const { data } = await api.get("/reminders/by-date-range", {
      params: { startDate, endDate },
    });
    return data;
  },

  updateReminder: async (reminderId, reminderData) => {
    const { data } = await api.put(`/reminders/${reminderId}`, reminderData);
    return data;
  },

  markAsCompleted: async (reminderId) => {
    const { data } = await api.patch(`/reminders/${reminderId}/complete`);
    return data;
  },

  markAsCompletedAndCreateNext: async (reminderId) => {
    const { data } = await api.patch(
      `/reminders/${reminderId}/complete-and-next`,
    );
    return data;
  },

  getReminderChain: async (reminderId) => {
    const { data } = await api.get(`/reminders/${reminderId}/chain`);
    return data;
  },

  deleteReminder: async (reminderId) => {
    await api.delete(`/reminders/${reminderId}`);
  },

  deleteChain: async (reminderId) => {
    await api.delete(`/reminders/${reminderId}/chain`);
  },

  filterReminders: async (filters) => {
    const { data } = await api.get("/reminders/filter", {
      params: filters,
    });
    return data;
  },
};
