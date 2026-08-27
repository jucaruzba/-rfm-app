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
    if (!formData.startDate || !formData.endDate)
      return toast.error("Execution dates are required");
    if (!formData.idUserAssigned)
      return toast.error("A technical operator must be assigned");

    const parsedUserId = Number(formData.idUserAssigned);

    const taskRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      startDate: formatDateToBackend(formData.startDate),
      endDate: formatDateToBackend(formData.endDate),
      idCompany: formData.idCompany ? Number(formData.idCompany) : null,
      externalReferenceName: formData.externalReferenceName.trim() || null,
      idUserAssigned: parsedUserId,
      status: formData.status,
      repeatType: formData.repeatType,
      repeatEndDate: formData.repeatType !== "NONE" && formData.repeatEndDate
        ? formatDateToBackend(formData.repeatEndDate)
        : null,
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
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
          dotBg: "bg-emerald-500",
          icon: <CheckCircle2 size={12} />,
        };
      case "IN_PROGRESS":
      case "PROGRESS":
        return {
          bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          pillBg: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          dotBg: "bg-blue-500",
          icon: <Clock size={12} />,
        };
      case "BLOCK":
        return {
          bg: "bg-red-500/10 text-red-600 border-red-500/20",
          pillBg: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
          dotBg: "bg-red-500",
          icon: <AlertCircle size={12} />,
        };
      default:
        return {
          bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          pillBg: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
          dotBg: "bg-amber-500",
          icon: <AlertCircle size={12} />,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-100 rounded-[2rem] px-8 py-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
              Task <span className="text-gray-300 font-light">Control</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-wide mt-1 uppercase">
              Operational Node Flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* CONMUTADOR DE VISTAS (LISTA / CALENDARIO) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === "list"
                  ? "bg-[#001F3F] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#001F3F]"
              }`}
            >
              <ListIcon size={13} /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === "calendar"
                  ? "bg-[#001F3F] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#001F3F]"
              }`}
            >
              <CalendarDays size={13} /> Calendar
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#001F3F] text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
          >
            <Plus size={14} strokeWidth={3} /> Add Task
          </button>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#001F3F]/40 block">
          System Search Filters
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Selector de Empresas */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
              Corporate Client
            </label>
            <select
              value={filterCompany}
              disabled={!!companyId}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer"
            >
              <option value="">-- All Companies --</option>
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

          {/* Selector de Usuarios Operadores */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
              Assigned Operator
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer"
            >
              <option value="">-- All Staff Operators --</option>
              {users.map((u) => (
                <option key={`filter-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                  {u.name || u.username}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio Bounds (solo en vista lista) */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
              Start Bounds
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
            />
          </div>

          {/* Fecha Fin Bounds (solo en vista lista) */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
              End Bounds
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
            />
          </div>
        </div>

        {/* Fila secundaria */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl overflow-x-auto">
            {[
              { id: "PENDING", name: "Pending" },
              { id: "IN_PROGRESS", name: "In Progress" },
              { id: "COMPLETED", name: "Completed" },
              { id: "ALL", name: "All Workflows" },
            ].map((tab) => (
              <button
                key={`tab-status-${tab.id}`}
                onClick={() => setStatusTab(tab.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg whitespace-nowrap transition-all ${
                  statusTab === tab.id
                    ? "bg-[#001F3F] text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="relative flex-1 lg:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              size={15}
            />
            <input
              type="text"
              placeholder="Search by keywords inside results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:bg-white font-bold text-xs text-[#001F3F] transition-all"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: LISTA PAGINADA */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-[#001F3F]" size={36} />
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => {
                const currentStatus = getStatusConfig(task.status);
                return (
                  <div
                    key={`task-card-${task.idTask}`}
                    onClick={() => handleOpenTaskDetail(task.idTask)}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/20 hover:shadow-[0_15px_40px_rgba(0,31,63,0.02)] transition-all duration-300 relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#001F3F] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`border px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${currentStatus.bg}`}
                        >
                          {currentStatus.icon} {task.status.replace("_", " ")}
                        </span>

                        {task.repeatType && task.repeatType !== "NONE" && (
                          <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Repeat size={11} className="text-purple-600" />
                            {task.repeatType === "QUARTERLY" ? "Quarterly" : task.repeatType}
                          </span>
                        )}

                        {task.priority === "HIGH" ? (
                          <span className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                            <Flame size={11} className="text-red-600 fill-red-600" />
                            High Priority
                          </span>
                        ) : task.priority === "LOW" ? (
                          <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                            Low Priority
                          </span>
                        ) : (
                          <span className="bg-blue-50/60 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                            Normal Priority
                          </span>
                        )}

                        {task.nameCompany ? (
                          <span className="bg-gray-50 border border-gray-100 text-gray-500 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Building2 size={11} className="text-blue-500" />{" "}
                            {task.nameCompany}
                          </span>
                        ) : task.externalReferenceName ? (
                          <span className="bg-gray-50 border border-gray-100 text-gray-400 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Briefcase size={11} className="text-amber-500" />{" "}
                            Client: {task.externalReferenceName}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="text-base font-black text-[#001F3F] uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5 line-clamp-2">
                          {task.description ||
                            "No execution summary mapped to this directive."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pt-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-300" /> Operator:{" "}
                          <span className="text-gray-600 font-black">
                            {task.nameUser || "System Stack"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon size={13} className="text-gray-300" /> Timeline:{" "}
                          <span className="text-gray-600 font-mono font-bold">
                            {displayDate(task.startDate)} —{" "}
                            {displayDate(task.endDate)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div
                      className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.idTask, e.target.value)
                        }
                        className="bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500 rounded-lg p-2.5 outline-none cursor-pointer focus:border-blue-500 transition-colors"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="BLOCK">Blocked</option>
                        <option value="COMPLETED">Completed</option>
                      </select>

                      {/* Botón de eliminar - SOLO PARA ADMIN */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(task)}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-gray-100 hover:border-red-200 cursor-pointer"
                          title="Delete task (Admin only)"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
              <ClipboardList className="mx-auto text-gray-200 mb-3" size={48} />
              <h3 className="text-base font-black text-[#001F3F] uppercase tracking-tight">
                No active task directives found
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Try modifying your search criteria or register a new task.
              </p>
            </div>
          )}

          {/* CONTROLES DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Showing Page {page + 1} of {totalPages} ({totalElements} total directives)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001F3F] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all"
                >
                  Prev
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
                          className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                            page === index
                              ? "bg-[#001F3F] text-white shadow-md shadow-blue-900/10"
                              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
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
                          className="text-gray-300 text-xs px-1"
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
                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001F3F] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CALENDARIO DE MES COMPLETO */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Barra de Navegación del Mes con botón para salto de mes/año */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(true)}
                className="flex items-center gap-2 group hover:bg-blue-50/70 py-1.5 px-3 -ml-3 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-blue-100"
                title="Click to jump to another month / year"
              >
                <h2 className="text-xl font-black text-[#001F3F] group-hover:text-blue-600 uppercase tracking-tight italic transition-colors">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <CalendarIcon size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
              {calendarLoading && (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-[#001F3F] rounded-xl border border-gray-100 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-[#001F3F] text-[10px] font-black uppercase tracking-widest rounded-xl border border-gray-100 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-[#001F3F] rounded-xl border border-gray-100 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Días de la semana - Inicia en Domingo (estándar USA) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-wider text-gray-400 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Cuadrícula del mes */}
          <div className="grid grid-cols-7 gap-2 auto-rows-fr">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = calendarTasksByDate[dateKey] || [];
              const isCurrMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={`cal-day-${dateKey}`}
                  onClick={() => handleDateCellClick(day)}
                  className={`min-h-[110px] sm:min-h-[130px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                    !isCurrMonth
                      ? "bg-gray-50/40 border-gray-100/60 opacity-50"
                      : isTodayDate
                      ? "bg-blue-50/30 border-blue-200 ring-2 ring-blue-500/20"
                      : "bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                        isTodayDate
                          ? "bg-[#001F3F] text-white"
                          : isCurrMonth
                          ? "text-[#001F3F]"
                          : "text-gray-400"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateCellClick(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 text-blue-600 rounded-md transition-all"
                      title="Add task on this day"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Lista de chips de tareas en el día */}
                  <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto max-h-24 custom-scroll">
                    {dayTasks.map((t) => {
                      const statusCfg = getStatusConfig(t.status);
                      return (
                        <div
                          key={`cal-task-${t.idTask}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTaskDetail(t.idTask);
                          }}
                          className={`px-2 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1.5 transition-all truncate shadow-2xs cursor-pointer ${statusCfg.pillBg}`}
                          title={`${t.title} (${t.status})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dotBg}`} />
                          <span className="truncate flex-1 font-semibold">{t.title}</span>
                          {t.repeatType && t.repeatType !== "NONE" && (
                            <Repeat size={9} className="shrink-0 text-purple-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contador inferior */}
                  <div className="text-[8px] font-black uppercase text-gray-400 tracking-wider">
                    {dayTasks.length > 0 ? `${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CREACIÓN DE TAREA (CON REPETICIÓN) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto custom-scroll">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-[#001F3F] tracking-tighter uppercase italic">
                Deploy Strategy Task
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                Define target client, timeline constraints, recurrence and staff operator
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                  Task Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Subject designation..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                  Execution Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Technical specifications..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-[#001F3F] font-medium text-xs text-[#001F3F] resize-none"
                />
              </div>

              {/* FECHAS DE EJECUCIÓN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                  />
                </div>
              </div>

              {/* REPETICIÓN (RECURRENCIA) */}
              <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-900/60 flex items-center gap-1.5">
                  <Repeat size={12} className="text-purple-600" /> Recurrence Settings
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                      Repeat Frequency
                    </label>
                    <select
                      value={formData.repeatType}
                      onChange={(e) =>
                        setFormData({ ...formData, repeatType: e.target.value })
                      }
                      className="w-full bg-white border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer"
                    >
                      <option value="NONE">One time (No repeat)</option>
                      <option value="DAILY">Daily (Every day)</option>
                      <option value="WEEKLY">Weekly (Every week)</option>
                      <option value="MONTHLY">Monthly (Every month)</option>
                      <option value="QUARTERLY">Quarterly (Every 3 months)</option>
                      <option value="YEARLY">Yearly (Every year)</option>
                    </select>
                  </div>

                  {formData.repeatType !== "NONE" && (
                    <div className="space-y-1 animate-in fade-in">
                      <label className="text-[9px] font-black uppercase tracking-wider text-purple-700">
                        Repeat Until (Optional - Leave blank for Never)
                      </label>
                      <input
                        type="date"
                        value={formData.repeatEndDate}
                        min={formData.startDate || undefined}
                        onChange={(e) =>
                          setFormData({ ...formData, repeatEndDate: e.target.value })
                        }
                        className="w-full bg-white border border-purple-200 rounded-xl p-3 outline-none focus:border-purple-600 font-bold text-xs text-[#001F3F]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* PRIORITY SELECTION */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                  Priority *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "LOW", label: "Low", color: "border-gray-200 bg-gray-50 text-gray-700" },
                    { id: "NORMAL", label: "Normal", color: "border-blue-200 bg-blue-50/50 text-blue-700" },
                    { id: "HIGH", label: "High", color: "border-red-200 bg-red-50 text-red-700" },
                  ].map((p) => {
                    const isSelected = (formData.priority || "NORMAL") === p.id;
                    return (
                      <button
                        type="button"
                        key={`priority-btn-${p.id}`}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${p.color} ring-2 ring-offset-1 ${p.id === "HIGH" ? "ring-red-400 font-black" : "ring-blue-400 font-bold"}`
                            : "bg-white border-gray-100 text-gray-400 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase">
                          {p.id === "HIGH" && <Flame size={13} className="text-red-500 fill-red-500" />}
                          {p.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPERADOR ASIGNADO */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                  Assign Operator *
                </label>
                <select
                  required
                  value={formData.idUserAssigned}
                  onChange={(e) =>
                    setFormData({ ...formData, idUserAssigned: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                >
                  <option value="">-- Choose Operator From Registry --</option>
                  {users.map((u) => (
                    <option key={`modal-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* CLIENTE / COMPAÑÍA */}
              <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#001F3F]/40 block">
                  Target Association (Exclusive Selection)
                </span>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    System Company
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
                    className="w-full bg-white border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer disabled:bg-gray-100/60 disabled:text-gray-400"
                  >
                    <option value="">-- No corporate entity --</option>
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

                <div className="flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
                  - OR -
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    External Client Reference
                  </label>
                  <input
                    type="text"
                    disabled={!!formData.idCompany}
                    placeholder={
                      formData.idCompany
                        ? "Clear Company field to type here..."
                        : "Type external client reference..."
                    }
                    value={formData.externalReferenceName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        externalReferenceName: e.target.value,
                        idCompany: "",
                      })
                    }
                    className="w-full bg-white border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] disabled:bg-gray-100/60 disabled:text-gray-400 italic"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#001F3F] text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {submitting ? "Deploying..." : "Assign Task"}
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
