import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Clock,
  CheckCircle2,
  Loader2,
  Bell,
  AlertCircle,
  Repeat,
  Trash2,
  Edit2,
  CalendarDays,
  LayoutGrid,
  List,
  Inbox,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { reminderService } from "../services/reminderService";
import { getUserIdFromToken } from "../utils/auth";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
  startOfDay,
  endOfDay,
  differenceInDays,
} from "date-fns";
import { enUS } from "date-fns/locale";
import MonthYearPicker from "../components/MonthYearPicker";
import { formatUsDate, formatUsTime } from "../utils/dateUtils";

// Componente DayCell
const DayCell = ({ date, selectedDate, dayReminders, onDateClick }) => {
  const isSelected = isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);
  const hasReminders = dayReminders && dayReminders.length > 0;
  const count = dayReminders?.length || 0;
  const isCurrentMonth = isSameMonth(date, selectedDate);

  return (
    <button
      onClick={() => onDateClick(date)}
      className={`
        relative w-full aspect-square rounded-[8px] transition-colors cursor-pointer
        border
        ${
          isSelected
            ? "border-[#171717] bg-[#171717] text-white font-semibold shadow-xs"
            : isTodayDate
            ? "border-[#171717]/40 bg-[#FAFAFA] text-[#1C1C1E] font-semibold"
            : "border-transparent hover:bg-[#FAFAFA] text-[#1C1C1E]"
        }
        ${!isCurrentMonth ? "opacity-30" : ""}
      `}
    >
      <div className="flex flex-col items-center justify-center h-full p-1">
        <span className="text-[13px]">
          {format(date, "d")}
        </span>
        {hasReminders && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <span
              className={`text-[9.5px] px-1 rounded-full font-medium ${
                isSelected
                  ? "bg-white text-[#171717]"
                  : "bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73]"
              }`}
            >
              {count}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

// Componente ReminderCard
const ReminderCard = ({
  reminder,
  isCompact = false,
  onEdit,
  onDelete,
  onComplete,
  completingId,
  deletingId,
}) => {
  const date = parseISO(reminder.reminderDate);
  const isCompleted = reminder.isCompleted;

  const getRepeatLabel = (repeatType) => {
    const labels = {
      NONE: "one time",
      DAILY: "daily",
      WEEKLY: "weekly",
      MONTHLY: "monthly",
      QUARTERLY: "quarterly",
      YEARLY: "yearly",
    };
    return labels[repeatType] || "one time";
  };

  const getPriority = (date) => {
    const now = new Date();
    const daysDiff = differenceInDays(parseISO(date), now);
    if (daysDiff < 0)
      return {
        label: "overdue",
        color: "text-[#EF4444]",
      };
    if (daysDiff === 0)
      return {
        label: "today",
        color: "text-[#171717]",
      };
    if (daysDiff <= 3)
      return {
        label: "soon",
        color: "text-[#F59E0B]",
      };
    return {
      label: "upcoming",
      color: "text-[#10B981]",
    };
  };

  const priority = getPriority(reminder.reminderDate);

  return (
    <div
      className={`
        group relative bg-white rounded-[10px] border transition-colors
        ${
          isCompleted
            ? "border-[#E5E5EA] bg-[#FAFAFA] opacity-60"
            : "border-[#E5E5EA] hover:border-[#171717]/30"
        }
        ${isCompact ? "p-3" : "p-4"}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`
                font-medium text-[#1C1C1E]
                ${isCompact ? "text-[13px]" : "text-[14px]"}
                ${isCompleted ? "line-through text-[#AEAEB2]" : ""}
              `}
            >
              {reminder.title}
            </h4>
          </div>

          {!isCompact && reminder.description && (
            <p className="text-[12px] text-[#6E6E73] mt-1 line-clamp-2">
              {reminder.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-[#6E6E73]">
            <span className={`font-medium lowercase ${priority.color}`}>
              {priority.label}
            </span>

            <span>•</span>

            <span className="flex items-center gap-1">
              <Clock size={11} strokeWidth={1.5} />
              <span>{formatUsTime(date)}</span>
            </span>

            {reminder.repeatType !== "NONE" && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] px-1.5 py-0.5 rounded-full lowercase text-[10px]">
                  <Repeat size={10} strokeWidth={1.5} />
                  {getRepeatLabel(reminder.repeatType)}
                </span>
              </>
            )}

            {reminder.objectTitle && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-1.5 py-0.5 rounded-full lowercase text-[10px]">
                  <Tag size={10} strokeWidth={1.5} />
                  {reminder.objectTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {!isCompact && (
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <button
                onClick={() => onComplete(reminder.idReminder)}
                disabled={completingId === reminder.idReminder}
                className="p-1.5 text-[#AEAEB2] hover:text-[#10B981] rounded-[6px] transition-colors cursor-pointer"
                title="Mark as completed"
              >
                {completingId === reminder.idReminder ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} strokeWidth={1.5} />
                )}
              </button>
            )}
            <button
              onClick={() => onEdit(reminder)}
              className="p-1.5 text-[#AEAEB2] hover:text-[#1C1C1E] rounded-[6px] transition-colors cursor-pointer"
              title="Edit"
            >
              <Edit2 size={14} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onDelete(reminder)}
              disabled={deletingId === reminder.idReminder}
              className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] rounded-[6px] transition-colors cursor-pointer"
              title="Delete"
            >
              {deletingId === reminder.idReminder ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} strokeWidth={1.5} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ReminderCalendar = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const [completingId, setCompletingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    reminderId: null,
    reminderTitle: "",
    isRecurring: false,
  });
  const [deleteFutureOption, setDeleteFutureOption] = useState(false);

  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderDate: format(new Date(), "yyyy-MM-dd"),
    reminderTime: "09:00",
    repeatType: "NONE",
    repeatEndDate: "",
  });

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getUserIdFromToken();
      if (!userId) return;

      const startDate = format(
        startOfDay(startOfMonth(selectedDate)),
        "yyyy-MM-dd'T'HH:mm:ss",
      );
      const endDate = format(
        endOfDay(endOfMonth(selectedDate)),
        "yyyy-MM-dd'T'HH:mm:ss",
      );

      const data = await reminderService.filterReminders({
        idUser: userId,
        startDate,
        endDate,
      });

      setReminders(data || []);
    } catch (err) {
      console.error("Error loading reminders:", err);
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const remindersByDate = useMemo(() => {
    const grouped = {};
    reminders.forEach((r) => {
      const dateKey = format(parseISO(r.reminderDate), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(r);
    });
    return grouped;
  }, [reminders]);

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return { days, monthStart, monthEnd };
  }, [selectedDate]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedReminder(null);
  };

  const handleMarkAsCompleted = async (id) => {
    try {
      setCompletingId(id);
      await reminderService.markAsCompleted(id);
      toast.success("Reminder completed");
      setReminders((prev) =>
        prev.map((r) => (r.idReminder === id ? { ...r, isCompleted: true } : r)),
      );
    } catch (err) {
      toast.error("Failed to update reminder");
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

    try {
      setIsCreating(true);
      const userId = await getUserIdFromToken();
      if (!userId) return;

      const reminderDateTime = `${newReminder.reminderDate}T${newReminder.reminderTime}:00`;

      if (editingReminder) {
        await reminderService.updateReminder(editingReminder.idReminder, {
          title: newReminder.title.trim(),
          description: newReminder.description.trim() || null,
          reminderDate: reminderDateTime,
        });
        toast.success("Reminder updated");
      } else {
        await reminderService.createReminder({
          title: newReminder.title.trim(),
          description: newReminder.description.trim() || null,
          reminderDate: reminderDateTime,
          idUser: userId,
          repeatType: newReminder.repeatType,
          repeatEndDate: newReminder.repeatEndDate
            ? `${newReminder.repeatEndDate}T23:59:59`
            : null,
        });
        toast.success("Reminder created");
      }

      resetModal();
      await fetchReminders();
    } catch (err) {
      toast.error("Failed to save reminder");
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setNewReminder({
      title: "",
      description: "",
      reminderDate: format(new Date(), "yyyy-MM-dd"),
      reminderTime: "09:00",
      repeatType: "NONE",
      repeatEndDate: "",
    });
    setEditingReminder(null);
    setIsModalOpen(false);
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    const date = parseISO(reminder.reminderDate);
    setNewReminder({
      title: reminder.title,
      description: reminder.description || "",
      reminderDate: format(date, "yyyy-MM-dd"),
      reminderTime: format(date, "HH:mm"),
      repeatType: reminder.repeatType || "NONE",
      repeatEndDate: reminder.repeatEndDate
        ? format(parseISO(reminder.repeatEndDate), "yyyy-MM-dd")
        : "",
    });
    setIsModalOpen(true);
    setSelectedReminder(null);
  };

  const openDeleteModal = (reminder) => {
    setDeleteFutureOption(false);
    setDeleteModal({
      isOpen: true,
      reminderId: reminder.idReminder,
      reminderTitle: reminder.title,
      isRecurring: reminder.repeatType !== "NONE",
    });
  };

  const confirmDelete = async () => {
    const { reminderId, isRecurring } = deleteModal;
    try {
      setDeletingId(reminderId);
      if (isRecurring && deleteFutureOption) {
        await reminderService.deleteChain(reminderId);
        toast.success("All future reminders deleted");
      } else {
        await reminderService.deleteReminder(reminderId);
        toast.success("Reminder deleted");
      }
      setReminders((prev) => prev.filter((r) => r.idReminder !== reminderId));
      if (selectedReminder?.idReminder === reminderId)
        setSelectedReminder(null);
      await fetchReminders();
    } catch (err) {
      toast.error("Failed to delete reminder");
    } finally {
      setDeletingId(null);
      setDeleteModal({
        isOpen: false,
        reminderId: null,
        reminderTitle: "",
        isRecurring: false,
      });
    }
  };

  const navigateDate = (direction) => {
    const amount = direction === "next" ? 1 : -1;
    switch (viewMode) {
      case "day":
        setSelectedDate(addDays(selectedDate, amount));
        break;
      case "week":
        setSelectedDate(addDays(selectedDate, amount * 7));
        break;
      case "month":
      default:
        // logic for month navigation if needed
        break;
    }
  };

  const getDateRangeLabel = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "EEEE, MMMM d, yyyy", { locale: enUS });
      case "week": {
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
      default:
        return format(selectedDate, "MMMM yyyy", { locale: enUS });
    }
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  const getReminderCount = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return remindersByDate[dateKey]?.length || 0;
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
        <p className="text-[12px] text-[#AEAEB2]">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
            Calendar
          </h1>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            Operational reminders & schedule
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#FAFAFA] p-1 rounded-[8px] border border-[#E5E5EA]">
            {[
              { id: "month", icon: LayoutGrid, label: "month" },
              { id: "week", icon: CalendarDays, label: "week" },
              { id: "day", icon: List, label: "day" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`
                  px-3 py-1.5 rounded-[6px] text-[12px] font-medium lowercase transition-colors cursor-pointer
                  ${
                    viewMode === id
                      ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                      : "text-[#6E6E73] hover:text-[#1C1C1E]"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 bg-white hover:bg-[#FAFAFA] text-[#1C1C1E] rounded-[8px] text-[12px] font-medium border border-[#E5E5EA] transition-colors cursor-pointer"
          >
            Today
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New reminder</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-[12px] border border-[#E5E5EA] p-3">
        <button
          onClick={() => navigateDate("prev")}
          className="p-1.5 hover:bg-[#FAFAFA] text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => setIsMonthPickerOpen(true)}
          className="flex items-center gap-2 hover:text-[#1C1C1E] py-1 px-3 rounded-[8px] transition-colors cursor-pointer"
        >
          <CalendarIcon size={15} strokeWidth={1.5} className="text-[#AEAEB2]" />
          <h2 className="text-[15px] font-semibold text-[#1C1C1E]">
            {getDateRangeLabel()}
          </h2>
        </button>

        <button
          onClick={() => navigateDate("next")}
          className="p-1.5 hover:bg-[#FAFAFA] text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] transition-colors cursor-pointer"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-medium text-[#AEAEB2] lowercase py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarData.days.map((date) => {
                const dateKey = format(date, "yyyy-MM-dd");
                const dayReminders = remindersByDate[dateKey] || [];
                return (
                  <DayCell
                    key={dateKey}
                    date={date}
                    selectedDate={selectedDate}
                    dayReminders={dayReminders}
                    onDateClick={handleDateClick}
                  />
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
                  {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: enUS })}
                </h3>
                <p className="text-[11px] text-[#6E6E73] lowercase">
                  {getReminderCount(selectedDate)} reminders scheduled
                </p>
              </div>

              <button
                onClick={() => {
                  const dateKey = format(selectedDate, "yyyy-MM-dd");
                  setNewReminder({
                    ...newReminder,
                    reminderDate: dateKey,
                    reminderTime: "09:00",
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1 text-[12px] font-medium text-[#171717] hover:underline cursor-pointer"
              >
                <Plus size={13} strokeWidth={1.5} />
                <span>Add reminder</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {remindersByDate[format(selectedDate, "yyyy-MM-dd")]?.map((r) => (
                <button
                  key={r.idReminder}
                  onClick={() => setSelectedReminder(r)}
                  className="w-full text-left"
                >
                  <ReminderCard
                    reminder={r}
                    isCompact
                    onEdit={handleEditReminder}
                    onDelete={openDeleteModal}
                    onComplete={handleMarkAsCompleted}
                    completingId={completingId}
                    deletingId={deletingId}
                  />
                </button>
              ))}
              {!remindersByDate[format(selectedDate, "yyyy-MM-dd")]?.length && (
                <p className="text-[12px] text-[#AEAEB2] py-6 text-center">
                  No reminders for this date
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedReminder ? (
            <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-5 space-y-4 sticky top-6 shadow-none">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
                  Reminder details
                </h3>
                <button
                  onClick={() => setSelectedReminder(null)}
                  className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
                >
                  <X size={15} strokeWidth={1.5} />
                </button>
              </div>

              <ReminderCard
                reminder={selectedReminder}
                onEdit={handleEditReminder}
                onDelete={openDeleteModal}
                onComplete={handleMarkAsCompleted}
                completingId={completingId}
                deletingId={deletingId}
              />

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E5EA] text-[11px]">
                <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] p-2.5 text-center">
                  <p className="text-[#AEAEB2] lowercase">created date</p>
                  <p className="font-medium text-[#1C1C1E] mt-0.5">
                    {formatUsDate(selectedReminder.createdAt)}
                  </p>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] p-2.5 text-center">
                  <p className="text-[#AEAEB2] lowercase">status</p>
                  <p className={`font-medium lowercase mt-0.5 ${selectedReminder.isCompleted ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                    {selectedReminder.isCompleted ? "completed" : "pending"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
              <CalendarIcon size={32} strokeWidth={1.5} className="text-[#AEAEB2] mb-2 opacity-60" />
              <h3 className="text-[14px] font-medium text-[#1C1C1E]">
                No reminder selected
              </h3>
              <p className="text-[12px] text-[#AEAEB2] mt-1">
                Click on a reminder from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
                {editingReminder ? "Edit reminder" : "New reminder"}
              </h3>
              <button
                onClick={resetModal}
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
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] text-[#1C1C1E] focus:border-[#171717] outline-none"
                  placeholder="reminder title..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] text-[#1C1C1E] focus:border-[#171717] outline-none resize-none"
                  placeholder="optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    date *
                  </label>
                  <input
                    type="date"
                    value={newReminder.reminderDate}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        reminderDate: e.target.value,
                      })
                    }
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] text-[#1C1C1E] focus:border-[#171717] outline-none"
                    required
                  />
                  <input
                    type="time"
                    value={newReminder.reminderTime}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        reminderTime: e.target.value,
                      })
                    }
                    className="px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] text-[#1C1C1E] focus:border-[#171717] outline-none"
                    required
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
                  className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] text-[13px] text-[#1C1C1E] focus:border-[#171717] outline-none cursor-pointer"
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
                  onClick={resetModal}
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

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-sm w-full bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
                Delete reminder
              </h3>
              <p className="text-[13px] text-[#6E6E73] mt-1">
                Are you sure you want to delete "{deleteModal.reminderTitle}"?
              </p>
            </div>

            {deleteModal.isRecurring && (
              <div className="space-y-2 pt-2 border-t border-[#E5E5EA]">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  recurring options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[12.5px] text-[#1C1C1E] cursor-pointer">
                    <input
                      type="radio"
                      name="reminderDeleteOption"
                      checked={!deleteFutureOption}
                      onChange={() => setDeleteFutureOption(false)}
                      className="text-[#171717] focus:ring-[#171717]"
                    />
                    <span>Delete this event only</span>
                  </label>

                  <label className="flex items-center gap-2 text-[12.5px] text-[#1C1C1E] cursor-pointer">
                    <input
                      type="radio"
                      name="reminderDeleteOption"
                      checked={deleteFutureOption}
                      onChange={() => setDeleteFutureOption(true)}
                      className="text-[#171717] focus:ring-[#171717]"
                    />
                    <span>Delete all future events</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    reminderId: null,
                    reminderTitle: "",
                    isRecurring: false,
                  })
                }
                className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === deleteModal.reminderId}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {deletingId === deleteModal.reminderId ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete reminder"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MonthYearPicker
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        currentDate={selectedDate}
        onSelect={(newDate) => setSelectedDate(newDate)}
      />
    </div>
  );
};

export default ReminderCalendar;
