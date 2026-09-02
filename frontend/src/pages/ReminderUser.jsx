import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Calendar as CalendarIcon,
  Tag,
  Check,
} from "lucide-react";
import { reminderService } from "../services/reminderService";
import { getUserIdFromToken } from "../utils/auth";
import { toast } from "sonner";
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  isToday,
  parseISO,
} from "date-fns";
import {
  formatUsDate,
  formatUsTime,
  formatUsDateTime,
} from "../utils/dateUtils";

const ReminderUser = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "completed"
  
  // State para el modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderDate: format(new Date(), "yyyy-MM-dd"),
    reminderTime: "12:00",
    repeatType: "NONE",
  });

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const userId = await getUserIdFromToken();

      if (!userId) {
        toast.error("User session not found");
        return;
      }

      // Range: Today 00:00:00 to Day After Tomorrow 23:59:59
      const startDate = format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(
        endOfDay(addDays(new Date(), 2)),
        "yyyy-MM-dd'T'HH:mm:ss",
      );

      const data = await reminderService.filterReminders({
        idUser: userId,
        startDate,
        endDate,
      });

      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleMarkAsCompleted = async (id) => {
    try {
      setCompletingId(id);
      await reminderService.markAsCompleted(id);
      toast.success("Reminder completed");
      setReminders((prev) =>
        prev.map((r) =>
          r.idReminder === id
            ? { ...r, isCompleted: true, completedAt: new Date().toISOString() }
            : r,
        ),
      );
    } catch (err) {
      toast.error("Failed to complete reminder");
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    if (!newReminder.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!newReminder.reminderDate) {
      toast.error("Date is required");
      return;
    }

    try {
      setIsCreating(true);
      const userId = await getUserIdFromToken();

      if (!userId) {
        toast.error("User session not found");
        return;
      }

      const reminderDateTime = `${newReminder.reminderDate}T${newReminder.reminderTime}:00`;

      const reminderData = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim() || null,
        reminderDate: reminderDateTime,
        idUser: userId,
        idObject: null,
        repeatType: newReminder.repeatType || "NONE",
        repeatEndDate: null,
      };

      await reminderService.createReminder(reminderData);
      toast.success("Reminder created");
      
      setNewReminder({
        title: "",
        description: "",
        reminderDate: format(new Date(), "yyyy-MM-dd"),
        reminderTime: "12:00",
        repeatType: "NONE",
      });
      setIsModalOpen(false);
      
      await fetchReminders();
    } catch (err) {
      toast.error("Failed to create reminder");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredReminders = useMemo(() => {
    if (statusFilter === "pending") {
      return reminders.filter((r) => !r.isCompleted);
    }
    if (statusFilter === "completed") {
      return reminders.filter((r) => r.isCompleted);
    }
    return reminders;
  }, [reminders, statusFilter]);

  const { todayList, upcomingList } = useMemo(() => {
    const today = [];
    const upcoming = [];

    filteredReminders.forEach((r) => {
      if (isToday(parseISO(r.reminderDate))) {
        today.push(r);
      } else {
        upcoming.push(r);
      }
    });

    return { todayList: today, upcomingList: upcoming };
  }, [filteredReminders]);

  const pendingCount = useMemo(
    () => reminders.filter((r) => !r.isCompleted).length,
    [reminders],
  );

  const completedCount = useMemo(
    () => reminders.filter((r) => r.isCompleted).length,
    [reminders],
  );

  const ReminderCard = ({ item, isTodayItem }) => {
    const isCompleted = item.isCompleted;

    return (
      <div
        className={`p-4 rounded-[10px] border transition-colors ${
          isCompleted
            ? "bg-[#FAFAFA] border-[#E5E5EA] opacity-60"
            : "bg-white border-[#E5E5EA] hover:border-[#171717]/30"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-medium lowercase ${
                  isCompleted ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {isCompleted ? "done" : "pending"}
              </span>

              <span>•</span>

              <h4
                className={`text-[14px] font-medium text-[#1C1C1E] truncate ${
                  isCompleted ? "line-through text-[#AEAEB2]" : ""
                }`}
              >
                {item.title}
              </h4>

              {item.objectTitle && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-full text-[10px] text-[#6E6E73] lowercase">
                  <Tag size={10} strokeWidth={1.5} />
                  {item.objectTitle}
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-[12px] text-[#6E6E73] line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#6E6E73] flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={11} strokeWidth={1.5} />
                <span>{formatUsTime(item.reminderDate)}</span>
              </span>

              {!isTodayItem && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} strokeWidth={1.5} />
                    <span>{formatUsDate(item.reminderDate)}</span>
                  </span>
                </>
              )}

              {isCompleted && item.completedAt && (
                <>
                  <span>•</span>
                  <span className="text-[#10B981]">
                    completed {formatUsDateTime(item.completedAt)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action button */}
          {isCompleted ? (
            <div className="shrink-0 p-1.5 text-[#10B981] flex items-center gap-1 text-[11px] font-medium lowercase">
              <Check size={14} strokeWidth={1.5} />
              <span>done</span>
            </div>
          ) : (
            <button
              onClick={() => handleMarkAsCompleted(item.idReminder)}
              disabled={completingId === item.idReminder}
              title="Mark as done"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E5E5EA] hover:border-[#10B981] hover:text-[#10B981] rounded-[8px] text-[#6E6E73] text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {completingId === item.idReminder ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} strokeWidth={1.5} />
              )}
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2">
        <Loader2 className="text-[#171717] animate-spin" size={24} strokeWidth={1.5} />
        <p className="text-[12px] text-[#AEAEB2]">Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
            Reminders
          </h1>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            {pendingCount} pending • {completedCount} completed
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>New reminder</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA] w-fit overflow-x-auto">
        {[
          { id: "all", label: "all", count: reminders.length },
          { id: "pending", label: "pending", count: pendingCount },
          { id: "completed", label: "completed", count: completedCount },
        ].map((tab) => (
          <button
            key={`status-tab-${tab.id}`}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium lowercase transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                : "text-[#6E6E73] hover:text-[#1C1C1E]"
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] text-[#AEAEB2]">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Section */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
            Today ({todayList.length})
          </h3>
          <div className="space-y-2.5">
            {todayList.length > 0 ? (
              todayList.map((r) => (
                <ReminderCard key={r.idReminder} item={r} isTodayItem={true} />
              ))
            ) : (
              <div className="py-8 bg-white border border-[#E5E5EA] rounded-[10px] text-center text-[#AEAEB2]">
                <p className="text-[12px]">No reminders for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
            Upcoming ({upcomingList.length})
          </h3>
          <div className="space-y-2.5">
            {upcomingList.length > 0 ? (
              upcomingList.map((r) => (
                <ReminderCard key={r.idReminder} item={r} isTodayItem={false} />
              ))
            ) : (
              <div className="py-8 bg-white border border-[#E5E5EA] rounded-[10px] text-center text-[#AEAEB2]">
                <p className="text-[12px]">No upcoming reminders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: New Reminder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
                New reminder
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="reminder title..."
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  rows="3"
                  placeholder="optional description..."
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newReminder.reminderDate}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        reminderDate: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newReminder.reminderTime}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        reminderTime: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  repeat
                </label>
                <select
                  value={newReminder.repeatType}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] cursor-pointer"
                >
                  <option value="NONE">one time</option>
                  <option value="DAILY">daily</option>
                  <option value="WEEKLY">weekly</option>
                  <option value="MONTHLY">monthly</option>
                  <option value="QUARTERLY">quarterly</option>
                  <option value="YEARLY">yearly</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save reminder"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderUser;