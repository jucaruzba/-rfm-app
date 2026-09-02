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
  Loader2,
} from "lucide-react";
import { activityService } from "../../services/activityService";
import { toast } from "sonner";
import ConfirmDialog from "../ui/ConfirmDialog";

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
      setActivities(data || []);
    } catch (err) {
      toast.error("Error loading activities");
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
      message: `Are you sure you want to delete "${activity.title}"?`,
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
    const toastId = toast.loading("Deleting activity and files...");
    
    try {
      await activityService.deleteActivity(id);
      toast.success("Activity deleted successfully", { id: toastId });
      setActivities(prev => prev.filter(act => act.idActivity !== id));
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Delete activity error", err);
      toast.error("Failed to delete activity", { id: toastId });
    } finally {
      setDeletingActivity(null);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#E5E5EA] rounded-[12px] shrink-0">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
            Control hub
          </h1>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            Operational activity and daily timeline
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA] w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setBaseDate(subDays(baseDate, 1))}
            className="p-1.5 hover:bg-white rounded-[8px] transition-colors text-[#6E6E73] hover:text-[#1C1C1E] cursor-pointer"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          <div
            onClick={handleCalendarClick}
            className="relative px-4 text-center min-w-[140px] md:min-w-[170px] cursor-pointer hover:bg-white transition-colors rounded-[8px] py-1"
          >
            <input
              ref={dateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 pointer-events-none"
              value={format(baseDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  const selected = new Date(e.target.value + "T00:00:00");
                  setBaseDate(selected);
                }
              }}
            />
            <p className="text-[10px] font-medium lowercase text-[#6E6E73]">
              timeline
            </p>
            <p className="text-[13px] font-medium text-[#1C1C1E]">
              {format(baseDate, "MMM dd, yyyy")}
            </p>
          </div>

          <button
            onClick={() => setBaseDate(addDays(baseDate, 1))}
            className="p-1.5 hover:bg-white rounded-[8px] transition-colors text-[#6E6E73] hover:text-[#1C1C1E] cursor-pointer"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 3 Day Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-250px)] pb-4">
        {daysToShow.map((day, idx) => {
          const isFocus = idx === 1;
          const dayActivities = activities
            .filter((act) => isSameDay(new Date(act.eventDate), day))
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

          return (
            <div
              key={day.toString()}
              className={`flex flex-col bg-[#FAFAFA] rounded-[14px] border transition-colors overflow-hidden min-h-[400px] lg:min-h-0 ${
                isFocus
                  ? "border-[#171717]/40 shadow-xs"
                  : "border-[#E5E5EA]"
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-4 flex justify-between items-center shrink-0 border-b border-[#E5E5EA] ${
                  isFocus ? "bg-[#171717] text-white" : "bg-white text-[#1C1C1E]"
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-medium lowercase ${
                      isFocus ? "text-white/70" : "text-[#6E6E73]"
                    }`}
                  >
                    {format(day, "EEEE")}
                  </p>
                  <h2 className="text-[15px] font-semibold mt-0.5">
                    {format(day, "dd MMM yyyy")}
                  </h2>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetDate(format(day, "yyyy-MM-dd"));
                    setIsCreateOpen(true);
                  }}
                  className={`p-1.5 rounded-[8px] transition-colors cursor-pointer ${
                    isFocus
                      ? "bg-white text-[#171717] hover:bg-[#FAFAFA]"
                      : "bg-white text-[#1C1C1E] hover:bg-[#FAFAFA] border border-[#E5E5EA]"
                  }`}
                  title="New activity"
                >
                  <Plus size={15} strokeWidth={1.5} />
                </button>
              </div>

              {/* Activities List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {dayActivities.length > 0 ? (
                  dayActivities.map((act) => (
                    <div
                      key={act.idActivity}
                      className="group relative p-3.5 bg-white rounded-[10px] border border-[#E5E5EA] hover:border-[#171717]/30 transition-colors space-y-2 shadow-none"
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E]">
                          {format(new Date(act.eventDate), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openDetail(act)}
                            className="p-1 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye size={15} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteActivityClick(act)}
                            disabled={deletingActivity === act.idActivity}
                            className="p-1 text-[#AEAEB2] hover:text-[#EF4444] transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete activity"
                          >
                            {deletingActivity === act.idActivity ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-[13.5px] font-medium text-[#1C1C1E] leading-snug">
                        {act.title}
                      </h3>
                      {act.description && (
                        <p className="text-[12px] text-[#6E6E73] line-clamp-2">
                          {act.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-[#AEAEB2]">
                    <Clock size={24} strokeWidth={1.5} className="opacity-40" />
                    <p className="text-[11px] mt-1.5 lowercase">
                      no activities
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
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

      {/* ConfirmDialog */}
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