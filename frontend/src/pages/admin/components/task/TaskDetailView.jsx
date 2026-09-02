import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  AlignLeft,
  Folder,
  FileText,
  ExternalLink,
  Save,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  FilePlus,
  Edit3,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Plus,
  Paperclip,
  Download,
  Eye,
  Repeat,
  Flame,
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import FileViewer from "../FileViewer";
import { taskService } from "../../../../services/taskService";
import { userService } from "../../../../services/userService";
import { companyService } from "../../../../services/companyService";
import { pendingItemService } from "../../../../services/pendingItemService";
import { nodeService } from "../../../../services/nodeService";
import ConfirmDialog from "../../../ui/ConfirmDialog"; // Ajusta la ruta según tu estructura
import TaskDeleteDialog from "../../../../components/TaskDeleteDialog";
import {
  formatUsDate,
  formatUsTime,
  formatUsDateTime,
  formatDateToBackend,
  formatDateForInput,
} from "../../../../utils/dateUtils";

const TaskDetailView = ({ isOpen, onClose, taskId, onTaskUpdated }) => {
  const { user: authUser } = useAuth();
  const isAdmin =
    authUser?.role?.toLowerCase() === "admin" || authUser?.role === "ADMIN";

  const [task, setTask] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [comments, setComments] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isCreatePendingModalOpen, setIsCreatePendingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [pendingFormData, setPendingFormData] = useState({
    title: "",
    description: "",
    status: "pending",
    assignedTo: "",
  });
  const [creatingPending, setCreatingPending] = useState(false);
  const [deletingPending, setDeletingPending] = useState(null);
  const [updatingPending, setUpdatingPending] = useState(null);
  
  // Estado unificado para el modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "Delete",
    itemName: "",
    itemDescription: "",
    onConfirm: null,
    itemId: null,
  });

  const fileInputRef = useRef(null);

  // 1. Cargar datos del usuario y catálogos al abrir el componente
  useEffect(() => {
    if (isOpen) {
      setUserData(authUser);
      const fetchMetadata = async () => {
        try {
          const [companiesData, usersData] = await Promise.all([
            companyService.getCompanies(),
            userService.findAll(),
          ]);
          setCompanies(companiesData || []);
          setUsers(usersData || []);
        } catch (err) {
          console.error("Error fetching metadata", err);
        }
      };
      fetchMetadata();
    }
  }, [isOpen, authUser]);

  // 2. Cargar detalles de la tarea, comentarios, pendientes y nodos
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
      fetchComments();
      fetchPendingItems();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTask(taskId);
      setTask(data);
      if (data?.idNode) {
        fetchTaskNodes(data.idNode);
      } else {
        setNodes([]);
      }
    } catch (err) {
      console.error("Error loading task details", err);
      toast.error("Error loading task details");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await taskService.getTaskComments(taskId);
      setComments(
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
    } catch (err) {
      console.error("Comments error", err);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const data = await pendingItemService.getByReferenceId(taskId);
      setPendingItems(data || []);
    } catch (err) {
      console.error("Pending items error", err);
    }
  };

  const fetchTaskNodes = async (parentId) => {
    try {
      const data = await taskService.getTaskNodes(parentId);
      setNodes(data || []);
    } catch (err) {
      console.error("Nodes fetch error", err);
    }
  };

  const formatDateToBackend = (date) => {
    if (!date) return null;
    if (Array.isArray(date)) {
      const [year, month, day] = date;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
    if (typeof date === "string") {
      if (date.includes("-")) {
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
      }
      return date;
    }
    return date;
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    if (Array.isArray(date)) {
      const [year, month, day] = date;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    if (typeof date === "string") {
      if (date.includes("/")) {
        const [day, month, year] = date.split("/");
        return `${year}-${month}-${day}`;
      }
      return date;
    }
    return "";
  };

  const handleUpdate = async () => {
    try {
      const dateFormatted = formatDateToBackend(task.startDate);
      const updatedPayload = {
        title: task.title,
        description: task.description,
        startDate: dateFormatted,
        endDate: dateFormatted,
        idCompany: task.idCompany || null,
        externalReferenceName: task.externalReferenceName || null,
        idUserAssigned: task.idUserAssigned,
        status: task.status,
        repeatType: task.repeatType || "NONE",
        repeatEndDate: null,
        priority: task.priority || "NORMAL",
      };

      await taskService.updateTask(taskId, updatedPayload);
      toast.success("Task updated successfully");
      setIsEditing(false);
      onTaskUpdated();
      fetchTaskDetails();
    } catch (err) {
      console.error("Update error", err);
      toast.error("Update failed");
    }
  };

  const handleConfirmDeleteTask = async (taskToDelete, deleteFuture) => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(taskToDelete.idTask, deleteFuture);
      toast.success("Task deleted successfully");
      setIsDeleteModalOpen(false);
      onClose();
      if (onTaskUpdated) onTaskUpdated();
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await taskService.updateStatus(taskId, newStatus);
      setTask({ ...task, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      onTaskUpdated();
    } catch (err) {
      console.error("Status update error", err);
      toast.error("Status update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreatePending = async () => {
    if (!pendingFormData.title.trim() || !pendingFormData.assignedTo) {
      toast.error("Title and assigned user are required");
      return;
    }

    setCreatingPending(true);
    try {
      const payload = {
        title: pendingFormData.title,
        description: pendingFormData.description,
        status: pendingFormData.status,
        createdBy: userData?.id || userData?.idUser,
        assignedTo: Number(pendingFormData.assignedTo),
        referenceType: "task",
        referenceId: taskId,
      };

      await pendingItemService.create(payload);
      toast.success("Pending item created successfully");
      setPendingFormData({
        title: "",
        description: "",
        status: "pending",
        assignedTo: "",
      });
      setIsCreatePendingModalOpen(false);
      fetchPendingItems();
    } catch (err) {
      console.error("Create pending error", err);
      toast.error("Failed to create pending item");
    } finally {
      setCreatingPending(false);
    }
  };

  // Función para mostrar el diálogo de confirmación para eliminar pendiente
  const handleDeletePendingClick = (pendingItem) => {
    const assignedUser = users.find(
      (u) => (u.idUser || u.id) === pendingItem.assignedTo
    );
    const assignedToName = assignedUser?.name || assignedUser?.username || `User #${pendingItem.assignedTo}`;
    
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Pending Item",
      message: `Are you sure you want to delete the pending item "${pendingItem.title}"?`,
      confirmText: "Delete Pending",
      itemName: pendingItem.title,
      itemDescription: `Assigned to: ${assignedToName}`,
      onConfirm: () => handleConfirmDeletePending(pendingItem.idPending),
      itemId: pendingItem.idPending,
    });
  };

// Función para eliminar el pendiente
const handleConfirmDeletePending = async (id) => {
  setDeletingPending(id);
  try {
    await pendingItemService.delete(id);
    toast.success("Pending item deleted");
    
    // Actualizar la lista de pendientes eliminando el item localmente
    setPendingItems(prevItems => prevItems.filter(item => item.idPending !== id));
    
    // Cerrar el modal
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  } catch (err) {
    console.error("Delete pending error", err);
    toast.error("Failed to delete pending item");
  } finally {
    setDeletingPending(null);
  }
};
  // Función para mostrar el diálogo de confirmación para eliminar archivo
  const handleDeleteFileClick = (node) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete File",
      message: "Are you sure you want to delete this file?",
      confirmText: "Delete File",
      itemName: node.name,
      itemDescription: node.description,
      onConfirm: () => handleConfirmDeleteFile(node.idNode),
      itemId: node.idNode,
    });
  };

  // Función para eliminar el archivo usando nodeService
  const handleConfirmDeleteFile = async (idNode) => {
    setDeletingFile(idNode);
    try {
      await nodeService.deleteFile(idNode);
      toast.success("File deleted successfully");
      fetchTaskNodes(task.idNode);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    } catch (err) {
      console.error("Delete file error", err);
      toast.error("Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  // Función para cerrar el diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  const handleUpdatePendingStatus = async (id, newStatus) => {
    setUpdatingPending(id);
    try {
      await pendingItemService.updateStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchPendingItems();
    } catch (err) {
      console.error("Update pending status error", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingPending(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userData) return;
    setSendingComment(true);
    try {
      await taskService.createTaskComment({
        content: newComment,
        idTask: taskId,
        idUser: userData.id || userData.idUser,
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Comment creation error", err);
      toast.error("Comment failed");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (idComment) => {
    if (!userData) return;
    try {
      await taskService.deleteTaskComment(
        idComment,
        userData.id || userData.idUser,
      );
      setComments(comments.filter((c) => c.idComment !== idComment));
      toast.success("Comment purged");
    } catch (err) {
      console.error("Delete comment error", err);
      toast.error("Delete failed");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !task?.idNode) return;
    setUploading(true);
    try {
      await taskService.uploadTaskNodeFile({
        file,
        idParent: task.idNode,
        idCompany: task.idCompany || 0,
        description: `Upload: ${file.name}`,
      });
      toast.success("Resource uploaded to NAS");
      fetchTaskNodes(task.idNode);
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Upload error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleViewFile = (node) => {
    setSelectedFile(node);
  };

  const formatDate = (dateArray) => {
    return formatUsDate(dateArray);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
      case "in_progress":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
      case "completed":
        return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
    }
  };

  if (!isOpen || loading || !task) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-[#FAFAFA] h-full max-h-screen w-full max-w-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-l border-[#E5E5EA] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E5EA] flex justify-between items-center bg-white shrink-0 z-20">
            <h1 className="text-[17px] font-semibold text-[#1C1C1E]">
              Task details
            </h1>
            <button
              onClick={onClose}
              className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                          task title
                        </label>
                        <input
                          className="text-[16px] font-semibold text-[#1C1C1E] border border-[#E5E5EA] rounded-[10px] outline-none focus:border-[#171717] w-full bg-white px-3 py-2"
                          value={task.title}
                          onChange={(e) =>
                            setTask({ ...task, title: e.target.value })
                          }
                        />
                      </div>

                      {/* Operator */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                          assigned operator
                        </label>
                        <select
                          value={String(
                            task.idUserAssigned ?? task.idUser ?? "",
                          )}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTask({
                              ...task,
                              idUserAssigned: val ? Number(val) : null,
                              idUser: val ? Number(val) : null,
                            });
                          }}
                          className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                        >
                          <option value="">-- No operator assigned --</option>
                          {users &&
                            users.length > 0 &&
                            users.map((u) => {
                              const currentId = u.idUser || u.id;
                              return (
                                <option
                                  key={`edit-user-${currentId}`}
                                  value={String(currentId)}
                                >
                                  {u.name || u.username}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      {/* Date */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                          date
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                          value={formatDateForInput(task.startDate)}
                          onChange={(e) =>
                            setTask({
                              ...task,
                              startDate: e.target.value,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Recurrence */}
                      <div className="p-3 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] space-y-2">
                        <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                          repeat frequency
                        </label>
                        <select
                          value={task.repeatType || "NONE"}
                          onChange={(e) =>
                            setTask({ ...task, repeatType: e.target.value })
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
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                          priority
                        </label>
                        <select
                          value={task.priority || "NORMAL"}
                          onChange={(e) =>
                            setTask({ ...task, priority: e.target.value })
                          }
                          className="w-full bg-white border border-[#E5E5EA] rounded-[10px] px-3 py-2 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High priority</option>
                        </select>
                      </div>

                      {/* Company or External client */}
                      <div className="p-3 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                            company
                          </label>
                          <select
                            value={String(task.idCompany || "")}
                            disabled={!!task.externalReferenceName}
                            onChange={(e) =>
                              setTask({
                                ...task,
                                idCompany: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                                externalReferenceName: "",
                              })
                            }
                            className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer disabled:bg-gray-100 disabled:text-[#AEAEB2]"
                          >
                            <option value="">-- No corporate entity --</option>
                            {companies &&
                              companies.length > 0 &&
                              companies.map((c) => (
                                <option
                                  key={`edit-company-${c.idCompany}`}
                                  value={String(c.idCompany)}
                                >
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                            external client reference
                          </label>
                          <input
                            type="text"
                            disabled={!!task.idCompany}
                            placeholder={
                              task.idCompany
                                ? "Clear company field first"
                                : "Type external client reference..."
                            }
                            value={task.externalReferenceName || ""}
                            onChange={(e) =>
                              setTask({
                                ...task,
                                externalReferenceName: e.target.value,
                                idCompany: null,
                              })
                            }
                            className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] disabled:bg-gray-100 disabled:text-[#AEAEB2]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-[18px] font-semibold text-[#1C1C1E]">
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium lowercase text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full">
                          <User size={12} strokeWidth={1.5} />
                          <span>{task.nameUser || "unassigned"}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-medium lowercase text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full">
                          <Calendar size={12} strokeWidth={1.5} />
                          <span>{formatDate(task.startDate)}</span>
                        </span>
                        {task.nameCompany ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium lowercase text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full">
                            <Building2 size={12} strokeWidth={1.5} />
                            <span>{task.nameCompany}</span>
                          </span>
                        ) : task.externalReferenceName ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium lowercase text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full">
                            <Briefcase size={12} strokeWidth={1.5} />
                            <span>client: {task.externalReferenceName}</span>
                          </span>
                        ) : null}
                        {task.repeatType && task.repeatType !== "NONE" && (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium lowercase text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full">
                            <Repeat size={12} strokeWidth={1.5} />
                            <span>repeat: {task.repeatType.toLowerCase()}</span>
                          </span>
                        )}
                        {/* Priority: flame icon + #EF4444 text only, never a full badge */}
                        {task.priority === "HIGH" ? (
                          <span className="flex items-center gap-1 text-[#EF4444] text-[11px] font-medium lowercase">
                            <Flame size={14} strokeWidth={1.5} className="text-[#EF4444]" />
                            <span>high priority</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isAdmin && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[8px] transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  )}
                  <button
                    onClick={isEditing ? handleUpdate : () => setIsEditing(true)}
                    className={`p-2 rounded-[8px] transition-colors cursor-pointer ${
                      isEditing
                        ? "bg-[#10B981] text-white hover:bg-[#059669]"
                        : "bg-[#171717] text-white hover:bg-[#2C2C2E]"
                    }`}
                    title={isEditing ? "Save changes" : "Edit task"}
                  >
                    {isEditing ? <Save size={16} strokeWidth={1.5} /> : <Edit3 size={16} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-[#E5E5EA] pt-4">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                {isEditing ? (
                  <textarea
                    className="w-full bg-white border border-[#E5E5EA] rounded-[10px] p-3 text-[13px] text-[#1C1C1E] h-28 outline-none focus:border-[#171717] resize-y"
                    value={task.description || ""}
                    placeholder="Enter task description..."
                    onChange={(e) =>
                      setTask({ ...task, description: e.target.value })
                    }
                  />
                ) : (
                  <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3 text-[13px] text-[#1C1C1E] leading-relaxed whitespace-pre-wrap">
                    {task.description || "No task description provided."}
                  </div>
                )}
              </div>

              {/* Status Section */}
              <div className="space-y-2 border-t border-[#E5E5EA] pt-4">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "PENDING",
                      label: "pending",
                      icon: AlertCircle,
                      activeColor: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]",
                    },
                    {
                      value: "PROGRESS",
                      label: "in progress",
                      icon: PlayCircle,
                      activeColor: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]",
                    },
                    {
                      value: "BLOCK",
                      label: "blocked",
                      icon: AlertCircle,
                      activeColor: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]",
                    },
                    {
                      value: "COMPLETED",
                      label: "completed",
                      icon: CheckCircle2,
                      activeColor: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]",
                    },
                  ].map(({ value, label, icon: Icon, activeColor }) => {
                    const isActive = task.status === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleStatusChange(value)}
                        disabled={updatingStatus || isActive}
                        className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border text-[12px] font-medium lowercase transition-colors cursor-pointer ${
                          isActive
                            ? activeColor
                            : "bg-white border-[#E5E5EA] text-[#6E6E73] hover:bg-[#FAFAFA]"
                        } disabled:opacity-50`}
                      >
                        <Icon size={14} strokeWidth={1.5} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Attached Files Section */}
            {task.idNode && (
              <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                  <div className="flex items-center gap-2 text-[#1C1C1E]">
                    <Paperclip size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                    <h4 className="text-[13px] font-semibold">
                      Attached files
                    </h4>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-[#1C1C1E] hover:text-[#171717] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-1 rounded-[6px] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    ) : (
                      <FilePlus size={14} strokeWidth={1.5} />
                    )}
                    <span>Upload file</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {nodes.length === 0 ? (
                  <div className="text-center py-4 text-[#AEAEB2] text-[12px] lowercase">
                    no files attached
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <div
                        key={node.idNode}
                        className="flex items-center justify-between p-2.5 bg-[#FAFAFA] rounded-[8px] border border-[#E5E5EA]"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <FileText size={15} strokeWidth={1.5} className="text-[#6E6E73] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#1C1C1E] truncate">
                              {node.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewFile(node)}
                            className="p-1 hover:bg-white rounded text-[#6E6E73] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                            title="View file"
                          >
                            <Eye size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteFileClick(node)}
                            className="p-1 hover:bg-[#EF4444]/10 rounded text-[#AEAEB2] hover:text-[#EF4444] transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending Items Section */}
            <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <div className="flex items-center gap-2 text-[#1C1C1E]">
                  <AlertCircle size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                  <h4 className="text-[13px] font-semibold">
                    Pending items
                  </h4>
                </div>
                <button
                  onClick={() =>
                    setIsCreatePendingModalOpen(!isCreatePendingModalOpen)
                  }
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[#1C1C1E] hover:text-[#171717] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer"
                >
                  <Plus size={14} strokeWidth={1.5} />
                  <span>New pending item</span>
                </button>
              </div>

              {/* Pending List */}
              {pendingItems.length === 0 ? (
                <div className="text-center py-4 text-[#AEAEB2] text-[12px] lowercase">
                  no pending items for this task
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingItems.map((item) => {
                    const assignedUser = users.find(
                      (u) => (u.idUser || u.id) === item.assignedTo,
                    );
                    const assignedToName =
                      assignedUser?.name ||
                      assignedUser?.username ||
                      `User #${item.assignedTo}`;

                    return (
                      <div
                        key={item.idPending}
                        className="p-3 bg-[#FAFAFA] rounded-[8px] border border-[#E5E5EA] space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-[13px] font-semibold text-[#1C1C1E]">
                              {item.title}
                            </h5>
                            {item.description && (
                              <p className="text-[12px] text-[#6E6E73] mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-medium lowercase px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-[11px] text-[#6E6E73]">
                          <span>assigned to: {assignedToName}</span>
                          <button
                            onClick={() => handleDeletePendingClick(item)}
                            disabled={deletingPending === item.idPending}
                            className="p-1 hover:bg-[#EF4444]/10 rounded text-[#AEAEB2] hover:text-[#EF4444] transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete pending item"
                          >
                            {deletingPending === item.idPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create Pending Form */}
              {isCreatePendingModalOpen && (
                <div className="space-y-3 pt-3 border-t border-[#E5E5EA]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                      title *
                    </label>
                    <input
                      type="text"
                      placeholder="enter title..."
                      value={pendingFormData.title}
                      onChange={(e) =>
                        setPendingFormData({
                          ...pendingFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                      description
                    </label>
                    <textarea
                      placeholder="enter description..."
                      value={pendingFormData.description}
                      onChange={(e) =>
                        setPendingFormData({
                          ...pendingFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] h-16 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                        status
                      </label>
                      <select
                        value={pendingFormData.status}
                        onChange={(e) =>
                          setPendingFormData({
                            ...pendingFormData,
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#E5E5EA] rounded-[8px] px-2.5 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                      >
                        <option value="pending">pending</option>
                        <option value="in_progress">in progress</option>
                        <option value="completed">completed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                        assign to *
                      </label>
                      <select
                        value={pendingFormData.assignedTo}
                        onChange={(e) =>
                          setPendingFormData({
                            ...pendingFormData,
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#E5E5EA] rounded-[8px] px-2.5 py-1.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                      >
                        <option value="">-- Select user --</option>
                        {users &&
                          users.length > 0 &&
                          users.map((u) => {
                            const currentId = u.idUser || u.id;
                            return (
                              <option
                                key={`pending-user-${currentId}`}
                                value={String(currentId)}
                              >
                                {u.name || u.username}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreatePending}
                      disabled={creatingPending}
                      className="flex-1 bg-[#171717] hover:bg-[#2C2C2E] text-white font-medium text-[12px] rounded-[8px] px-3 py-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      {creatingPending ? (
                        <Loader2 size={13} className="animate-spin mx-auto" />
                      ) : (
                        "Create pending item"
                      )}
                    </button>
                    <button
                      onClick={() => setIsCreatePendingModalOpen(false)}
                      className="px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] text-[12px] font-medium rounded-[8px] hover:bg-[#F2F2F7] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
                <MessageSquare size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                <h4 className="text-[13px] font-semibold text-[#1C1C1E]">
                  Comments & activity
                </h4>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-4 text-[#AEAEB2] text-[12px] lowercase">
                    no comments yet
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.idComment} className="group relative">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] flex items-center justify-center shrink-0">
                          <User size={13} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-[#1C1C1E]">
                              {comment.userName || `${comment.username}`}
                            </span>
                            <span className="text-[10px] text-[#AEAEB2]">
                              {comment.createdAt &&
                                format(
                                  parseISO(comment.createdAt),
                                  "dd/MM/yyyy HH:mm",
                                )}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#6E6E73] mt-1 break-words">
                            {comment.content}
                          </p>
                        </div>
                        {(userData?.id === comment.idUser ||
                          userData?.idUser === comment.idUser) && (
                          <button
                            onClick={() =>
                              handleDeleteComment(comment.idComment)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#EF4444]/10 rounded text-[#AEAEB2] hover:text-[#EF4444] shrink-0 cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 size={12} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleAddComment}
                className="flex gap-2 pt-3 border-t border-[#E5E5EA]"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] focus:bg-white text-[13px] text-[#1C1C1E]"
                />
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="bg-[#171717] text-white p-2 rounded-[8px] hover:bg-[#2C2C2E] transition-colors disabled:opacity-50 cursor-pointer"
                  title="Send comment"
                >
                  {sendingComment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} strokeWidth={1.5} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* FileViewer Modal */}
      {selectedFile && (
        <FileViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}

      {/* ConfirmDialog Component */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        itemName={confirmDialog.itemName}
        itemDescription={confirmDialog.itemDescription}
        isLoading={
          (deletingFile === confirmDialog.itemId) || 
          (deletingPending === confirmDialog.itemId)
        }
        type={confirmDialog.type}
      />

      {/* Delete Task Confirmation Dialog (Admin Only) */}
      <TaskDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTask}
        task={task}
        isDeleting={isDeletingTask}
      />
    </>
  );
};

export default TaskDetailView;