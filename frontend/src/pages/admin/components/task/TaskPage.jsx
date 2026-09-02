import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Search,
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Repeat,
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
  isSameDay,
  isToday,
  parseISO,
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
  const [filterUser, setFilterUser] = useState("");
  const [filterCompany, setFilterCompany] = useState(companyId || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // --- NUEVOS ESTADOS DE PAGINACIÓN ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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

  // Consulta paginada para la vista Lista
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks({
        idCompany: filterCompany || null,
        status: statusTab,
        idUserAssigned: filterUser ? Number(filterUser) : null,
        title: searchQuery || null,
        start: startDate || null,
        end: endDate || null,
        page: page,
        size: pageSize,
      });

      setTasks(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      toast.error("Error syncing task flow");
    } finally {
      setLoading(false);
    }
  }, [
    filterCompany,
    statusTab,
    filterUser,
    searchQuery,
    startDate,
    endDate,
    page,
    pageSize,
  ]);

  // Consulta completa para la vista Calendario (mes completo sin cortes de paginación)
  // Cambiado a inicio de semana en Domingo (weekStartsOn: 0)
  const fetchCalendarTasks = useCallback(async () => {
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
      fetchTasks();
    } else {
      fetchCalendarTasks();
    }
  }, [viewMode, fetchTasks, fetchCalendarTasks]);

  // Si cambia un filtro crítico de búsqueda, volvemos a la página 0 en modo lista
  useEffect(() => {
    setPage(0);
  }, [filterCompany, statusTab, filterUser, searchQuery, startDate, endDate]);

  const handleStatusChange = async (idTask, newStatus) => {
    try {
      await taskService.updateStatus(idTask, newStatus);
      toast.success("Operational status updated");
      if (viewMode === "list") fetchTasks();
      else fetchCalendarTasks();
    } catch (err) {
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
      if (viewMode === "list") fetchTasks();
      else fetchCalendarTasks();
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
      setPage(0);
      if (viewMode === "list") fetchTasks();
      else fetchCalendarTasks();
    } catch (err) {
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
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E5E5EA] rounded-[12px] px-6 py-4 shadow-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <ListIcon size={14} strokeWidth={1.5} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <CalendarDays size={14} strokeWidth={1.5} />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] active:bg-black text-white px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>New task</span>
        </button>
      </div>

      {/* Advanced filter panel */}
      <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Corporate Client */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              corporate client
            </label>
            <select
              value={filterCompany}
              disabled={!!companyId}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20 cursor-pointer"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option
                  key={`filter-company-${c.idCompany}`}
                  value={c.idCompany}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Operator */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              assigned operator
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20 cursor-pointer"
            >
              <option value="">All operators</option>
              {users.map((u) => (
                <option key={`filter-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                  {u.name || u.username}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              from date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              to date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]/20"
            />
          </div>
        </div>

        {/* Priority Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E5E5EA]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium lowercase text-[#6E6E73] mr-1">
              priority:
            </span>
            {["", "LOW", "NORMAL", "HIGH"].map((p) => {
              const isSelected = filterPriority === p;
              const isHigh = p === "HIGH";
              return (
                <button
                  key={`priority-${p || "all"}`}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1 rounded-[8px] text-[12px] font-medium lowercase transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#171717] text-white shadow-xs"
                      : "bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white"
                  }`}
                >
                  {isHigh ? (
                    <span className="flex items-center gap-1">
                      <Flame size={13} strokeWidth={1.5} className={isSelected ? "text-[#EF4444]" : "text-[#EF4444]"} />
                      <span>high</span>
                    </span>
                  ) : (
                    p ? p.toLowerCase() : "all"
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[220px]">
            <Search
              size={15}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] py-2 pl-9 pr-3 outline-none focus:border-[#171717] focus:bg-white text-[13px] text-[#1C1C1E] transition-all"
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
          ) : (filterPriority ? tasks.filter(t => t.priority === filterPriority) : tasks).length > 0 ? (
            <div className="space-y-3">
              {(filterPriority ? tasks.filter(t => t.priority === filterPriority) : tasks).map((task) => {
                const currentStatus = getStatusConfig(task.status);
                return (
                  <div
                    key={`task-card-${task.idTask}`}
                    onClick={() => handleOpenTaskDetail(task.idTask)}
                    className="bg-white border border-[#E5E5EA] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#171717]/30 transition-colors cursor-pointer shadow-xs"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge: lowercase */}
                        <span
                          className={`border px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase flex items-center gap-1.5 ${currentStatus.bg}`}
                        >
                          {currentStatus.icon}
                          <span>{task.status?.toLowerCase().replace("_", " ")}</span>
                        </span>

                        {task.repeatType && task.repeatType !== "NONE" && (
                          <span className="bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase flex items-center gap-1">
                            <Repeat size={11} strokeWidth={1.5} />
                            <span>{task.repeatType.toLowerCase()}</span>
                          </span>
                        )}

                        {/* Priority: flame icon + #EF4444 text only, never a full badge */}
                        {task.priority === "HIGH" ? (
                          <span className="flex items-center gap-1 text-[#EF4444] text-[11px] font-medium lowercase">
                            <Flame size={14} strokeWidth={1.5} className="text-[#EF4444]" />
                            <span>high priority</span>
                          </span>
                        ) : null}

                        {task.nameCompany ? (
                          <span className="bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase flex items-center gap-1">
                            <Building2 size={11} strokeWidth={1.5} />
                            <span>{task.nameCompany}</span>
                          </span>
                        ) : task.externalReferenceName ? (
                          <span className="bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase flex items-center gap-1">
                            <Briefcase size={11} strokeWidth={1.5} />
                            <span>client: {task.externalReferenceName}</span>
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="text-[15px] font-semibold text-[#1C1C1E]">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-[13px] text-[#6E6E73] mt-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[#8E8E93] text-[12px]">
                        <span className="flex items-center gap-1.5">
                          <User size={13} strokeWidth={1.5} />
                          <span className="text-[#6E6E73]">{task.nameUser || "Unassigned"}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={13} strokeWidth={1.5} />
                          <span className="text-[#6E6E73]">{displayDate(task.startDate)}</span>
                        </span>
                      </div>
                    </div>

                    <div
                      className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E5EA]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.idTask, e.target.value)
                        }
                        className="bg-[#FAFAFA] border border-[#E5E5EA] text-[12px] font-medium lowercase text-[#1C1C1E] rounded-[8px] px-2.5 py-1.5 outline-none cursor-pointer focus:border-[#171717]"
                      >
                        <option value="PENDING">pending</option>
                        <option value="IN_PROGRESS">in progress</option>
                        <option value="BLOCK">blocked</option>
                        <option value="COMPLETED">completed</option>
                      </select>

                      {isAdmin && (
                        <button
                          onClick={() => handleRequestDelete(task)}
                          className="p-2 text-[#AEAEB2] hover:text-[#EF4444] rounded-[8px] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-12 text-center text-[#AEAEB2]">
              <p className="text-[13px]">No tasks found matching your filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-[#E5E5EA] rounded-[10px] p-3.5 mt-4">
              <div className="text-[12px] text-[#6E6E73]">
                Page <span className="font-semibold text-[#1C1C1E]">{page + 1}</span> of{" "}
                <span className="font-semibold text-[#1C1C1E]">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  disabled={page === 0}
                  className="px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F2F2F7] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    if (
                      index === 0 ||
                      index === totalPages - 1 ||
                      (index >= page - 1 && index <= page + 1)
                    ) {
                      return (
                        <button
                          key={`page-${index}`}
                          onClick={() => setPage(index)}
                          className={`w-7 h-7 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                            page === index
                              ? "bg-[#171717] text-white"
                              : "text-[#6E6E73] hover:bg-[#FAFAFA] hover:text-[#1C1C1E]"
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    }
                    if (index === 1 || index === totalPages - 2) {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="text-[#AEAEB2] text-xs px-1"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  disabled={page === totalPages - 1}
                  className="px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] text-[12px] font-medium text-[#1C1C1E] hover:bg-[#F2F2F7] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
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

                  {/* Task chips */}
                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-20">
                    {dayTasks.map((t) => {
                      const statusCfg = getStatusConfig(t.status);
                      return (
                        <div
                          key={`cal-task-${t.idTask}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTaskDetail(t.idTask);
                          }}
                          className={`px-1.5 py-0.5 rounded-[6px] border text-[10px] font-medium flex items-center gap-1 transition-colors truncate cursor-pointer ${statusCfg.pillBg}`}
                          title={`${t.title} (${t.status})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dotBg}`} />
                          <span className="truncate flex-1">{t.title}</span>
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
