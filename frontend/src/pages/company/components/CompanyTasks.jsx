import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  User,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  PlayCircle,
} from "lucide-react";
import { taskService } from "../../../services/taskService";
import { userService } from "../../../services/userService";
import { toast } from "sonner";
import TaskDetailView from "../../admin/components/task/TaskDetailView";

const CompanyTasks = () => {
  const { companyId } = useParams();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // --- FILTROS ---
  const [statusTab, setStatusTab] = useState("ALL");
  const [filterUser, setFilterUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // --- PAGINACIÓN ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // --- MODAL DE CREAR TAREA ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    idUserAssigned: "",
    status: "PENDING",
  });

  // --- TASK DETAIL VIEW ---
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userService.findAll();
        setUsers(usersData || []);
      } catch (err) {
        console.error("Error loading users", err);
      }
    };
    loadUsers();
  }, []);

  // Fetch tareas de la empresa
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks({
        idCompany: companyId,
        status: statusTab,
        idUserAssigned: filterUser ? Number(filterUser) : null,
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
    companyId,
    statusTab,
    filterUser,
    startDate,
    endDate,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset a página 0 cuando cambian filtros críticos
  useEffect(() => {
    setPage(0);
  }, [statusTab, filterUser, startDate, endDate]);

  const handleStatusChange = async (idTask, newStatus) => {
    try {
      await taskService.updateStatus(idTask, newStatus);
      toast.success("Operational status updated");
      fetchTasks();
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
    fetchTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.startDate || !formData.endDate)
      return toast.error("Execution dates are required");
    if (!formData.idUserAssigned)
      return toast.error("A technical operator must be assigned");

    const formatToRequest = (dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    };

    const taskRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      startDate: formatToRequest(formData.startDate),
      endDate: formatToRequest(formData.endDate),
      idCompany: Number(companyId),
      idUserAssigned: Number(formData.idUserAssigned),
      status: formData.status,
    };

    setSubmitting(true);
    try {
      await taskService.createTask(taskRequest);
      toast.success("Nueva tarea desplegada correctamente");
      setIsModalOpen(false);

      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        idUserAssigned: "",
        status: "PENDING",
      });
      setPage(0);
      fetchTasks();
    } catch (err) {
      toast.error("Error registering the task in the backend");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado local por búsqueda
  const finalFilteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle2 size={12} />,
        };
      case "PROGRESS":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: <PlayCircle size={12} />,
        };
      case "BLOCK":
        return {
          bg: "bg-red-500/10 text-red-400 border-red-500/20",
          icon: <AlertCircle size={12} />,
        };
      default:
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <AlertCircle size={12} />,
        };
    }
  };

  const displayDate = (date) => {
    if (!date) return "--/--/----";
    if (Array.isArray(date)) {
      const [y, m, d] = date;
      return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
    }
    return date;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-[2rem] px-8 py-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
              Task <span className="text-gray-300 font-light">Control</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-wide mt-1 uppercase">
              Enterprise Operations
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
        >
          <Plus size={14} strokeWidth={3} /> Add Task
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#001F3F]/40 block">
          System Search Filters
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Fecha Inicio */}
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

          {/* Fecha Fin */}
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
              { id: "ALL", name: "All Workflows" },
              { id: "PENDING", name: "Pending" },
              { id: "PROGRESS", name: "In Progress" },
              { id: "BLOCK", name: "Blocked" },
              { id: "COMPLETED", name: "Completed" },
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

      {/* RENDERIZADO DE CARDS */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#001F3F]" size={36} />
        </div>
      ) : finalFilteredTasks.length > 0 ? (
        <div className="space-y-4">
          {finalFilteredTasks.map((task) => {
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

                    {task.externalReferenceName ? (
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
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5">
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
                      <Calendar size={13} className="text-gray-300" /> Timeline:{" "}
                      <span className="text-gray-600 font-mono font-bold">
                        {displayDate(task.startDate)} —{" "}
                        {displayDate(task.endDate)}
                      </span>
                    </span>
                  </div>
                </div>

                <div
                  className="shrink-0 flex items-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-50"
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
                    <option value="PROGRESS">In Progress</option>
                    <option value="BLOCK">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center">
          <ClipboardList className="mx-auto text-gray-200 mb-3" size={44} />
          <p className="text-xs font-black text-[#001F3F] uppercase tracking-wider">
            No matching active records found
          </p>
        </div>
      )}

      {/* PAGINACIÓN */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm gap-4 mt-6 animate-in fade-in">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            View{" "}
            <span className="text-[#001F3F] font-black">
              {finalFilteredTasks.length}
            </span>{" "}
            of{" "}
            <span className="text-[#001F3F] font-black">{totalElements}</span>{" "}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#001F3F] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-gray-50 transition-all"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => {
                if (
                  index === 0 ||
                  index === totalPages - 1 ||
                  Math.abs(index - page) <= 1
                ) {
                  return (
                    <button
                      key={`page-btn-${index}`}
                      onClick={() => setPage(index)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
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

      {/* MODAL DE CREAR TAREA */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
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
                Define timeline constraints and staff operator
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
    </div>
  );
};

export default CompanyTasks;
