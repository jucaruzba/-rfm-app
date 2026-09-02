import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
import { notificationService } from "../services/notificationService";

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const userId = user.idUser || user.id;
      const response = await notificationService.getUserNotifications(userId);
      setNotifications(
        Array.isArray(response) ? response : response.data || [],
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className="relative p-2 bg-white text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[10px] border border-[#E5E5EA] transition-colors flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#E5E5EA] overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between bg-white">
            <h3 className="font-semibold text-[#1C1C1E] text-[14px]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-[#171717] hover:underline lowercase font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 size={13} strokeWidth={1.5} /> mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#8E8E93] text-[13px]">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5EA]">
                {notifications.map((n) => {
                  const isUnread = !n.isRead && !n.read;
                  return (
                    <div
                      key={n.idNotification}
                      className={`p-3.5 flex gap-3 hover:bg-[#FAFAFA] transition-colors ${
                        isUnread ? "bg-[#FAFAFA]" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] ${
                            isUnread
                              ? "font-semibold text-[#1C1C1E]"
                              : "font-normal text-[#1C1C1E]"
                          }`}
                        >
                          {n.title || "Notification"}
                        </p>
                        <p className="text-[12px] text-[#6E6E73] mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[11px] text-[#AEAEB2] mt-1.5 block lowercase">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0 items-center justify-center">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n.idNotification)}
                            className="text-[#171717] hover:bg-[#171717]/10 p-1 rounded-md transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check size={14} strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.idNotification)}
                          className="text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 p-1 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
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

