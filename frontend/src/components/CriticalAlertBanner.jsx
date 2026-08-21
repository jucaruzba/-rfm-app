import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Building2,
  User,
  ShieldAlert,
} from "lucide-react";
import { format, parseISO, differenceInDays, isPast, isToday } from "date-fns";
import { taskService } from "../services/taskService";
import TaskDetailView from "../pages/admin/components/task/TaskDetailView";

const ACKNOWLEDGED_STORAGE_KEY = "rfm_acknowledged_critical_tasks";

const CriticalAlertBanner = () => {
  const [criticalTasks, setCriticalTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getAcknowledgedIds = () => {
    try {
      const stored = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const fetchCriticalTasks = useCallback(async () => {
    try {
      // Obtenemos las tareas activas sin paginación
      const allTasks = await taskService.getTasksList();
      if (!Array.isArray(allTasks)) return;

      const acknowledgedIds = getAcknowledgedIds();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const critical = allTasks.filter((task) => {
        // Solo tareas de ALTA PRIORIDAD no completadas y no reconocidas
        if (task.status === "COMPLETED") return false;
        if (!task.priority || task.priority.toUpperCase() !== "HIGH") return false;
        if (acknowledgedIds.includes(task.idTask)) return false;

        // Verificar si está vencida o vence pronto (dentro de 3 días)
        const dateVal = task.endDate || task.startDate;
        if (!dateVal) return false;

        let taskDueDate;
        if (Array.isArray(dateVal)) {
          const [y, m, d] = dateVal;
          taskDueDate = new Date(y, m - 1, d);
        } else if (typeof dateVal === "string") {
          taskDueDate = new Date(dateVal.includes("T") ? dateVal.split("T")[0] : dateVal);
        } else {
          return false;
        }
        taskDueDate.setHours(0, 0, 0, 0);

        const diff = differenceInDays(taskDueDate, today);
        // Mostrar si está vencida (diff < 0) o si vence en 3 días o menos (diff <= 3)
        return diff <= 3;
      });

      setCriticalTasks(critical);
      if (currentIndex >= critical.length && critical.length > 0) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Error checking critical tasks for banner:", err);
    }
  }, [currentIndex]);

  useEffect(() => {
    fetchCriticalTasks();
    const interval = setInterval(fetchCriticalTasks, 60000); // Re-chequear cada minuto
    return () => clearInterval(interval);
  }, [fetchCriticalTasks]);

  const handleAcknowledge = (taskId) => {
    const acknowledgedIds = getAcknowledgedIds();
    if (!acknowledgedIds.includes(taskId)) {
      acknowledgedIds.push(taskId);
      localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(acknowledgedIds));
    }
    const remaining = criticalTasks.filter((t) => t.idTask !== taskId);
    setCriticalTasks(remaining);
    if (currentIndex >= remaining.length && remaining.length > 0) {
      setCurrentIndex(remaining.length - 1);
    }
  };

  if (criticalTasks.length === 0) return null;

  const currentTask = criticalTasks[currentIndex] || criticalTasks[0];
  if (!currentTask) return null;

  const dateVal = currentTask.endDate || currentTask.startDate;
  let taskDueDate = null;
  if (Array.isArray(dateVal)) {
    const [y, m, d] = dateVal;
    taskDueDate = new Date(y, m - 1, d);
  } else if (typeof dateVal === "string") {
    taskDueDate = new Date(dateVal.includes("T") ? dateVal.split("T")[0] : dateVal);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = taskDueDate ? differenceInDays(taskDueDate, today) : 0;
  const isOverdue = daysDiff < 0;
  const isDueToday = daysDiff === 0;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-900/20 px-6 py-3.5 border-b-2 border-red-500 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shrink-0 z-30">
        {/* LADO IZQUIERDO: ÍCONO Y MENSAJE DE URGENCIA */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-pulse border border-white/30">
            <Flame size={22} className="text-yellow-300 fill-yellow-300" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shrink-0 shadow-xs">
                CRITICAL DIRECTIVE
              </span>

              {isOverdue ? (
                <span className="bg-black/40 text-red-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-400/40 shrink-0">
                  OVERDUE ({Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? "day" : "days"} late)
                </span>
              ) : isDueToday ? (
                <span className="bg-yellow-400 text-gray-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0">
                  DUE TODAY
                </span>
              ) : (
                <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0">
                  DUE IN {daysDiff} {daysDiff === 1 ? "DAY" : "DAYS"}
                </span>
              )}

              {criticalTasks.length > 1 && (
                <span className="text-white/70 text-[9px] font-bold">
                  ({currentIndex + 1} of {criticalTasks.length} critical)
                </span>
              )}
            </div>

            <p className="text-sm font-black tracking-tight truncate text-white mt-0.5">
              {currentTask.title}
              {currentTask.nameCompany ? (
                <span className="text-white/80 font-medium text-xs ml-2">
                  — {currentTask.nameCompany}
                </span>
              ) : currentTask.externalReferenceName ? (
                <span className="text-white/80 font-medium text-xs ml-2">
                  — Client: {currentTask.externalReferenceName}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* LADO DERECHO: NAVEGADOR ENTRE TAREAS, BOTÓN VER Y BOTÓN ACKNOWLEDGE */}
        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          {criticalTasks.length > 1 && (
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/10 mr-1">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : criticalTasks.length - 1))
                }
                className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="Previous critical task"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev < criticalTasks.length - 1 ? prev + 1 : 0))
                }
                className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors"
                title="Next critical task"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedTaskId(currentTask.idTask);
              setIsDetailOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/20 backdrop-blur-sm active:scale-95"
          >
            <Eye size={13} /> View
          </button>

          <button
            onClick={() => handleAcknowledge(currentTask.idTask)}
            className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-black/10 active:scale-95 border border-white/80 cursor-pointer"
            title="Acknowledge and dismiss critical alert banner"
          >
            <CheckCircle size={14} className="text-red-600" /> Acknowledge
          </button>
        </div>
      </div>

      {/* MODAL DE DETALLES SI SE HACE CLIC EN VIEW */}
      {selectedTaskId && (
        <TaskDetailView
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTaskId(null);
            fetchCriticalTasks();
          }}
          taskId={selectedTaskId}
          onTaskUpdated={() => fetchCriticalTasks()}
        />
      )}
    </>
  );
};

export default CriticalAlertBanner;
