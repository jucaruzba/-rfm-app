import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
// Asegúrate de que la ruta de importación coincida con tu estructura real
import { notificationService } from "../services/notificationService";

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Derivamos la cantidad de no leídos (ajusta 'isRead' según el JSON de tu backend)
  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  // Obtener notificaciones
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // Utiliza idUser o id, dependiendo de cómo lo guardes en el token/AuthContext
      const userId = user.idUser || user.id;
      const response = await notificationService.getUserNotifications(userId);
      // Axios suele devolver la info en response.data
      setNotifications(
        Array.isArray(response) ? response : response.data || [],
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Cargar notificaciones al montar y cuando el usuario cambie
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Cerrar el dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Marcar una como leída (Endpoint: PUT /{idNotification}/read)
  const handleMarkAsRead = async (idNotification) => {
    try {
      await notificationService.markAsRead(idNotification);
      setNotifications((prev) =>
        prev.map((n) =>
          n.idNotification === idNotification
            ? { ...n, isRead: true, read: true }
            : n,
        ),
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Marcar múltiples como leídas (Endpoint: POST /mark-read)
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead && !n.read)
      .map((n) => n.idNotification);

    if (!unreadIds.length) return;

    try {
      await notificationService.markMultipleAsRead(unreadIds);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true })),
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Eliminar notificación (Endpoint: DELETE /{idNotification})
  const handleDelete = async (idNotification) => {
    try {
      await notificationService.deleteNotification(idNotification);
      setNotifications((prev) =>
        prev.filter((n) => n.idNotification !== idNotification),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-gray-50 text-[#001F3F] hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-[#001F3F] uppercase tracking-wider text-sm">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <CheckCircle2 size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scroll">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const isUnread = !n.isRead && !n.read;
                  return (
                    <div
                      key={n.idNotification}
                      className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors ${
                        isUnread ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${isUnread ? "font-bold text-[#001F3F]" : "font-medium text-gray-600"}`}
                        >
                          {n.title || "Notification"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 font-semibold mt-2 block uppercase tracking-wider">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n.idNotification)}
                            className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.idNotification)}
                          className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
