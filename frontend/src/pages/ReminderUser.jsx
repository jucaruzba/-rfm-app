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

const ReminderUser = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  
  // State para el modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "12:00",
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
        isCompleted: false,
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
      toast.success("Task accomplished");
      setReminders((prev) => prev.filter((r) => r.idReminder !== id));
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

      // Combinar fecha y hora
      const reminderDateTime = `${newReminder.reminderDate}T${newReminder.reminderTime}:00`;

      const reminderData = {
        title: newReminder.title.trim(),
        description: newReminder.description.trim() || null,
        reminderDate: reminderDateTime,
        idUser: userId,
        idObject: null, // Recordatorio global
      };

      await reminderService.createReminder(reminderData);
      toast.success("Reminder created successfully");
      
      // Resetear formulario y cerrar modal
      setNewReminder({
        title: "",
        description: "",
        reminderDate: "",
        reminderTime: "12:00",
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

  const { todayList, upcomingList } = useMemo(() => {
    const today = [];
    const upcoming = [];

    reminders.forEach((r) => {
      if (isToday(parseISO(r.reminderDate))) {
        today.push(r);
      } else {
        upcoming.push(r);
      }
    });

    return { todayList: today, upcomingList: upcoming };
  }, [reminders]);

  const ReminderCard = ({ item, isTodayItem }) => (
    <div
      className={`group relative p-5 rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 ${
        isTodayItem
          ? "bg-white border-blue-100"
          : "bg-gray-50/50 border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isTodayItem ? "bg-blue-500" : "bg-gray-300"}`}
            />
            <h4 className="text-sm text-[16px] font-black text-[#001F3F] uppercase italic tracking-tighter truncate">
              {item.title}
            </h4>
            {/* Mostrar objectTitle si existe */}
            {item.objectTitle && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full text-[13px] font-black text-blue-600 uppercase tracking-wider">
                <Tag size={8} />
                {item.objectTitle}
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 font-medium line-clamp-2 leading-relaxed mb-4">
            {item.description || "No operational description."}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <Clock size={12} />
              {format(parseISO(item.reminderDate), "HH:mm aaa")}
            </div>
            {!isTodayItem && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest">
                <Calendar size={12} />
                {format(parseISO(item.reminderDate), "MMM dd")}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => handleMarkAsCompleted(item.idReminder)}
          disabled={completingId === item.idReminder}
          className="shrink-0 p-3 bg-white border border-gray-100 rounded-2xl text-gray-300 hover:text-green-600 hover:border-green-200 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {completingId === item.idReminder ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <CheckCircle2 size={20} />
          )}
        </button>
      </div>
    </div>
  );

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
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              Status check for the next 72 hours
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-400 uppercase">
                  Pending Items
                </p>
                <p className="text-2xl font-black italic">
                  {reminders.length} Units
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
                  Clean Schedule
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
              {/* Campo: Título */}
              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                  Title *
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g., Review quarterly report"
                    required
                  />
                </div>
              </div>

              {/* Campo: Descripción */}
              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                  Description (optional)
                </label>
                <div className="relative">
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Add additional details..."
                  />
                </div>
              </div>

              {/* Campo: Fecha */}
              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                  Date *
                </label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={newReminder.reminderDate}
                    onChange={(e) => setNewReminder({ ...newReminder, reminderDate: e.target.value })}
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Campo: Hora */}
              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-2">
                  Time *
                </label>
                <div className="relative">
                  <ClockIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={newReminder.reminderTime}
                    onChange={(e) => setNewReminder({ ...newReminder, reminderTime: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Info adicional */}
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-wider">
                  ⚡ This reminder will appear in your feed if scheduled within the next 72 hours
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-black text-gray-600 uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black text-white uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Create Reminder
                    </>
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