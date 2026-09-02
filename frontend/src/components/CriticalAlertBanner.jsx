import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle,
  Eye,
} from "lucide-react";
import { differenceInDays } from "date-fns";
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
      const allTasks = await taskService.getTasksList();
      if (!Array.isArray(allTasks)) return;

      const acknowledgedIds = getAcknowledgedIds();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const critical = allTasks.filter((task) => {
        if (task.status === "COMPLETED") return false;
        if (!task.priority || task.priority.toUpperCase() !== "HIGH") return false;
        if (acknowledgedIds.includes(task.idTask)) return false;

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
    const interval = setInterval(fetchCriticalTasks, 60000);
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
      <div className="w-full bg-[#EF4444]/10 border-b border-[#EF4444]/20 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          {/* Flame icon + #EF4444 text only, per specification */}
          <div className="flex items-center gap-1.5 text-[#EF4444] shrink-0 font-medium text-[12px] lowercase">
            <Flame size={16} strokeWidth={1.5} className="text-[#EF4444]" />
            <span>high priority</span>
          </div>

          <span className="h-3.5 w-[1px] bg-[#EF4444]/30 hidden sm:block"></span>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-medium text-[#EF4444] lowercase shrink-0">
              {isOverdue
                ? `overdue (${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? "day" : "days"} late)`
                : isDueToday
                ? "due today"
                : `due in ${daysDiff} ${daysDiff === 1 ? "day" : "days"}`}
            </span>
            <p className="text-[13px] font-medium text-[#1C1C1E] truncate">
              {currentTask.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {criticalTasks.length > 1 && (
            <div className="flex items-center gap-1 mr-1 text-[#6E6E73] text-[11px]">
              <span>{currentIndex + 1} of {criticalTasks.length}</span>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : criticalTasks.length - 1))
                }
                className="p-1 hover:bg-[#EF4444]/10 rounded text-[#1C1C1E]"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev < criticalTasks.length - 1 ? prev + 1 : 0))
                }
                className="p-1 hover:bg-[#EF4444]/10 rounded text-[#1C1C1E]"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedTaskId(currentTask.idTask);
              setIsDetailOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white text-[#1C1C1E] hover:bg-[#FAFAFA] border border-[#E5E5EA] px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors"
          >
            <Eye size={13} strokeWidth={1.5} />
            <span>View</span>
          </button>

          <button
            onClick={() => handleAcknowledge(currentTask.idTask)}
            className="flex items-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-sm"
          >
            <CheckCircle size={13} strokeWidth={1.5} />
            <span>Dismiss</span>
          </button>
        </div>
      </div>

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

