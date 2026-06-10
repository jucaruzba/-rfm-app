// notificationService.js
import api from "./api";

export const notificationService = {
  // Obtener todas las notificaciones de un usuario
  getUserNotifications: async (idUser) => {
    const { data } = await api.get(`/notifications/user/${idUser}`);
    return data;
  },

  // Obtener notificaciones paginadas de un usuario
  getUserNotificationsPaginated: async (
    idUser,
    page = 0,
    size = 10,
    sort = "createdAt",
    direction = "DESC",
  ) => {
    const { data } = await api.get(`/notifications/user/${idUser}/paginated`, {
      params: {
        page,
        size,
        sort: `${sort},${direction}`,
      },
    });
    return data; // Retorna Page<NotificationDTO>
  },

  // Obtener notificaciones no leídas de un usuario
  getUnreadNotifications: async (idUser) => {
    const { data } = await api.get(`/notifications/user/${idUser}/unread`);
    return data;
  },

  // Obtener una notificación específica por ID
  getNotification: async (idNotification) => {
    const { data } = await api.get(`/notifications/${idNotification}`);
    return data;
  },

  // Marcar una notificación como leída
  markAsRead: async (idNotification) => {
    const { data } = await api.put(`/notifications/${idNotification}/read`);
    return data;
  },

  // Marcar múltiples notificaciones como leídas
  markMultipleAsRead: async (idNotifications) => {
    const { data } = await api.post(
      "/notifications/mark-read",
      idNotifications,
    );
    return data; // Retorna { message: "Notifications marked as read" }
  },

  // Eliminar una notificación
  deleteNotification: async (idNotification) => {
    const { data } = await api.delete(`/notifications/${idNotification}`);
    return data; // Retorna { message: "Notification deleted" }
  },
};
