import { useState, useEffect, useMemo, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
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
  MousePointer2,
} from "lucide-react";
import { getUsernameFromToken } from "../../utils/authUtils";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import api from "../../services/api";
import { toast } from "sonner";

// Componentes
// Reutilizamos el detalle de tarea del admin para consistencia con el nuevo service
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
      label: "Pending",
      icon: <Clock size={16} />,
      color: "border-gray-200 bg-gray-50 text-gray-400",
    },
    {
      id: "PROGRESS",
      label: "In Progress",
      icon: <PlayCircle size={16} />,
      color: "border-blue-200 bg-blue-50 text-blue-600",
    },
    {
      id: "BLOCK",
      label: "Blocked",
      icon: <AlertCircle size={16} />,
      color: "border-red-200 bg-red-50 text-red-600",
    },
    {
      id: "COMPLETED",
      label: "Completed",
      icon: <CheckCircle2 size={16} />,
      color: "border-green-200 bg-green-50 text-green-600",
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
        // Enviamos formato ISO para que formatDateToBackend en el service pueda procesarlo
        start: format(weekRange.start, "yyyy-MM-dd"),
        end: format(weekRange.end, "yyyy-MM-dd"),
      });
      setTasks(response || []); // Extraemos el contenido del objeto Page
    } catch (err) {
      toast.error("Error syncing dashboard");
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

  // --- LÓGICA DE DRAG & DROP ---

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("taskId", task.idTask);
    e.dataTransfer.effectAllowed = "move";
    // Efecto visual de "levantado"
    e.currentTarget.classList.add("opacity-40", "scale-95");
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("opacity-40", "scale-95");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Añadir clase visual a la columna al pasar por encima
    e.currentTarget.classList.add("bg-blue-50/50", "border-blue-200");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("bg-blue-50/50", "border-blue-200");
  };

  const handleDrop = async (e, nextStatus) => {
    e.preventDefault();
    handleDragLeave(e);

    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.idTask.toString() === taskId);

    if (!task || task.status === nextStatus) return;

    try {
      // Endpoint específico para actualización de estatus (PATCH)
      await taskService.updateStatus(taskId, nextStatus);

      toast.success(`Task moved to ${nextStatus}`);
      fetchInitialData();
    } catch (err) {
      toast.error("Deployment failed: Could not update status");
    }
  };

  // --- WORKFLOW RÁPIDO ---
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
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* HEADER Nav */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg animate-in zoom-in duration-700"
            style={{ backgroundColor: userData?.colorCode || "#001F3F" }}
          >
            {userData?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001F3F] uppercase italic tracking-tighter leading-none">
              Mission <span className="text-blue-600">Control</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Active Operator: {userData?.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => setBaseDate(subWeeks(baseDate, 1))}
            className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            onClick={handleCalendarClick}
            className="px-4 text-center min-w-[200px] cursor-pointer hover:bg-white rounded-xl transition-all group relative"
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
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:text-blue-700 transition-colors">
              Temporal Window
            </p>
            <p className="text-xs font-black text-[#001F3F] uppercase italic tracking-tight">
              {format(weekRange.start, "MMM dd")} —{" "}
              {format(weekRange.end, "MMM dd, yyyy")}
            </p>
          </div>
          <button
            onClick={() => setBaseDate(addWeeks(baseDate, 1))}
            className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col bg-gray-100/30 rounded-[2.5rem] border-2 border-transparent transition-all duration-300 overflow-hidden shadow-inner relative"
          >
            {/* Column Header */}
            <div
              className={`p-5 border-b-2 flex items-center justify-between sticky top-0 bg-inherit z-10 ${col.color}`}
            >
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="text-xs font-black uppercase tracking-widest">
                  {col.label}
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/50 rounded-full italic tracking-tighter">
                {tasks.filter((t) => t.status === col.id).length} UNITS
              </span>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-20">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest italic">
                    Syncing Cloud...
                  </p>
                </div>
              ) : (
                tasks
                  .filter((t) => t.status === col.id)
                  .map((task) => (
                    <div
                      key={task.idTask}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 hover:border-blue-400 hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing animate-in slide-in-from-bottom-4 duration-300"
                    >
                      <div className="flex justify-between items-start ">
                        {task.status !== "COMPLETED" && (
                          <button
                            onClick={(e) => handleNextStatus(e, task)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-[#001F3F] uppercase leading-tight mb-2 italic tracking-tighter">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-20 h-5 rounded flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ backgroundColor: userData?.colorCode}}
                          >
                            {userData?.username?.toUpperCase()}
                          </div>
                          <span className="text-[9px] font-black text-gray-400 uppercase italic">
                            {userData?.username_?.toUpperCase()}
                          </span>
                        </div>
                        <MousePointer2
                          size={12}
                          className="text-gray-100 group-hover:text-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
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
