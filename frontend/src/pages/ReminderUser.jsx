import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Inbox,
  ChevronRight,
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  FileText,
  Tag,
  Check,
  Filter,
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
    reminderDate: "",
    reminderTime: "12:00",
    repeatType: "NONE",
    repeatEndDate: "",
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

      // Traemos todos los recordatorios (pendientes y completados) para mantener auditoría
      const data = await reminderService.filterReminders({
        idUser: userId,
        startDate,
        endDate,
      });

      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      toast.error("Failed to sync reminders");
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
      toast.success("Reminder marked as Done");
      // Mantenemos el registro visible en el historial y actualizamos su estado a completado
      setReminders((prev) =>
        prev.map((r) =>
          r.idReminder === id
            ? { ...r, isCompleted: true, completedAt: new Date().toISOString() }
            : r,
        ),
      );
    } catch (err) {
      console.error("Complete error", err);
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

      // Combinar fecha y hora
      const reminderDateTime = `${newReminder.reminderDate}T${newReminder.reminderTime}:00`;

      const reminderData = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim() || null,
        reminderDate: reminderDateTime,
        idUser: userId,
        idObject: null, // Recordatorio global
        repeatType: newReminder.repeatType || "NONE",
        repeatEndDate: newReminder.repeatType !== "NONE" && newReminder.repeatEndDate
          ? `${newReminder.repeatEndDate}T23:59:59`
          : null,
      };

      await reminderService.createReminder(reminderData);
      toast.success("Reminder created successfully");
      
      // Resetear formulario y cerrar modal
      setNewReminder({
        title: "",
        description: "",
        reminderDate: "",
        reminderTime: "12:00",
        repeatType: "NONE",
        repeatEndDate: "",
      });
      setIsModalOpen(false);
      
      // Recargar la lista
      await fetchReminders();
    } catch (err) {
      console.error("Error creating reminder:", err);
      toast.error("Failed to create reminder");
    } finally {
      setIsCreating(false);
    }
  };

  // Filtrado según estado seleccionado
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
        className={`group relative p-5 rounded-[2rem] border transition-all duration-300 hover:shadow-xl ${
          isCompleted
            ? "bg-gray-50/70 border-gray-200 opacity-80"
            : isTodayItem
              ? "bg-white border-blue-100 hover:shadow-blue-900/5"
              : "bg-gray-50/50 border-gray-100 hover:shadow-blue-900/5"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Semáforo de Estado */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isCompleted
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompleted ? "bg-green-500" : "bg-red-500 animate-pulse"
                  }`}
                />
                {isCompleted ? "Done" : "Pending"}
              </span>

              <h4
                className={`text-sm text-[16px] font-black text-[#001F3F] uppercase italic tracking-tighter truncate ${
                  isCompleted ? "line-through text-gray-400" : ""
                }`}
              >
                {item.title}
              </h4>

              {/* Mostrar objectTitle si existe */}
              {item.objectTitle && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  <Tag size={10} />
                  {item.objectTitle}
                </span>
              )}
            </div>

            <p className="text-[12px] text-gray-500 font-medium line-clamp-2 leading-relaxed mb-4">
              {item.description || "No operational description."}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <Clock size={12} />
                {formatUsTime(item.reminderDate)}
              </div>
              {!isTodayItem && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest">
                  <Calendar size={12} />
                  {formatUsDate(item.reminderDate)}
                </div>
              )}
              {isCompleted && item.completedAt && (
                <span className="text-[9px] font-bold text-green-600">
                  Completed: {formatUsDateTime(item.completedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Botón de Done / Completar */}
          {isCompleted ? (
            <div className="shrink-0 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-600 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
              <Check size={18} />
              <span>Done</span>
            </div>
          ) : (
            <button
              onClick={() => handleMarkAsCompleted(item.idReminder)}
              disabled={completingId === item.idReminder}
              title="Click Done to mark complete (archives in audit history)"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-2xl text-gray-500 hover:text-green-600 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
            >
              {completingId === item.idReminder ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
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
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-blue-600 animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
          Syncing Protocol...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="bg-[#001F3F] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Bell size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertCircle size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Temporal Monitor
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              Operational{" "}
              <span className="text-blue-400 font-light not-italic">
                Reminders
              </span>
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Status check & audit history for next 72 hours
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Stats Counter */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="text-right">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  Pending / Done
                </p>
                <p className="text-xl font-black italic">
                  {pendingCount} <span className="text-gray-400 font-light">/</span> {completedCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Inbox size={24} />
              </div>
            </div>
            
            {/* Botón para crear reminder */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <Plus size={18} />
              <span className="text-xs font-black uppercase tracking-wider">
                New Reminder
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs (Semáforo de Reminders) */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "All Reminders", count: reminders.length },
            { id: "pending", label: "🔴 Pending", count: pendingCount },
            { id: "completed", label: "🟢 Done / Completed", count: completedCount },
          ].map((tab) => (
            <button
              key={`status-tab-${tab.id}`}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                statusFilter === tab.id
                  ? "bg-[#001F3F] text-white shadow-md"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Today's Section */}
        <div className="space-y-6">
          <h3 className="flex items-center gap-3 text-[#001F3F] font-black uppercase tracking-widest text-sm italic">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Clock size={16} />
            </span>
            Today's Focus
          </h3>
          <div className="space-y-4">
            {todayList.length > 0 ? (
              todayList.map((r) => (
                <ReminderCard key={r.idReminder} item={r} isTodayItem={true} />
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center opacity-30">
                <CheckCircle2 size={32} className="mb-2 text-gray-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  No Reminders in this filter
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-6">
          <h3 className="flex items-center gap-3 text-gray-400 font-black uppercase tracking-widest text-sm italic">
            <span className="p-2 bg-gray-100 text-gray-400 rounded-xl">
              <Calendar size={16} />
            </span>
            Upcoming Protocols
          </h3>
          <div className="space-y-4">
            {upcomingList.length > 0 ? (
              upcomingList.map((r) => (
                <ReminderCard key={r.idReminder} item={r} isTodayItem={false} />
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center opacity-30">
                <Inbox size={32} className="mb-2 text-gray-400" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  No Future Events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear reminder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header del modal */}
            <div className="bg-[#001F3F] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={20} />
                  <h3 className="text-lg font-black uppercase tracking-wider">
                    New Operational Reminder
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-2">
                Global reminder (not linked to any object)
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCreateReminder} className="p-6 space-y-5">
              {/* Título */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Reminder Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call client regarding contract"
                    value={newReminder.title}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, title: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#001F3F] outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add additional details..."
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-[#001F3F] outline-none focus:border-blue-600 transition-colors resize-none"
                />
              </div>

              {/* Fecha y Hora en una fila */}
              <div className="grid grid-cols-2 gap-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <CalendarIcon size={12} />
                    Date *
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#001F3F] outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Hora */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <ClockIcon size={12} />
                    Time *
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#001F3F] outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Recurrence Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#001F3F] outline-none focus:border-blue-600 transition-colors cursor-pointer"
                  >
                    <option value="NONE">One time (No repeat)</option>
                    <option value="DAILY">Daily (Every day)</option>
                    <option value="WEEKLY">Weekly (Every week)</option>
                    <option value="MONTHLY">Monthly (Every month)</option>
                    <option value="QUARTERLY">Quarterly (Every 3 months)</option>
                    <option value="YEARLY">Yearly (Every year)</option>
                  </select>
                </div>

                {newReminder.repeatType !== "NONE" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                      Repeat Until (Optional - Never)
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
                      min={newReminder.reminderDate || undefined}
                      className="w-full bg-gray-50 border border-purple-200 rounded-xl p-3 text-sm font-bold text-[#001F3F] outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Reminder"
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