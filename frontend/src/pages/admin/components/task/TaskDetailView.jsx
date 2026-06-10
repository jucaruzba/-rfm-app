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

const TaskDetailView = ({ isOpen, onClose, taskId, onTaskUpdated }) => {
  const { user: authUser } = useAuth();
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
      const updatedPayload = {
        title: task.title,
        description: task.description,
        startDate: formatDateToBackend(task.startDate),
        endDate: formatDateToBackend(task.endDate),
        idCompany: task.idCompany || null,
        externalReferenceName: task.externalReferenceName || null,
        idUserAssigned: task.idUserAssigned,
        status: task.status,
      };

      await taskService.updateTask(taskId, updatedPayload);
      toast.success("Task intelligence updated");
      setIsEditing(false);
      onTaskUpdated();
      fetchTaskDetails();
    } catch (err) {
      console.error("Update error", err);
      toast.error("Update failed");
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
    if (!dateArray) return "N/A";
    if (Array.isArray(dateArray)) {
      const [year, month, day] = dateArray;
      return `${day}/${month}/${year}`;
    }
    return dateArray;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!isOpen || loading || !task) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-[#001F3F]/30 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#F3F4F6] h-full w-full max-w-xl shadow-[-10px_0_50px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-right duration-500">
          {/* HEADER */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
            <div>
              <h2 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mb-0.5 italic">
                Task Management
              </h2>
              <h1 className="text-xl font-black text-[#001F3F] uppercase italic tracking-tighter leading-none">
                Task Detail
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-[#001F3F] transition-all"
            >
              <X size={26} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll space-y-6 p-8">
            {/* SECCIÓN INFORMACIÓN EDITABLE */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#001F3F]"></div>

              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-6">
                  {isEditing ? (
                    <div className="space-y-6 animate-in fade-in">
                      {/* TÍTULO */}
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                          Task Title
                        </label>
                        <input
                          className="text-2xl font-black text-[#001F3F] uppercase italic border-b-2 border-blue-600 outline-none w-full bg-blue-50/20 px-2 py-1"
                          value={task.title}
                          onChange={(e) =>
                            setTask({ ...task, title: e.target.value })
                          }
                        />
                      </div>

                      {/* USUARIO ASIGNADO */}
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                          <User size={10} className="inline mr-1" /> Assigned
                          Operator
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
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                        >
                          <option value="">-- Select Operator --</option>
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

                      {/* FECHAS */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                            Start Date
                          </label>
                          <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                            value={formatDateForInput(task.startDate)}
                            onChange={(e) =>
                              setTask({ ...task, startDate: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                            value={formatDateForInput(task.endDate)}
                            onChange={(e) =>
                              setTask({ ...task, endDate: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* EMPRESA O CLIENTE EXTERNO */}
                      <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#001F3F]/40 block">
                          Target Association (Exclusive Selection)
                        </span>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                            <Building2 size={10} className="inline mr-1" />{" "}
                            System Company
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
                            className="w-full bg-white border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer disabled:bg-gray-100/60 disabled:text-gray-400"
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

                        <div className="flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
                          - OR -
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                            <Briefcase size={10} className="inline mr-1" />{" "}
                            External Client Reference
                          </label>
                          <input
                            type="text"
                            disabled={!!task.idCompany}
                            placeholder={
                              task.idCompany
                                ? "Clear Company field to type here..."
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
                            className="w-full bg-white border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] disabled:bg-gray-100/60 disabled:text-gray-400 italic"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-[#001F3F] uppercase italic tracking-tight leading-tight">
                        {task.title}
                      </h3>
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 bg-gray-50 px-3 py-1 rounded-lg uppercase self-start">
                          <User size={12} strokeWidth={3} />{" "}
                          {task.nameUser || "Unassigned"}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Calendar size={12} /> {formatDate(task.startDate)} —{" "}
                          {formatDate(task.endDate)}
                        </span>
                        {task.nameCompany ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase self-start">
                            <Building2 size={12} /> {task.nameCompany}
                          </span>
                        ) : task.externalReferenceName ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg uppercase self-start">
                            <Briefcase size={12} /> {task.externalReferenceName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={isEditing ? handleUpdate : () => setIsEditing(true)}
                  className={`p-3 rounded-2xl transition-all shadow-lg ${
                    isEditing
                      ? "bg-green-600 text-white"
                      : "bg-[#001F3F] text-white"
                  }`}
                >
                  {isEditing ? <Save size={20} /> : <Edit3 size={20} />}
                </button>
              </div>

              <div className="space-y-2 border-t border-gray-50 pt-6">
                <p className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                  <AlignLeft size={12} /> Task Description
                </p>
                {isEditing ? (
                  <textarea
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl p-4 text-[11px] font-medium h-32 outline-none transition-all resize-none"
                    value={task.description || ""}
                    onChange={(e) =>
                      setTask({ ...task, description: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                    {task.description || "No task description provided."}
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-50 pt-6">
                <p className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                  <CheckCircle2 size={12} /> Task Status
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "PENDING",
                      label: "Pending",
                      icon: Clock,
                      color: "gray",
                    },
                    {
                      value: "PROGRESS",
                      label: "In Progress",
                      icon: PlayCircle,
                      color: "blue",
                    },
                    {
                      value: "BLOCK",
                      label: "Blocked",
                      icon: AlertCircle,
                      color: "red",
                    },
                    {
                      value: "COMPLETED",
                      label: "Completed",
                      icon: CheckCircle2,
                      color: "green",
                    },
                  ].map(({ value, label, icon: Icon, color }) => {
                    const colorMap = {
                      gray: "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
                      blue: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
                      red: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
                      green:
                        "border-green-200 bg-green-50 text-green-600 hover:bg-green-100",
                    };
                    const isActive = task.status === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleStatusChange(value)}
                        disabled={updatingStatus || isActive}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${
                          isActive
                            ? `${colorMap[color]} ring-2 ring-offset-2 ring-${color}-300`
                            : `${colorMap[color]} opacity-60 hover:opacity-100`
                        } disabled:opacity-50`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECCIÓN DE ARCHIVOS */}
            {task.idNode && (
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-[#001F3F]" />
                    <h4 className="text-[12px] font-black text-[#001F3F] uppercase tracking-[0.2em]">
                      Attached Files
                    </h4>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FilePlus size={16} />
                    )}
                    Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {nodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    No files attached
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nodes.map((node) => (
                      <div
                        key={node.idNode}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#001F3F] truncate">
                              {node.name}
                            </p>
                            {node.description && (
                              <p className="text-[9px] text-gray-400 truncate">
                                {node.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                          {/* Botón Ver */}
                          <button
                            onClick={() => handleViewFile(node)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                            title="View File"
                          >
                            <Eye size={14} />
                          </button>
                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleDeleteFileClick(node)}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                            title="Delete File"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN DE PENDIENTES */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#001F3F]" />
                  <h4 className="text-[12px] font-black text-[#001F3F] uppercase tracking-[0.2em]">
                    Pending Items
                  </h4>
                </div>
                <button
                  onClick={() =>
                    setIsCreatePendingModalOpen(!isCreatePendingModalOpen)
                  }
                  className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                  <Plus size={16} /> New Pending
                </button>
              </div>

              {/* Lista de pendientes existentes */}
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  No pending items for this task
                </div>
              ) : (
                <div className="space-y-3">
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
                        className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-black text-[#001F3F]">
                              {item.title}
                            </h5>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${getStatusColor(item.status)}`}
                          >
                            {item.status === "pending" && "Pending"}
                            {item.status === "in_progress" && "In Progress"}
                            {item.status === "completed" && "Completed"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1 text-[12px] text-gray-500">
                            <User size={10} />
                            <span className="font-medium">
                              Assigned to: {assignedToName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeletePendingClick(item)}
                            disabled={deletingPending === item.idPending}
                            className="p-1 hover:bg-red-100 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                            title="Delete Pending Item"
                          >
                            {deletingPending === item.idPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal para crear nuevo pendiente */}
              {isCreatePendingModalOpen && (
                <div className="space-y-4 animate-in fade-in pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                      Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pending item title..."
                      value={pendingFormData.title}
                      onChange={(e) =>
                        setPendingFormData({
                          ...pendingFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter description..."
                      value={pendingFormData.description}
                      onChange={(e) =>
                        setPendingFormData({
                          ...pendingFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                        Status
                      </label>
                      <select
                        value={pendingFormData.status}
                        onChange={(e) =>
                          setPendingFormData({
                            ...pendingFormData,
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                        Assign To *
                      </label>
                      <select
                        value={pendingFormData.assignedTo}
                        onChange={(e) =>
                          setPendingFormData({
                            ...pendingFormData,
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                      >
                        <option value="">-- Select User --</option>
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

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreatePending}
                      disabled={creatingPending}
                      className="flex-1 bg-green-600 text-white font-bold text-xs uppercase rounded-xl px-4 py-2.5 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingPending ? (
                        <Loader2 size={14} className="animate-spin mx-auto" />
                      ) : (
                        "Create Pending Item"
                      )}
                    </button>
                    <button
                      onClick={() => setIsCreatePendingModalOpen(false)}
                      className="flex-1 bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DE COMENTARIOS */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                <MessageSquare size={16} className="text-[#001F3F]" />
                <h4 className="text-[12px] font-black text-[#001F3F] uppercase tracking-[0.2em]">
                  Comments & Activity
                </h4>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    No comments yet
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.idComment} className="group relative">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-[#001F3F]">
                              {comment.userName || `${comment.username}`}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {comment.createdAt &&
                                format(
                                  parseISO(comment.createdAt),
                                  "dd/MM/yyyy HH:mm",
                                )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 break-words">
                            {comment.content}
                          </p>
                        </div>
                        {(userData?.id === comment.idUser ||
                          userData?.idUser === comment.idUser) && (
                          <button
                            onClick={() =>
                              handleDeleteComment(comment.idComment)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-lg text-red-600 shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleAddComment}
                className="flex gap-3 pt-4 border-t border-gray-100"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-2.5 outline-none focus:border-[#001F3F] text-xs font-medium"
                />
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="bg-[#001F3F] text-white p-2.5 rounded-xl hover:bg-[#001F3F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingComment ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
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

      {/* ConfirmDialog Componente Reutilizable */}
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
    </>
  );
};

export default TaskDetailView;