import { useState, useEffect, useMemo, useRef } from "react";
import { addDays, subDays, format, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Eye,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { activityService } from "../../services/activityService";
import { toast } from "sonner";
import ConfirmDialog from "../ui/ConfirmDialog"; // Ajusta la ruta según tu estructura

// Modales
import CreateActivityModal from "../admin/components/activity/CreateActivityModal";
import ActivityDetailView from "../admin/components/activity/ActivityDetailView";

const AdminDashboard = () => {
  const [baseDate, setBaseDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const dateInputRef = useRef(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [targetDate, setTargetDate] = useState("");
  
  // Estado para el modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "Delete",
    itemName: "",
    itemDescription: "",
    onConfirm: null,
    itemId: null,
  });
  
  // Estado para controlar la eliminación
  const [deletingActivity, setDeletingActivity] = useState(null);

  const daysToShow = useMemo(
    () => [subDays(baseDate, 1), baseDate, addDays(baseDate, 1)],
    [baseDate],
  );

  const fetchActivities = async () => {
    try {
      const data = await activityService.getActivities({
        start: format(daysToShow[0], "yyyy-MM-dd'T'00:00:00"),
        end: format(daysToShow[2], "yyyy-MM-dd'T'23:59:59"),
      });
      setActivities(data);
    } catch (err) {
      toast.error("Error de sincronización");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [baseDate]);

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.click();
      }
    }
  };

  const openDetail = (act) => {
    setSelectedActivity(act);
    setIsDetailOpen(true);
  };

  // Función para mostrar el diálogo de confirmación
  const handleDeleteActivityClick = (activity) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Activity",
      message: `Are you sure you want to delete the activity "${activity.title}"?`,
      confirmText: "Delete Activity",
      itemName: activity.title,
      itemDescription: activity.description || "No description provided",
      onConfirm: () => handleConfirmDeleteActivity(activity.idActivity),
      itemId: activity.idActivity,
    });
  };

  // Función para eliminar la actividad
  const handleConfirmDeleteActivity = async (id) => {
    setDeletingActivity(id);
    
    // Mostrar toast de carga
    const toastId = toast.loading("Deleting activity and associated files from NAS...", {
      closeButton: true,
    });
    
    try {
      await activityService.deleteActivity(id);
      
      toast.success("Activity deleted successfully", {
        id: toastId,
        closeButton: true,
      });
      
      // Actualizar la lista localmente (eliminación optimista)
      setActivities(prevActivities => prevActivities.filter(act => act.idActivity !== id));
      
      // Cerrar el modal
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Delete activity error", err);
      toast.error("Failed to delete activity", {
        id: toastId,
        closeButton: true,
      });
    } finally {
      setDeletingActivity(null);
    }
  };

  // Función para cerrar el diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* HEADER NAV: Responsivo y centrado */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm shrink-0">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <h1 className="text-xl md:text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
            Control <span className="text-gray-300 font-light">Hub</span>
          </h1>
          <div className="h-1 w-8 bg-blue-600 rounded-full mt-2"></div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setBaseDate(subDays(baseDate, 1))}
            className="p-2 hover:bg-white rounded-xl transition-all text-[#001F3F] hover:shadow-md"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <div
            onClick={handleCalendarClick}
            className="relative px-3 md:px-6 text-center border-x border-gray-200 min-w-[140px] md:min-w-[180px] cursor-pointer hover:bg-white transition-all group rounded-xl py-1"
          >
            <input
              ref={dateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 pointer-events-none -z-10"
              value={format(baseDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  const selected = new Date(e.target.value + "T00:00:00");
                  setBaseDate(selected);
                }
              }}
            />
            <div className="pointer-events-none">
              <h2 className="text-[20px] md:text-sm font-black text-[#333333] uppercase italic">
                {format(baseDate, "MMM dd, yyyy")}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setBaseDate(addDays(baseDate, 1))}
            className="p-2 hover:bg-white rounded-xl transition-all text-[#001F3F] hover:shadow-md"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* COLUMNAS DE ACTIVIDAD: Grid dinámico (1 col móvil, 3 col desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-280px)] overflow-visible lg:overflow-hidden pb-4">
        {daysToShow.map((day, idx) => {
          const isFocus = idx === 1;
          const dayActivities = activities
            .filter((act) => isSameDay(new Date(act.eventDate), day))
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

          return (
            <div
              key={day.toString()}
              className={`flex flex-col bg-white rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden min-h-[400px] lg:min-h-0 ${
                isFocus
                  ? "border-[#001F3F] shadow-2xl lg:scale-[1.02] z-10"
                  : "border-gray-50 lg:opacity-90"
              }`}
            >
              {/* Header de la columna */}
              <div
                className={`p-5 flex justify-between items-center shrink-0 ${isFocus ? "bg-[#001F3F] text-white" : "bg-gray-50"}`}
              >
                <div>
                  <p
                    className={`text-[20px] font-black uppercase tracking-[0.3em] ${isFocus ? "text-blue-300" : "text-gray-400"}`}
                  >
                    {format(day, "EEEE")}
                  </p>
                  <h2 className="text-lg font-black italic tracking-tighter uppercase leading-none mt-1">
                    {format(day, "dd MMM")}
                  </h2>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetDate(format(day, "yyyy-MM-dd"));
                    setIsCreateOpen(true);
                  }}
                  className={`p-2 rounded-xl transition-all shadow-sm ${
                    isFocus
                      ? "bg-blue-600 text-white hover:bg-blue-50"
                      : "bg-white text-[#001F3F] hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Lista de actividades con scroll propio en desktop */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-[#FDFDFD]">
                {dayActivities.length > 0 ? (
                  dayActivities.map((act) => (
                    <div
                      key={act.idActivity}
                      className="group relative p-4 bg-white rounded-[2rem] border-2 border-gray-50 shadow-md shadow-gray-200/40 hover:border-[#001F3F] transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[14px] font-black bg-[#001F3F] text-white">
                          {format(new Date(act.eventDate), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteActivityClick(act)}
                            disabled={deletingActivity === act.idActivity}
                            className="p-1.5 text-gray-200 hover:text-red-500 transition-all lg:opacity-0 lg:group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Activity"
                          >
                            {deletingActivity === act.idActivity ? (
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                          <button
                            onClick={() => openDetail(act)}
                            className="p-1.5 text-gray-300 hover:text-[#001F3F] transition-all"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                      <h2 className="text-[18px] font-black uppercase tracking-tight text-[#333333] mb-1 italic">
                        {act.title}
                      </h2>
                      <p className="text-[12px] font-medium text-gray-500 line-clamp-2 leading-relaxed italic">
                        {act.description || "Sin descripción operativa."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-10 text-center">
                    <Clock size={32} strokeWidth={1} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-2 italic">
                      No Data
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        selectedDate={targetDate}
        onActivityCreated={fetchActivities}
      />

      <ActivityDetailView
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activityId={selectedActivity?.idActivity}
        onActivityUpdated={fetchActivities}
      />

      {/* ConfirmDialog Reutilizable */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        itemName={confirmDialog.itemName}
        itemDescription={confirmDialog.itemDescription}
        isLoading={deletingActivity === confirmDialog.itemId}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default AdminDashboard;