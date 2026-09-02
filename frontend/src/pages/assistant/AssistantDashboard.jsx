import { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Loader2,
  ArrowRight,
  Flame,
} from "lucide-react";
import { getUsernameFromToken } from "../../utils/authUtils";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import { toast } from "sonner";
import TaskDetailView from "../admin/components/task/TaskDetailView";

const AssistantDashboard = () => {
  const [baseDate, setBaseDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const dateInputRef = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const COLUMNS = [
    {
      id: "PENDING",
      label: "pending",
      icon: <Clock size={14} strokeWidth={1.5} />,
      color: "text-[#EF4444]",
    },
    {
      id: "PROGRESS",
      label: "in progress",
      icon: <PlayCircle size={14} strokeWidth={1.5} />,
      color: "text-[#F59E0B]",
    },
    {
      id: "BLOCK",
      label: "blocked",
      icon: <AlertCircle size={14} strokeWidth={1.5} />,
      color: "text-[#6B7280]",
    },
    {
      id: "COMPLETED",
      label: "completed",
      icon: <CheckCircle2 size={14} strokeWidth={1.5} />,
      color: "text-[#10B981]",
    },
  ];

  const weekRange = useMemo(
    () => ({
      start: startOfWeek(baseDate, { weekStartsOn: 1 }),
      end: endOfWeek(baseDate, { weekStartsOn: 1 }),
    }),
    [baseDate],
  );

  useEffect(() => {
    fetchInitialData();
  }, [weekRange]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const username = getUsernameFromToken();
      const userDataResponse = await userService.getByUsername(username);
      setUserData(userDataResponse);

      const response = await taskService.getTasksList({
        idUserAssigned: userDataResponse.id,
        start: format(weekRange.start, "yyyy-MM-dd"),
        end: format(weekRange.end, "yyyy-MM-dd"),
      });
      setTasks(response || []);
    } catch (err) {
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.click();
      }
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("taskId", task.idTask);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-40");
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("opacity-40");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("bg-[#FAFAFA]", "border-[#171717]/30");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("bg-[#FAFAFA]", "border-[#171717]/30");
  };

  const handleDrop = async (e, nextStatus) => {
    e.preventDefault();
    handleDragLeave(e);

    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.idTask.toString() === taskId);

    if (!task || task.status === nextStatus) return;

    try {
      await taskService.updateStatus(taskId, nextStatus);
      toast.success(`Task moved to ${nextStatus.toLowerCase()}`);
      fetchInitialData();
    } catch (err) {
      toast.error("Could not update task status");
    }
  };

  const handleNextStatus = async (e, task) => {
    e.stopPropagation();
    const statusOrder = ["PENDING", "PROGRESS", "COMPLETED"];
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;

    const nextStatus = statusOrder[currentIndex + 1];
    try {
      await taskService.updateStatus(task.idTask, nextStatus);
      toast.success("Task status updated");
      fetchInitialData();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA] shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-semibold text-[14px]"
            style={{ backgroundColor: userData?.colorCode || "#171717" }}
          >
            {userData?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#1C1C1E]">
              My workspace
            </h1>
            <p className="text-[12px] text-[#6E6E73] mt-0.5">
              Assigned to {userData?.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
          <button
            onClick={() => setBaseDate(subWeeks(baseDate, 1))}
            className="p-1.5 hover:bg-white text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          <div
            onClick={handleCalendarClick}
            className="px-3 text-center min-w-[170px] cursor-pointer hover:bg-white py-1 rounded-[6px] transition-colors relative"
          >
            <input
              ref={dateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 pointer-events-none"
              value={format(baseDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setBaseDate(new Date(e.target.value + "T00:00:00"));
                }
              }}
            />
            <p className="text-[10px] font-medium lowercase text-[#6E6E73]">
              week range
            </p>
            <p className="text-[12.5px] font-medium text-[#1C1C1E]">
              {format(weekRange.start, "MMM dd")} — {format(weekRange.end, "MMM dd, yyyy")}
            </p>
          </div>

          <button
            onClick={() => setBaseDate(addWeeks(baseDate, 1))}
            className="p-1.5 hover:bg-white text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] transition-colors cursor-pointer"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden pb-2">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col bg-[#FAFAFA] rounded-[12px] border border-[#E5E5EA] transition-colors overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3.5 bg-white border-b border-[#E5E5EA] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className={col.color}>{col.icon}</span>
                  <span className="text-[13px] font-semibold text-[#1C1C1E] lowercase">
                    {col.label}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#AEAEB2] px-1.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-32 text-[#AEAEB2]">
                    <Loader2 className="animate-spin mb-1 text-[#171717]" size={20} strokeWidth={1.5} />
                    <p className="text-[11px]">Loading tasks...</p>
                  </div>
                ) : colTasks.length > 0 ? (
                  colTasks.map((task) => {
                    const isHighPriority = task.priority === "HIGH";

                    return (
                      <div
                        key={task.idTask}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(task)}
                        className="bg-white p-3.5 rounded-[10px] border border-[#E5E5EA] hover:border-[#171717]/30 transition-colors cursor-grab active:cursor-grabbing space-y-2 shadow-none"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[13px] font-medium text-[#1C1C1E] leading-snug">
                            {task.title}
                          </h4>

                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={(e) => handleNextStatus(e, task)}
                              className="p-1 text-[#AEAEB2] hover:text-[#1C1C1E] rounded hover:bg-[#FAFAFA] transition-colors shrink-0 cursor-pointer"
                              title="Move to next stage"
                            >
                              <ArrowRight size={13} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[12px] text-[#6E6E73] line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-[11px]">
                          {isHighPriority ? (
                            <span className="flex items-center gap-1 text-[#EF4444] font-medium lowercase">
                              <Flame size={13} strokeWidth={1.5} className="text-[#EF4444]" />
                              <span>high priority</span>
                            </span>
                          ) : (
                            <span className="text-[#AEAEB2] lowercase">
                              {task.priority?.toLowerCase() || "standard"}
                            </span>
                          )}

                          {task.companyName && (
                            <span className="text-[#6E6E73] truncate max-w-[110px]">
                              {task.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-24 flex items-center justify-center text-center text-[#AEAEB2]">
                    <p className="text-[11.5px]">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskDetailView
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        taskId={selectedTask?.idTask}
        onTaskUpdated={fetchInitialData}
      />
    </div>
  );
};

export default AssistantDashboard;

