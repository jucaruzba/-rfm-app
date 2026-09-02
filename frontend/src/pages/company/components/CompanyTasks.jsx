import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Search,
  Calendar,
  User,
  Briefcase,
  Loader2,
  AlertCircle,
  X,
  Repeat,
  Flame,
  Trash2,
} from "lucide-react";
import { taskService } from "../../../services/taskService";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import TaskDetailView from "../../admin/components/task/TaskDetailView";
import TaskDeleteDialog from "../../../components/TaskDeleteDialog";
import { formatUsDate, formatDateToBackend } from "../../../utils/dateUtils";

const CompanyTasks = () => {
  const { companyId } = useParams();
  const { user: authUser } = useAuth();
  const isAdmin =
    authUser?.role?.toLowerCase() === "admin" || authUser?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // --- DELETE STATE ---
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // --- FILTERS ---
  const [statusTab, setStatusTab] = useState("PENDING");
  const [filterUser, setFilterUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // --- PAGINATION ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // --- CREATE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    idUserAssigned: "",
    status: "PENDING",
    repeatType: "NONE",
    repeatEndDate: "",
    priority: "NORMAL",
  });

  // --- TASK DETAIL VIEW ---
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

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

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks({
        idCompany: companyId,
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
      toast.error("Error loading tasks");
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    statusTab,
    filterUser,
    searchQuery,
    startDate,
    endDate,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setPage(0);
  }, [statusTab, filterUser, searchQuery, startDate, endDate]);

  const handleStatusChange = async (idTask, newStatus) => {
    try {
      await taskService.updateStatus(idTask, newStatus);
      toast.success("Task status updated");
      fetchTasks();
    } catch (err) {
      toast.error("Could not update task status");
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

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (task, deleteFuture) => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(taskToDelete.idTask, deleteFuture);
      toast.success("Task deleted");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      if (selectedTaskId === taskToDelete.idTask) {
        setIsDetailViewOpen(false);
        setSelectedTaskId(null);
      }
      fetchTasks();
    } catch (err) {
      toast.error("Error deleting task");
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
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.idUserAssigned) {
      toast.error("Please assign a user");
      return;
    }
    if (!formData.startDate) {
      toast.error("Date is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: formatDateToBackend(formData.startDate),
        endDate: formatDateToBackend(formData.startDate),
        idUserAssigned: Number(formData.idUserAssigned),
        idCompany: Number(companyId),
        status: formData.status,
        repeatType: formData.repeatType,
        repeatEndDate: formData.repeatEndDate
          ? formatDateToBackend(formData.repeatEndDate)
          : null,
        priority: formData.priority || "NORMAL",
      };

      await taskService.createTask(payload);
      toast.success("Task created");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        idUserAssigned: "",
        status: "PENDING",
        repeatType: "NONE",
        repeatEndDate: "",
        priority: "NORMAL",
      });
      fetchTasks();
    } catch (err) {
      toast.error("Error creating task");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "pending":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
      case "progress":
      case "in_progress":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      case "completed":
        return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20";
      case "block":
      case "blocked":
      default:
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA] overflow-x-auto">
          {[
            { id: "PENDING", name: "pending" },
            { id: "PROGRESS", name: "in progress" },
            { id: "BLOCK", name: "blocked" },
            { id: "COMPLETED", name: "completed" },
            { id: "ALL", name: "all" },
          ].map((tab) => (
            <button
              key={`tab-status-${tab.id}`}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 text-[12px] font-medium lowercase rounded-[8px] whitespace-nowrap transition-colors ${
                statusTab === tab.id
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>New task</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#E5E5EA] rounded-[12px] p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[160px]">
          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
            assigned operator
          </label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
          >
            <option value="">all operators</option>
            {users.map((u) => (
              <option key={`filter-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                {u.name || u.username}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 min-w-[130px]">
          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
            start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
          />
        </div>

        <div className="space-y-1 min-w-[130px]">
          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
            end date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
          />
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
            size={14}
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] py-1.5 pl-8 pr-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
          />
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={`task-card-${task.idTask}`}
              onClick={() => handleOpenTaskDetail(task.idTask)}
              className="bg-white border border-[#E5E5EA] rounded-[12px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#171717]/30 transition-colors cursor-pointer shadow-xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`border px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase ${getStatusColor(task.status)}`}
                  >
                    {task.status?.toLowerCase().replace("_", " ")}
                  </span>

                  {/* Flame rule: flame icon + red text only */}
                  {task.priority === "HIGH" && (
                    <span className="flex items-center gap-1 text-[#EF4444] text-[11px] font-medium lowercase">
                      <Flame size={13} strokeWidth={1.5} className="text-[#EF4444]" />
                      <span>high priority</span>
                    </span>
                  )}

                  {task.repeatType && task.repeatType !== "NONE" && (
                    <span className="bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] px-2 py-0.5 rounded-full text-[10px] font-medium lowercase flex items-center gap-1">
                      <Repeat size={10} strokeWidth={1.5} />
                      {task.repeatType.toLowerCase()}
                    </span>
                  )}

                  {task.externalReferenceName && (
                    <span className="text-[#AEAEB2] text-[11px] lowercase">
                      client: {task.externalReferenceName}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-[12.5px] text-[#6E6E73] mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-[#6E6E73]">
                  <span className="flex items-center gap-1">
                    <User size={13} strokeWidth={1.5} />
                    <span>{task.nameUser || "unassigned"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} strokeWidth={1.5} />
                    <span>{displayDate(task.startDate)}</span>
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
                  className="bg-[#FAFAFA] border border-[#E5E5EA] text-[11.5px] font-medium lowercase text-[#1C1C1E] rounded-[8px] px-2.5 py-1 outline-none cursor-pointer focus:border-[#171717]"
                >
                  <option value="PENDING">pending</option>
                  <option value="PROGRESS">in progress</option>
                  <option value="BLOCK">blocked</option>
                  <option value="COMPLETED">completed</option>
                </select>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(task)}
                    className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[12px] border border-[#E5E5EA] text-center">
          <p className="text-[13px] text-[#6E6E73]">
            No tasks found
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#E5E5EA] rounded-[12px] px-4 py-3">
          <div className="text-[12px] text-[#6E6E73] lowercase">
            page {page + 1} of {totalPages} ({totalElements} tasks)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="px-3 py-1 bg-white border border-[#E5E5EA] rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={page === totalPages - 1}
              className="px-3 py-1 bg-white border border-[#E5E5EA] rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* New task modal */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[14px] p-6 relative border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
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
                  placeholder="enter title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  rows="2"
                  placeholder="enter description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none"
                />
              </div>

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
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  recurrence
                </label>
                <select
                  value={formData.repeatType}
                  onChange={(e) =>
                    setFormData({ ...formData, repeatType: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  <option value="NONE">one time (no repeat)</option>
                  <option value="DAILY">daily</option>
                  <option value="WEEKLY">weekly</option>
                  <option value="MONTHLY">monthly</option>
                  <option value="QUARTERLY">quarterly</option>
                  <option value="YEARLY">yearly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "LOW", label: "low" },
                    { id: "NORMAL", label: "normal" },
                    { id: "HIGH", label: "high" },
                  ].map((p) => {
                    const isSelected = (formData.priority || "NORMAL") === p.id;
                    return (
                      <button
                        type="button"
                        key={`modal-priority-btn-${p.id}`}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                        className={`py-2 px-3 rounded-[8px] border text-center transition-colors text-[12px] font-medium lowercase flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? "border-[#171717] bg-[#171717] text-white"
                            : "bg-white border-[#E5E5EA] text-[#6E6E73] hover:text-[#1C1C1E]"
                        }`}
                      >
                        {p.id === "HIGH" && <Flame size={12} strokeWidth={1.5} className="text-[#EF4444]" />}
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  assigned operator *
                </label>
                <select
                  required
                  value={formData.idUserAssigned}
                  onChange={(e) =>
                    setFormData({ ...formData, idUserAssigned: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                >
                  <option value="">-- select user --</option>
                  {users.map((u) => (
                    <option key={`modal-user-${u.idUser || u.id}`} value={u.idUser || u.id}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail View */}
      <TaskDetailView
        isOpen={isDetailViewOpen}
        onClose={handleCloseTaskDetail}
        taskId={selectedTaskId}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Task Delete Confirmation Dialog */}
      <TaskDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        task={taskToDelete}
        isDeleting={isDeletingTask}
      />
    </div>
  );
};

export default CompanyTasks;
