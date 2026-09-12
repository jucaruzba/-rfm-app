import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  CalendarDays,
  Flame,
  Trash2,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { taskService } from "../../../../services/taskService";
import { companyService } from "../../../../services/companyService";
import { userService } from "../../../../services/userService";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";
import TaskDetailView from "./TaskDetailView";
import MonthYearPicker from "../../../../components/MonthYearPicker";
import TaskDeleteDialog from "../../../../components/TaskDeleteDialog";
import { formatUsDate, formatDateToBackend } from "../../../../utils/dateUtils";
import { getCompanyColor, hexToRgba } from "../../../../utils/companyColors";

const TasksPage = () => {
  const { companyId } = useParams();
  const { user: authUser } = useAuth();
  const isAdmin =
    authUser?.role?.toLowerCase() === "admin" || authUser?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  // --- MODO DE VISTA: LISTA O CALENDARIO ---
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // --- FILTROS PARA EL BACKEND ---
  const [statusTab, setStatusTab] = useState("PENDING");
  const filterUser = "";
  const [filterCompany, setFilterCompany] = useState(companyId || "");
  const startDate = "";
  const endDate = "";
  const [searchQuery, setSearchQuery] = useState("");

  // --- ESTADOS DE PAGINACIÓN & SCROLL INFINITO ---
  const pageSize = 15;
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    idCompany: companyId || "",
    externalReferenceName: "",
    idUserAssigned: "",
    status: "PENDING",
    repeatType: "NONE",
    repeatEndDate: "",
    priority: "NORMAL",
  });

  // --- ESTADO DEL TASK DETAIL VIEW ---
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // --- ESTADOS PARA SALTO DE MES Y ELIMINACIÓN ADMIN ---
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [companiesData, usersData] = await Promise.all([
          companyService.getCompanies(),
          userService.findAll(),
        ]);
        setCompanies(companiesData || []);
        setUsers(usersData || []);
      } catch (err) {
        console.error("Error loading catalogs", err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (companyId) {
      Promise.resolve().then(() => {
        setFilterCompany(companyId);
        setFormData((prev) => ({ ...prev, idCompany: companyId }));
      });
    }
  }, [companyId]);

  // Consulta paginada para la vista Lista (recarga o reinicio con filtros)
  const fetchTasks = useCallback(async (reset = true) => {
    if (reset) {
      pageRef.current = 0;
    }
    isFetchingRef.current = true;
    await Promise.resolve();
    if (reset) setLoading(true);
    try {
      const response = await taskService.getTasks({
        idCompany: filterCompany || null,
        status: statusTab,
        idUserAssigned: filterUser ? Number(filterUser) : null,
        title: searchQuery || null,
        start: startDate || null,
        end: endDate || null,
        page: 0,
        size: pageSize,
        sort: ["startDate,desc", "idTask,desc"],
      });

      const items = response.content || [];
      setTasks(items);
      pageRef.current = 0;
      setTotalElements(response.totalElements || 0);
      const moreAvailable = (response.totalPages || 0) > 1;
      setHasMore(moreAvailable);
      hasMoreRef.current = moreAvailable;
    } catch {
      toast.error("Error syncing task flow");
    } finally {
      if (reset) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    filterCompany,
    statusTab,
    filterUser,
    searchQuery,
    startDate,
    endDate,
    pageSize,
  ]);

  // Carga de página siguiente para scroll infinito
  const loadNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;

    const nextPage = pageRef.current + 1;
    isFetchingRef.current = true;
    setLoadingMore(true);
    try {
      const response = await taskService.getTasks({
        idCompany: filterCompany || null,
        status: statusTab,
        idUserAssigned: filterUser ? Number(filterUser) : null,
        title: searchQuery || null,
        start: startDate || null,
        end: endDate || null,
        page: nextPage,
        size: pageSize,
        sort: ["startDate,desc", "idTask,desc"],
      });

      const nextItems = response.content || [];
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.idTask));
        const filtered = nextItems.filter((t) => !existingIds.has(t.idTask));
        return [...prev, ...filtered];
      });
      pageRef.current = nextPage;
      setTotalElements(response.totalElements || 0);
      const moreAvailable = nextPage + 1 < (response.totalPages || 0);
      setHasMore(moreAvailable);
      hasMoreRef.current = moreAvailable;
    } catch (err) {
      console.error("Error loading next page", err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [
    filterCompany,
    statusTab,
    filterUser,
    searchQuery,
    startDate,
    endDate,
    pageSize,
  ]);

  // IntersectionObserver para detectar el final de la lista y activar scroll infinito
  useEffect(() => {
    if (viewMode !== "list") return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
          loadNextPage();
        }
      },
      { root: null, rootMargin: "250px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [viewMode, loadNextPage]);

  // Consulta completa para la vista Calendario (mes completo sin cortes de paginación)
  // Cambiado a inicio de semana en Domingo (weekStartsOn: 0)
  const fetchCalendarTasks = useCallback(async () => {
    await Promise.resolve();
    setCalendarLoading(true);
    try {
      const startMonthDate = format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }), "yyyy-MM-dd");
      const endMonthDate = format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }), "yyyy-MM-dd");

      const response = await taskService.getTasksList({
        idCompany: filterCompany || null,
        status: statusTab,
        idUserAssigned: filterUser ? Number(filterUser) : null,
        title: searchQuery || null,
        start: startMonthDate,
        end: endMonthDate,
      });

      setCalendarTasks(response || []);
    } catch (err) {
      console.error("Error loading calendar tasks", err);
    } finally {
      setCalendarLoading(false);
    }
  }, [currentMonth, filterCompany, statusTab, filterUser, searchQuery]);

  useEffect(() => {
    if (viewMode === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTasks(true);
    } else {
      fetchCalendarTasks();
    }
  }, [viewMode, fetchTasks, fetchCalendarTasks]);

  const handleStatusChange = async (idTask, newStatus) => {
    try {
      await taskService.updateStatus(idTask, newStatus);
      toast.success("Operational status updated");
      if (viewMode === "list") {
        setTasks((prev) => {
          if (statusTab !== "ALL" && newStatus !== statusTab) {
            return prev.filter((t) => t.idTask !== idTask);
          }
          return prev.map((t) =>
            t.idTask === idTask ? { ...t, status: newStatus } : t
          );
        });
      } else {
        fetchCalendarTasks();
      }
    } catch {
      toast.error("Could not process status change");
    }
  };

  const handleOpenTaskDetail = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDetailViewOpen(true);
  };

  const handleCloseTaskDetail = () => {
    setIsDetailViewOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    if (viewMode === "list") fetchTasks();
    else fetchCalendarTasks();
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (task, deleteFuture) => {
    if (!task) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(task.idTask, deleteFuture);
      toast.success("Task deleted successfully");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      if (selectedTaskId === task.idTask) {
        setIsDetailViewOpen(false);
        setSelectedTaskId(null);
      }
      if (viewMode === "list") {
        setTasks((prev) => prev.filter((t) => t.idTask !== task.idTask));
        setTotalElements((prev) => Math.max(0, prev - 1));
      } else {
        fetchCalendarTasks();
      }
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.startDate)
      return toast.error("Execution date is required");
    if (!formData.idUserAssigned)
      return toast.error("A technical operator must be assigned");

    const parsedUserId = Number(formData.idUserAssigned);
    const dateFormatted = formatDateToBackend(formData.startDate);

    const taskRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      startDate: dateFormatted,
      endDate: dateFormatted,
      idCompany: formData.idCompany ? Number(formData.idCompany) : null,
      externalReferenceName: formData.externalReferenceName.trim() || null,
      idUserAssigned: parsedUserId,
      status: formData.status,
      repeatType: formData.repeatType,
      repeatEndDate: null,
      priority: formData.priority || "NORMAL",
    };

    setSubmitting(true);
    try {
      await taskService.createTask(taskRequest);
      toast.success("Task deployed successfully");
      setIsModalOpen(false);

      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        idCompany: companyId || "",
        externalReferenceName: "",
        idUserAssigned: "",
        status: "PENDING",
        repeatType: "NONE",
        repeatEndDate: "",
        priority: "NORMAL",
      });
      if (viewMode === "list") fetchTasks();
      else fetchCalendarTasks();
    } catch {
      toast.error("Error registering the task in the backend");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateCellClick = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setFormData((prev) => ({
      ...prev,
      startDate: formattedDate,
      endDate: formattedDate,
    }));
    setIsModalOpen(true);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
          pillBg: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
          dotBg: "bg-[#10B981]",
          icon: <CheckCircle2 size={13} strokeWidth={1.5} />,
        };
      case "IN_PROGRESS":
      case "PROGRESS":
        return {
          bg: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
          pillBg: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
          dotBg: "bg-[#F59E0B]",
          icon: <Clock size={13} strokeWidth={1.5} />,
        };
      case "BLOCK":
        return {
          bg: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20",
          pillBg: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20",
          dotBg: "bg-[#6B7280]",
          icon: <AlertCircle size={13} strokeWidth={1.5} />,
        };
      default:
        return {
          bg: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
          pillBg: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
          dotBg: "bg-[#EF4444]",
          icon: <AlertCircle size={13} strokeWidth={1.5} />,
        };
    }
  };

  const displayDate = (date) => {
    return formatUsDate(date);
  };

  // Generación de días del mes para el calendario (inicia en Domingo)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Agrupar tareas del calendario por fecha (YYYY-MM-DD)
  const calendarTasksByDate = useMemo(() => {
    const map = {};
    calendarTasks.forEach((t) => {
      let dateKey = null;
      if (Array.isArray(t.startDate)) {
        const [y, m, d] = t.startDate;
        dateKey = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      } else if (typeof t.startDate === "string") {
        dateKey = t.startDate.includes("T") ? t.startDate.split("T")[0] : t.startDate;
      }

      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(t);
      }
    });
    return map;
  }, [calendarTasks]);

  return (
    <div className="space-y-6">
      {/* Control panel: View mode, New task, Status filters & Search in one compact card */}
      <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-3.5 shadow-xs space-y-2.5">
        {/* Top row: View mode switch & New task button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FAFAFA] p-0.5 rounded-[9px] border border-[#E5E5EA]">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                <ListIcon size={13} strokeWidth={1.5} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                <CalendarDays size={13} strokeWidth={1.5} />
                <span>Calendar</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] active:bg-black text-white px-3.5 py-1.5 rounded-[9px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New task</span>
          </button>
        </div>

        {/* Bottom row: Status filters (without 'status:' label) & Search bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#E5E5EA]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: "Pending", value: "PENDING" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Blocked", value: "BLOCK" },
              { label: "Completed", value: "COMPLETED" },
              { label: "All Workflows", value: "ALL" },
            ].map((option) => {
              const isSelected = statusTab === option.value;
              return (
                <button
                  key={`status-${option.value}`}
                  onClick={() => setStatusTab(option.value)}
                  className={`px-2.5 py-1 rounded-[7px] text-[11px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#171717] text-white shadow-xs"
                      : "bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search
              size={14}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6E73]"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] py-1.5 pl-8 pr-2.5 outline-none focus:border-[#171717] focus:bg-white text-[12px] text-[#1C1C1E] transition-all"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LIST VIEW */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-[#171717]" size={28} strokeWidth={1.5} />
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-2.5">
              {tasks.map((task) => {
                const currentStatus = getStatusConfig(task.status);
                const isHighPriority = task.priority === "HIGH";
                const companyObj = companies.find((c) => c.idCompany === task.idCompany);
                const companyColor = getCompanyColor(companyObj || { idCompany: task.idCompany, name: task.nameCompany });
                const companyName = task.nameCompany || (companyObj ? companyObj.name : null) || task.externalReferenceName || "Sin empresa";

                return (
                  <div
                    key={`task-card-${task.idTask}`}
                    onClick={() => handleOpenTaskDetail(task.idTask)}
                    className={`rounded-[12px] p-3.5 sm:p-4 transition-all cursor-pointer shadow-xs ${
                      isHighPriority
                        ? "bg-gradient-to-r from-red-500/[0.08] via-red-500/[0.02] to-transparent border border-[#E5E5EA] border-l-[5px] border-l-[#EF4444] hover:border-l-[#DC2626] hover:shadow-sm"
                        : "bg-white border border-[#E5E5EA] hover:border-[#171717]/30 hover:shadow-sm"
                    }`}
                  >
                    {/* Primer Renglón: TITULO */}
                    <div className="mb-2">
                      <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#1C1C1E] tracking-tight leading-snug">
                        {task.title}
                      </h3>
                    </div>

                    {/* Segundo Renglón: Empresa & Asignado (izq.) | Estatus, Fecha & Trash (der.) */}
                    <div className="flex items-center justify-between gap-3 text-[12px] text-[#6E6E73] flex-wrap sm:flex-nowrap">
                      {/* Izquierda: Empresa con puntito de color + Persona Asignada */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                        {/* Empresa con puntito a la izquierda según color de la empresa */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          title={`Empresa: ${companyName}`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/5"
                            style={{ backgroundColor: companyColor }}
                          />
                          <span className="font-medium text-[#2C2C2E] truncate max-w-[150px] sm:max-w-[220px]">
                            {companyName}
                          </span>
                        </div>

                        <span className="text-[#D1D1D6] shrink-0">•</span>

                        {/* Persona asignada */}
                        <div
                          className="flex items-center gap-1.5 text-[#6E6E73] truncate"
                          title={`Asignado a: ${task.nameUser || "Sin asignar"}`}
                        >
                          <User size={13} strokeWidth={1.5} className="text-[#8E8E93] shrink-0" />
                          <span className="truncate max-w-[130px] sm:max-w-[190px]">
                            {task.nameUser || "Sin asignar"}
                          </span>
                        </div>
                      </div>

                      {/* Derecha (al otro extremo): Estatus, Fecha, Trash */}
                      <div
                        className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* 1. Estatus (primero el estatus) */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.idTask, e.target.value)}
                          className={`text-[11px] font-medium lowercase rounded-[6px] px-2 py-0.5 border outline-none cursor-pointer transition-colors shadow-2xs ${currentStatus.bg}`}
                        >
                          <option value="PENDING" className="bg-white text-[#1C1C1E]">pending</option>
                          <option value="IN_PROGRESS" className="bg-white text-[#1C1C1E]">in progress</option>
                          <option value="BLOCK" className="bg-white text-[#1C1C1E]">blocked</option>
                          <option value="COMPLETED" className="bg-white text-[#1C1C1E]">completed</option>
                        </select>

                        {/* 2. Fecha (después la fecha) */}
                        <div className="flex items-center gap-1.5 text-[#6E6E73] text-[12px] whitespace-nowrap">
                          <CalendarIcon size={13} strokeWidth={1.5} className="text-[#8E8E93]" />
                          <span>{displayDate(task.startDate)}</span>
                        </div>

                        {/* 3. Trash para borrar (después el trash) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-1 text-[#AEAEB2] hover:text-[#EF4444] rounded-[6px] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Centinela de Scroll Infinito & Indicador de Carga / Fin de Lista */}
              <div ref={sentinelRef} className="py-4 flex justify-center items-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-[#6E6E73] text-[12px]">
                    <Loader2 className="animate-spin text-[#171717]" size={16} strokeWidth={1.5} />
                    <span>Loading more tasks...</span>
                  </div>
                )}
                {!hasMore && tasks.length > 0 && (
                  <div className="text-center text-[12px] text-[#AEAEB2] py-2">
                    All tasks loaded ({totalElements} {totalElements === 1 ? "task" : "tasks"})
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-12 text-center text-[#AEAEB2]">
              <p className="text-[13px]">No tasks found matching your filters</p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-6 shadow-none space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#E5E5EA]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(true)}
                className="flex items-center gap-2 hover:bg-[#FAFAFA] py-1.5 px-3 rounded-[8px] transition-colors border border-transparent hover:border-[#E5E5EA] cursor-pointer"
                title="Select month and year"
              >
                <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <CalendarIcon size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
              </button>
              {calendarLoading && (
                <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-[#171717]" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="p-1.5 bg-white hover:bg-[#FAFAFA] text-[#6E6E73] hover:text-[#1C1C1E] rounded-[8px] border border-[#E5E5EA] transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 bg-white hover:bg-[#FAFAFA] text-[#1C1C1E] text-[12px] font-medium rounded-[8px] border border-[#E5E5EA] transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="p-1.5 bg-white hover:bg-[#FAFAFA] text-[#6E6E73] hover:text-[#1C1C1E] rounded-[8px] border border-[#E5E5EA] transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium lowercase text-[#6E6E73] pb-1">
            <div>sun</div>
            <div>mon</div>
            <div>tue</div>
            <div>wed</div>
            <div>thu</div>
            <div>fri</div>
            <div>sat</div>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = calendarTasksByDate[dateKey] || [];
              const isCurrMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={`cal-day-${dateKey}`}
                  onClick={() => handleDateCellClick(day)}
                  className={`min-h-[100px] sm:min-h-[110px] p-2 rounded-[10px] border transition-colors flex flex-col justify-between group cursor-pointer ${
                    !isCurrMonth
                      ? "bg-[#FAFAFA]/50 border-[#E5E5EA]/60 opacity-40"
                      : isTodayDate
                      ? "bg-[#171717]/5 border-[#171717]/30"
                      : "bg-white border-[#E5E5EA] hover:border-[#171717]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                        isTodayDate
                          ? "bg-[#171717] text-white"
                          : isCurrMonth
                          ? "text-[#1C1C1E]"
                          : "text-[#AEAEB2]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateCellClick(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#171717] hover:bg-[#171717]/10 rounded transition-opacity"
                      title="Add task"
                    >
                      <Plus size={12} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Task chips with company color */}
                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-20">
                    {dayTasks.map((t) => {
                      const taskCompany = companies.find((c) => c.idCompany === t.idCompany);
                      const compColor = getCompanyColor(taskCompany || t.idCompany || t.nameCompany);
                      const companyName = taskCompany?.name || t.nameCompany;
                      return (
                        <div
                          key={`cal-task-${t.idTask}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTaskDetail(t.idTask);
                          }}
                          style={{
                            backgroundColor: hexToRgba(compColor, 0.12),
                            borderColor: hexToRgba(compColor, 0.38),
                          }}
                          className="px-1.5 py-0.5 rounded-[6px] border text-[10px] font-medium flex items-center gap-1 transition-all truncate cursor-pointer hover:opacity-90"
                          title={`${t.title}${companyName ? ` (${companyName})` : ""} - ${t.status}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: compColor }}
                          />
                          <span className="truncate flex-1 text-[#1C1C1E]">{t.title}</span>
                          {t.priority === "HIGH" && (
                            <Flame size={10} strokeWidth={2} className="text-[#EF4444] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-[#AEAEB2] lowercase">
                    {dayTasks.length > 0 ? `${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP: NEW TASK MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-[14px] p-6 relative shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Popup Plain Title: "New task" per specification */}
            <div className="mb-5 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                New task
              </h2>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="enter task title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2 px-3 outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20 text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  rows="2"
                  placeholder="enter task details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2 px-3 outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20 text-[13px] text-[#1C1C1E] resize-none"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2 px-3 outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20 text-[13px] text-[#1C1C1E]"
                />
              </div>

              {/* Recurrence */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] space-y-2">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  repeat frequency
                </label>
                <select
                  value={formData.repeatType}
                  onChange={(e) =>
                    setFormData({ ...formData, repeatType: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  <option value="NONE">One time (No repeat)</option>
                  <option value="DAILY">Daily (Every day)</option>
                  <option value="WEEKLY">Weekly (Every week)</option>
                  <option value="MONTHLY">Monthly (Every month)</option>
                  <option value="QUARTERLY">Quarterly (Every 3 months)</option>
                  <option value="YEARLY">Yearly (Every year)</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  priority *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "LOW", label: "Low", isHigh: false },
                    { id: "NORMAL", label: "Normal", isHigh: false },
                    { id: "HIGH", label: "High priority", isHigh: true },
                  ].map((p) => {
                    const isSelected = (formData.priority || "NORMAL") === p.id;
                    return (
                      <button
                        type="button"
                        key={`priority-btn-${p.id}`}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`py-2 px-3 rounded-[8px] border text-center transition-colors flex items-center justify-center gap-1.5 text-[12px] font-medium lowercase cursor-pointer ${
                          isSelected
                            ? p.isHigh
                              ? "bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]"
                              : "bg-[#171717] border-[#171717] text-white"
                            : "bg-white border-[#E5E5EA] text-[#6E6E73] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        {p.isHigh && <Flame size={14} strokeWidth={1.5} className="text-[#EF4444]" />}
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Operator */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  assign operator *
                </label>
                <select
                  required
                  value={formData.idUserAssigned}
                  onChange={(e) =>
                    setFormData({ ...formData, idUserAssigned: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  <option value="">Select operator</option>
                  {users.map((u) => (
                    <option key={`modal-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company / External client */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    company
                  </label>
                  <select
                    value={formData.idCompany}
                    disabled={!!formData.externalReferenceName || !!companyId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCompany: e.target.value,
                        externalReferenceName: "",
                      })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer disabled:bg-gray-100 disabled:text-[#AEAEB2]"
                  >
                    <option value="">None</option>
                    {companies.map((c) => (
                      <option
                        key={`modal-company-${c.idCompany}`}
                        value={c.idCompany}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    or external client reference
                  </label>
                  <input
                    type="text"
                    disabled={!!formData.idCompany}
                    placeholder={
                      formData.idCompany
                        ? "Clear company selection first"
                        : "Enter client reference..."
                    }
                    value={formData.externalReferenceName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalReferenceName: e.target.value,
                        idCompany: "",
                      })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] disabled:bg-gray-100 disabled:text-[#AEAEB2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-5 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL VIEW */}
      <TaskDetailView
        isOpen={isDetailViewOpen}
        onClose={handleCloseTaskDetail}
        taskId={selectedTaskId}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (SOLO ADMIN) */}
      <TaskDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        task={taskToDelete}
        isDeleting={isDeletingTask}
      />

      {/* SELECTOR DE SALTO DIRECTO DE MES Y AÑO */}
      <MonthYearPicker
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        currentDate={currentMonth}
        onSelect={(newDate) => setCurrentMonth(newDate)}
      />
    </div>
  );
};

export default TasksPage;
