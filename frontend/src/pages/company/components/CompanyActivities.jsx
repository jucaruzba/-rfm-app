import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { addDays, subDays, format, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Eye,
  Trash2,
  Zap,
} from "lucide-react";
import { activityService } from "../../../services/activityService";
import { toast } from "sonner";
import CreateActivityModal from "../../admin/components/activity/CreateActivityModal";
import ActivityDetailView from "../../admin/components/activity/ActivityDetailView";

const CompanyActivities = () => {
  const { companyId } = useParams();
  const [baseDate, setBaseDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const dateInputRef = useRef(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [targetDate, setTargetDate] = useState("");

  const daysToShow = useMemo(
    () => [subDays(baseDate, 1), baseDate, addDays(baseDate, 1)],
    [baseDate],
  );

  const fetchActivities = async () => {
    try {
      const data = await activityService.getActivities({
        idCompany: companyId,
        start: format(daysToShow[0], "yyyy-MM-dd'T'00:00:00"),
        end: format(daysToShow[2], "yyyy-MM-dd'T'23:59:59"),
      });
      setActivities(data);
    } catch (err) {
      toast.error("Error sincronizando actividades");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [baseDate, companyId]);

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

  const handleDeleteActivity = async (id, title) => {
    const confirmed = window.confirm(
      `⚠️ Purgar actividad: "${title.toUpperCase()}"?\n\nEsta acción eliminará todos los nodos y recursos asociados.`,
    );

    if (confirmed) {
      try {
        await activityService.deleteActivity(id);
        toast.success("Actividad purgada del sistema");
        fetchActivities();
      } catch (err) {
        toast.error("Error en purga de cascada");
      }
    }
  };

  const getActivityCount = () => {
    return activities.length;
  };

  const getTodayActivities = () => {
    return activities.filter((act) => isSameDay(new Date(act.eventDate), baseDate));
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* HEADER EMPRESARIAL */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#001F3F] to-[#003d7a] rounded-[2.5rem] p-8 shadow-2xl border border-white/10">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                <Zap size={24} className="text-blue-300" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">
                  Activity Chronicle
                </h1>
                <p className="text-[11px] text-blue-300 font-bold uppercase tracking-[0.2em] mt-1">
                  Entity-Specific Operations Log
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap pt-2">
              <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-4 py-2 rounded-xl text-[12px] font-bold uppercase">
                <Clock size={14} />
                {getActivityCount()} Events Recorded
              </span>
              <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 px-4 py-2 rounded-xl text-[12px] font-bold uppercase">
                {getTodayActivities().length} Today
              </span>
            </div>
          </div>

          {/* DATE NAVIGATOR */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
            <button
              onClick={() => setBaseDate(subDays(baseDate, 1))}
              className="p-3 hover:bg-white/10 rounded-xl transition-all text-blue-300 hover:text-white"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>

            <div
              onClick={handleCalendarClick}
              className="relative px-4 text-center min-w-[180px] cursor-pointer hover:bg-white/5 transition-all group rounded-xl py-2"
            >
              <input
                ref={dateInputRef}
                type="date"
                className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                value={format(baseDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (e.target.value) {
                    setBaseDate(new Date(e.target.value + "T00:00:00"));
                  }
                }}
              />
              <div className="pointer-events-none">
                <p className="text-[11px] text-blue-300 uppercase tracking-widest font-bold">
                  Selected Date
                </p>
                <h2 className="text-lg font-black text-white uppercase italic">
                  {format(baseDate, "MMM dd, yyyy")}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setBaseDate(addDays(baseDate, 1))}
              className="p-3 hover:bg-white/10 rounded-xl transition-all text-blue-300 hover:text-white"
            >
              <ChevronRight size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVIDADES EN GRID DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-320px)] overflow-visible lg:overflow-hidden pb-4">
        {daysToShow.map((day, idx) => {
          const isFocus = idx === 1;
          const dayActivities = activities
            .filter((act) => isSameDay(new Date(act.eventDate), day))
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

          return (
            <div
              key={day.toString()}
              className={`flex flex-col bg-white rounded-[2rem] border-2 transition-all duration-500 overflow-hidden min-h-[400px] lg:min-h-0 ${
                isFocus
                  ? "border-blue-500 shadow-2xl shadow-blue-500/20 lg:scale-[1.01] z-10"
                  : "border-gray-100 lg:opacity-80"
              }`}
            >
              {/* HEADER DE COLUMNA */}
              <div
                className={`p-6 flex justify-between items-center shrink-0 ${
                  isFocus ? "bg-gradient-to-r from-[#001F3F] to-[#003d7a] text-white" : "bg-gray-50"
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-black uppercase tracking-[0.3em] ${
                      isFocus ? "text-blue-300" : "text-gray-400"
                    }`}
                  >
                    {format(day, "EEEE")}
                  </p>
                  <h2 className="text-lg font-black italic tracking-tighter uppercase leading-none mt-1">
                    {format(day, "dd MMM")}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setTargetDate(format(day, "yyyy-MM-dd"));
                    setIsCreateOpen(true);
                  }}
                  className={`p-2.5 rounded-xl transition-all shadow-md ${
                    isFocus
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              {/* LISTA DE ACTIVIDADES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll bg-[#FAFBFC]">
                {dayActivities.length > 0 ? (
                  dayActivities.map((act) => (
                    <div
                      key={act.idActivity}
                      className="group relative p-4 bg-white rounded-[1.5rem] border-2 border-gray-100 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-default hover:scale-[1.02] origin-center"
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <span className="flex-shrink-0 px-3 py-1 rounded-lg text-[12px] font-black bg-[#001F3F] text-white">
                          {format(new Date(act.eventDate), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              handleDeleteActivity(act.idActivity, act.title)
                            }
                            className="p-1.5 text-red-300 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openDetail(act)}
                            className="p-1.5 text-blue-400 hover:text-blue-600 transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-[15px] font-black uppercase tracking-tight text-[#001F3F] mb-1.5 italic line-clamp-1">
                        {act.title}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500 line-clamp-2 leading-relaxed italic">
                        {act.description || "Sin descripción operativa."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-8 text-center">
                    <Clock size={32} strokeWidth={1} />
                    <p className="text-[8px] font-black uppercase tracking-widest mt-2 italic">
                      No Events
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALES */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        selectedDate={targetDate}
        idCompany={companyId}
        onActivityCreated={fetchActivities}
      />

      <ActivityDetailView
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activityId={selectedActivity?.idActivity}
        onActivityUpdated={fetchActivities}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
};

export default CompanyActivities;
