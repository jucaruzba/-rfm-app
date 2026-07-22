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
  Sparkles,
  Check,
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
  addMonths,
  addWeeks,
  startOfDay,
  endOfDay,
  differenceInDays,
  subMonths,
  subWeeks,
  subDays,
  addDays,
} from "date-fns";
import { es } from "date-fns/locale";

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
        relative w-full aspect-square rounded-xl transition-all duration-300
        hover:scale-105 hover:shadow-md group
        ${isSelected ? "ring-2 ring-blue-600 ring-offset-2 shadow-lg shadow-blue-500/20" : ""}
        ${isTodayDate ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30" : ""}
        ${!isCurrentMonth ? "opacity-30" : "hover:bg-blue-50"}
      `}
    >
      <div className="flex flex-col items-center justify-center h-full p-1">
        <span
          className={`
            text-sm font-bold transition-all
            ${isTodayDate ? "text-white" : "text-[#001F3F]"}
            ${isSelected && !isTodayDate ? "text-blue-600" : ""}
          `}
        >
          {format(date, "d")}
        </span>
        {hasReminders && (
          <div className="flex items-center gap-0.5 mt-1">
            {count > 0 && (
              <span
                className={`
                  text-[8px] font-black px-1.5 py-0.5 rounded-full
                  ${isTodayDate ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}
                `}
              >
                {count}
              </span>
            )}
          </div>
        )}
        {hasReminders && !isTodayDate && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {dayReminders.slice(0, 3).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
            ))}
            {dayReminders.length > 3 && (
              <span className="text-[6px] font-black text-blue-400">+</span>
            )}
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
      NONE: "One time",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      YEARLY: "Yearly",
    };
    return labels[repeatType] || "One time";
  };

  const getPriority = (date) => {
    const now = new Date();
    const daysDiff = differenceInDays(parseISO(date), now);
    if (daysDiff < 0)
      return {
        label: "Overdue",
        color: "bg-red-100 text-red-700 border-red-200",
      };
    if (daysDiff === 0)
      return {
        label: "Today",
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    if (daysDiff <= 3)
      return {
        label: "Soon",
        color: "bg-orange-100 text-orange-700 border-orange-200",
      };
    return {
      label: "Upcoming",
      color: "bg-green-100 text-green-700 border-green-200",
    };
  };

  const priority = getPriority(reminder.reminderDate);

  return (
    <div
      className={`
        group relative bg-white rounded-2xl border-2 transition-all duration-300
        ${
          isCompleted
            ? "border-gray-100 opacity-50"
            : "border-gray-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5"
        }
        ${isCompact ? "p-3" : "p-5"}
      `}
    >
      {!isCompleted && (
        <div
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${priority.color
            .split(" ")[0]
            .replace("bg-", "bg-")}`}
        />
      )}

      <div className={`flex items-start gap-3 ${!isCompact ? "pl-3" : ""}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isCompleted ? "bg-gray-400" : "bg-blue-500"
              }`}
            />
            <h4
              className={`
                font-black text-[#001F3F] uppercase italic tracking-tighter
                ${isCompact ? "text-sm" : "text-base"}
                ${isCompleted ? "line-through opacity-50" : ""}
              `}
            >
              {reminder.title}
            </h4>
          </div>

          {!isCompact && reminder.description && (
            <p className="text-sm text-gray-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">
              {reminder.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${priority.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  priority.label === "Overdue"
                    ? "bg-red-500"
                    : priority.label === "Today"
                      ? "bg-blue-500"
                      : priority.label === "Soon"
                        ? "bg-orange-500"
                        : "bg-green-500"
                }`}
              />
              {priority.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-[8px] font-black text-gray-600 uppercase tracking-wider">
              <Clock size={10} />
              {format(date, "HH:mm")}
            </span>

            {reminder.repeatType !== "NONE" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-[8px] font-black text-purple-700 uppercase tracking-wider">
                <Repeat size={10} />
                {getRepeatLabel(reminder.repeatType)}
              </span>
            )}

            {reminder.objectTitle && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[8px] font-black text-blue-600 uppercase tracking-wider">
                <Tag size={10} />
                {reminder.objectTitle}
              </span>
            )}
          </div>

          {!isCompact && reminder.repeatEndDate && (
            <div className="flex items-center gap-1 mt-2 text-[8px] font-black text-gray-400 uppercase tracking-wider">
              <CalendarIcon size={10} />
              Until{" "}
              {format(parseISO(reminder.repeatEndDate), "MMM d, yyyy", {
                locale: es,
              })}
            </div>
          )}
        </div>

        {!isCompact && (
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onEdit(reminder)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-all rounded-xl hover:bg-blue-50 hover:scale-110"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(reminder)}
              disabled={deletingId === reminder.idReminder}
              className="p-2 text-gray-400 hover:text-red-600 transition-all rounded-xl hover:bg-red-50 hover:scale-110 disabled:opacity-50"
              title="Delete"
            >
              {deletingId === reminder.idReminder ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
            <button
              onClick={() => onComplete(reminder.idReminder)}
              disabled={completingId === reminder.idReminder}
              className="p-2 text-gray-400 hover:text-green-600 transition-all rounded-xl hover:bg-green-50 hover:scale-110 disabled:opacity-50"
              title="Complete"
            >
              {completingId === reminder.idReminder ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
            </button>
          </div>
        )}
      </div>

      {isCompact && !isCompleted && (
        <button
          onClick={() => onComplete(reminder.idReminder)}
          disabled={completingId === reminder.idReminder}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-green-600 transition-all rounded-lg hover:bg-green-50 hover:scale-110 disabled:opacity-50 opacity-0 group-hover:opacity-100"
        >
          {completingId === reminder.idReminder ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
        </button>
      )}
    </div>
  );
};

// Componente principal
const ReminderCalendar = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    reminderId: null,
    reminderTitle: "",
    isRecurring: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "09:00",
    repeatType: "NONE",
    repeatEndDate: "",
  });

  // Calendario de fechas - CORREGIDO
  const calendarData = useMemo(() => {
    let start, end;
    // Normalizar fecha para evitar problemas de zona horaria
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(0, 0, 0, 0);

    switch (viewMode) {
      case "day":
        start = startOfDay(normalizedDate);
        end = endOfDay(normalizedDate);
        break;
      case "week":
        start = startOfWeek(normalizedDate, { weekStartsOn: 1 });
        end = endOfWeek(normalizedDate, { weekStartsOn: 1 });
        break;
      case "month":
      default:
        start = startOfWeek(startOfMonth(normalizedDate), { weekStartsOn: 1 });
        end = endOfWeek(endOfMonth(normalizedDate), { weekStartsOn: 1 });
        break;
    }
    const days = eachDayOfInterval({ start, end });
    return { days, start, end };
  }, [selectedDate, viewMode]);

  const remindersByDate = useMemo(() => {
    const grouped = {};
    reminders.forEach((reminder) => {
      const dateKey = format(parseISO(reminder.reminderDate), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(reminder);
    });
    return grouped;
  }, [reminders]);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getUserIdFromToken();
      if (!userId) {
        toast.error("User session not found");
        return;
      }

      const { start, end } = calendarData;
      const startDate = format(start, "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(endOfDay(end), "yyyy-MM-dd'T'HH:mm:ss");

      const data = await reminderService.filterReminders({
        idUser: userId,
        isCompleted: false,
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
  }, [calendarData]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateKey = format(date, "yyyy-MM-dd");
    const dayReminders = remindersByDate[dateKey] || [];
    if (dayReminders.length > 0) {
      setSelectedReminder(dayReminders[0]);
    } else {
      setSelectedReminder(null);
      setNewReminder({
        ...newReminder,
        reminderDate: format(date, "yyyy-MM-dd"),
        reminderTime: "09:00",
      });
      setIsModalOpen(true);
    }
  };

  const handleMarkAsCompleted = async (id) => {
    try {
      setCompletingId(id);
      await reminderService.markAsCompleted(id);
      toast.success("🎉 Task accomplished!");
      setReminders((prev) => prev.filter((r) => r.idReminder !== id));
      if (selectedReminder?.idReminder === id) setSelectedReminder(null);
    } catch (err) {
      toast.error("Update failed");
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
        repeatEndDate: newReminder.repeatEndDate
          ? `${newReminder.repeatEndDate}T23:59:59`
          : null,
      };

      if (editingReminder) {
        await reminderService.updateReminder(
          editingReminder.idReminder,
          reminderData,
        );
        toast.success("✨ Reminder updated successfully");
      } else {
        await reminderService.createReminder(reminderData);
        toast.success("✨ Reminder created successfully");
      }

      resetModal();
      await fetchReminders();
    } catch (err) {
      console.error("Error saving reminder:", err);
      toast.error("Failed to save reminder");
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setNewReminder({
      title: "",
      description: "",
      reminderDate: "",
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
    setDeleteModal({
      isOpen: true,
      reminderId: reminder.idReminder,
      reminderTitle: reminder.title,
      isRecurring: reminder.repeatType !== "NONE",
    });
  };

  const confirmDelete = async () => {
    const { reminderId } = deleteModal;
    try {
      setDeletingId(reminderId);
      await reminderService.deleteChain(reminderId);
      toast.success("🗑️ Reminder chain deleted");
      setReminders((prev) => prev.filter((r) => r.idReminder !== reminderId));
      if (selectedReminder?.idReminder === reminderId)
        setSelectedReminder(null);
      await fetchReminders();
    } catch (err) {
      console.error("Error deleting reminder:", err);
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

  // 🔥 NAVEGACIÓN CORREGIDA - Usando funciones de date-fns
  const navigateDate = (direction) => {
    const amount = direction === "next" ? 1 : -1;

    switch (viewMode) {
      case "day":
        setSelectedDate(addDays(selectedDate, amount));
        break;
      case "week":
        setSelectedDate(addWeeks(selectedDate, amount));
        break;
      case "month":
      default:
        setSelectedDate(addMonths(selectedDate, amount));
        break;
    }
  };

  const getDateRangeLabel = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });
      case "week": {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM, yyyy", { locale: es })}`;
      }
      default:
        return format(selectedDate, "MMMM yyyy", { locale: es });
    }
  };

  // 🔥 GO TO TODAY CORREGIDO
  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    // Cambiar a vista día solo si estamos en mes
    if (viewMode === "month") {
      setViewMode("day");
    }
  };

  const getReminderCount = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return remindersByDate[dateKey]?.length || 0;
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bell size={20} className="text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
          Loading Calendar...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="bg-[#001F3F] rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CalendarIcon size={160} />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-400">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    Reminder Calendar
                  </span>
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                  Operational{" "}
                  <span className="text-blue-400 font-light not-italic">
                    Timeline
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                  {[
                    { id: "month", icon: LayoutGrid },
                    { id: "week", icon: CalendarDays },
                    { id: "day", icon: List },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setViewMode(id)}
                      className={`
                        p-2 rounded-lg transition-all
                        ${
                          viewMode === id
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                        }
                      `}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10"
                >
                  Today
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  <Plus size={16} />
                  New
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
              <Sparkles size={16} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-black text-[#001F3F] uppercase tracking-tight">
              {getDateRangeLabel()}
            </h2>
          </div>

          <button
            onClick={() => navigateDate("next")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:scale-110"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
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

            {/* Lista del día */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                    <CalendarIcon size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#001F3F] uppercase tracking-tight">
                      {format(selectedDate, "EEEE, d 'de' MMMM", {
                        locale: es,
                      })}
                    </h3>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      {getReminderCount(selectedDate)} tasks scheduled
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {remindersByDate[format(selectedDate, "yyyy-MM-dd")]?.map(
                  (r) => (
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
                  ),
                )}
                {!remindersByDate[format(selectedDate, "yyyy-MM-dd")]
                  ?.length && (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                      <Inbox size={32} className="text-gray-300" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      No reminders for this day
                    </p>
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
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-[9px] font-black text-white uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Plus size={12} />
                      Create Reminder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Detalle */}
          <div className="lg:col-span-2">
            {selectedReminder ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden sticky top-6">
                <div className="relative">
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
                  <div className="p-5 space-y-4">
                    <ReminderCard
                      reminder={selectedReminder}
                      onEdit={handleEditReminder}
                      onDelete={openDeleteModal}
                      onComplete={handleMarkAsCompleted}
                      completingId={completingId}
                      deletingId={deletingId}
                    />
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Created
                        </p>
                        <p className="text-[10px] font-bold text-gray-600">
                          {format(
                            parseISO(selectedReminder.createdAt),
                            "MMM d",
                            { locale: es },
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Status
                        </p>
                        <p className="text-[10px] font-bold text-green-600">
                          Active
                        </p>
                      </div>
                    </div>
                    {selectedReminder.parentReminderId && (
                      <div className="text-[8px] font-black text-gray-300 uppercase tracking-wider text-center bg-gray-50 py-2 rounded-lg">
                        🔄 Part of recurring chain
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-lg flex flex-col items-center justify-center min-h-[350px]">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <CalendarIcon size={40} className="text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles size={12} className="text-white" />
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-black text-[#001F3F] uppercase tracking-tight">
                  No Reminder Selected
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-1">
                  Click on a reminder to see details
                </p>
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
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-[9px] font-black text-white uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
                >
                  <Plus size={12} />
                  Add to this day
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Crear/Editar */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="bg-[#001F3F] p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      {editingReminder ? (
                        <Edit2 size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wider">
                        {editingReminder ? "Edit Reminder" : "New Reminder"}
                      </h3>
                      <p className="text-[8px] text-blue-300 font-black uppercase tracking-[0.2em]">
                        {editingReminder
                          ? "Update your reminder"
                          : "Create a new reminder"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetModal}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateReminder} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Add details..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                    Date & Time *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
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
                      className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                    Repeat
                  </label>
                  <select
                    value={newReminder.repeatType}
                    onChange={(e) =>
                      setNewReminder({
                        ...newReminder,
                        repeatType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="NONE">One time</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                {newReminder.repeatType !== "NONE" && (
                  <div>
                    <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                      Repeat Until
                    </label>
                    <input
                      type="date"
                      value={newReminder.repeatEndDate}
                      onChange={(e) =>
                        setNewReminder({
                          ...newReminder,
                          repeatEndDate: e.target.value,
                        })
                      }
                      min={
                        newReminder.reminderDate ||
                        format(new Date(), "yyyy-MM-dd")
                      }
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-600 uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black text-white uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {editingReminder ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        {editingReminder ? "Update" : "Create"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Eliminar */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider">
                    Delete Reminder
                  </h3>
                  <p className="text-[8px] text-red-200 font-black uppercase tracking-[0.2em]">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4">
                <p className="text-sm font-black text-[#001F3F]">
                  "{deleteModal.reminderTitle}"
                </p>
                {deleteModal.isRecurring && (
                  <div className="flex items-center gap-2 mt-2 text-xs font-black text-red-600">
                    <Repeat size={14} />
                    <span>
                      This will delete ALL reminders in this recurring chain
                    </span>
                  </div>
                )}
                {!deleteModal.isRecurring && (
                  <p className="text-xs font-medium text-gray-500 mt-2">
                    This reminder will be permanently deleted.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: false,
                      reminderId: null,
                      reminderTitle: "",
                      isRecurring: false,
                    })
                  }
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-600 uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingId === deleteModal.reminderId}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-xs font-black text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {deletingId === deleteModal.reminderId ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReminderCalendar;
