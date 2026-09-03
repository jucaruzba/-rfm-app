import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Folder,
  FileText,
  ChevronRight,
  Search,
  Plus,
  Download,
  Trash2,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
  LayoutGrid,
  Eye,
  Repeat,
  Tag,
  Home,
} from "lucide-react";
import { projectObjectService } from "../../../services/projectObjectService";
import { nodeService } from "../../../services/nodeService";
import FileViewer from "../../admin/components/FileViewer";
import { reminderService } from "../../../services/reminderService";
import { toast } from "sonner";
import { getUserIdFromToken } from "../../../utils/auth";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  format,
  parseISO,
  differenceInDays,
} from "date-fns";
import { es } from "date-fns/locale";

const ProjectObjectExplorer = () => {
  const { projectId } = useParams();

  const [objects, setObjects] = useState([]);
  const [currentObjectId, setCurrentObjectId] = useState(null);
  const [pathStack, setPathStack] = useState([
    {
      idObject: null,
      title: "Project Root",
      description: "Project root directory.",
      idNode: null,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [completingId, setCompletingId] = useState(null);
  const [deletingReminderId, setDeletingReminderId] = useState(null);

  // Modal para subir archivo
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [fileDesc, setFileDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  // Modal para crear objeto
  const [showCreateObject, setShowCreateObject] = useState(false);
  const [objectForm, setObjectForm] = useState({
    title: "",
    description: "",
  });
  const [creatingObject, setCreatingObject] = useState(false);

  // Modal para crear recordatorio
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "09:00",
    repeatType: "NONE",
    repeatEndDate: "",
  });

  // Modal de confirmación para eliminar
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

  const [deletingItem, setDeletingItem] = useState(null);

  // Cargar objetos raíz al montar
  useEffect(() => {
    loadRootObjects();
  }, [projectId]);

  const loadRootObjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const allObjects =
        await projectObjectService.getObjectsByProject(projectId);

      const rootObjects = allObjects.filter((obj) => obj.idParent === null);
      setObjects(rootObjects);
    } catch (err) {
      setError(
        `Error: ${err.response?.data?.message || "Failed to load project objects"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const loadObjectChildren = async (objectId) => {
    try {
      setLoading(true);
      const children = await projectObjectService.getObjectChildren(
        projectId,
        objectId,
      );
      setObjects(children);
      setError(null);
    } catch (err) {
      setError("Error loading elements");
      console.error("Children load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Navegar a un objeto
  const handleObjectClick = async (obj) => {
    setCurrentObjectId(obj.idObject);
    setPathStack([
      ...pathStack,
      {
        idObject: obj.idObject,
        title: obj.title,
        description: obj.description,
        idNode: obj.idNode,
      },
    ]);
    await loadObjectChildren(obj.idObject);
    await loadReminders(obj.idObject);
    if (obj.idNode) await loadNodes(obj.idNode);
    else setNodes([]);
  };

  const loadReminders = async (objectId) => {
    try {
      const data = await reminderService.getRemindersByObject(objectId);
      setReminders(data || []);
    } catch (err) {
      console.error("Error loading reminders:", err);
      setReminders([]);
    }
  };

  const loadNodes = async (nodeId) => {
    try {
      const children = await nodeService.getNodesByParent(nodeId);
      setNodes(children);
    } catch (err) {
      console.error("Error loading object files:", err);
      setNodes([]);
    }
  };

  const handleBack = async () => {
    if (pathStack.length > 1) {
      const newPath = pathStack.slice(0, -1);
      setPathStack(newPath);
      const parentObject = newPath[newPath.length - 1];
      setCurrentObjectId(parentObject.idObject);
      if (parentObject.idObject) {
        await loadObjectChildren(parentObject.idObject);
        await loadReminders(parentObject.idObject);
        if (parentObject.idNode) await loadNodes(parentObject.idNode);
        else setNodes([]);
      } else {
        await loadRootObjects();
        setNodes([]);
      }
    }
  };

  const goToPath = async (index) => {
    const newPath = pathStack.slice(0, index + 1);
    setPathStack(newPath);
    const targetObject = newPath[index];
    setCurrentObjectId(targetObject.idObject);

    if (targetObject.idObject) {
      await loadObjectChildren(targetObject.idObject);
      await loadReminders(targetObject.idObject);
      if (targetObject.idNode) await loadNodes(targetObject.idNode);
      else setNodes([]);
    } else {
      await loadRootObjects();
      setNodes([]);
    }
  };

  const handleCreateObject = async (e) => {
    e.preventDefault();
    if (!objectForm.title.trim()) return;

    try {
      setCreatingObject(true);
      const userId = await getUserIdFromToken();

      if (!userId) {
        toast.error("Could not identify user");
        return;
      }

      await projectObjectService.createObject(projectId, {
        title: objectForm.title,
        description: objectForm.description,
        idProject: projectId,
        createdBy: userId,
        idParent: currentObjectId,
      });
      setObjectForm({ title: "", description: "" });
      setShowCreateObject(false);
      if (currentObjectId) {
        await loadObjectChildren(currentObjectId);
      } else {
        await loadRootObjects();
      }
      toast.success("Object created successfully");
    } catch (err) {
      toast.error("Error creating object");
      console.error("Object creation error:", err);
    } finally {
      setCreatingObject(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const currentObj = pathStack[pathStack.length - 1];
    if (!currentObj?.idNode) {
      toast.error("This object does not have a configured file repository.");
      return;
    }

    try {
      setUploading(true);
      await nodeService.uploadFile(currentObj.idNode, uploadFile, fileDesc, 0);
      setUploadFile(null);
      setFileDesc("");
      setShowUpload(false);
      await loadNodes(currentObj.idNode);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error("Error uploading file");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // 🔥 ACTUALIZADO: Crear recordatorio con repetición
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.title.trim() || !reminderForm.reminderDate) return;

    try {
      setCreatingReminder(true);
      const userId = await getUserIdFromToken();

      if (!userId) {
        toast.error("Could not identify user");
        return;
      }

      const reminderDateTime = `${reminderForm.reminderDate}T${reminderForm.reminderTime}:00`;

      const reminderData = {
        title: reminderForm.title.trim(),
        description: reminderForm.description.trim() || null,
        reminderDate: reminderDateTime,
        idObject: currentObjectId,
        idUser: userId,
        repeatType: reminderForm.repeatType || "NONE",
        repeatEndDate: reminderForm.repeatEndDate
          ? `${reminderForm.repeatEndDate}T23:59:59`
          : null,
      };

      await reminderService.createReminder(reminderData);
      
      setReminderForm({
        title: "",
        description: "",
        reminderDate: "",
        reminderTime: "09:00",
        repeatType: "NONE",
        repeatEndDate: "",
      });
      setShowCreateReminder(false);
      await loadReminders(currentObjectId);
      toast.success("✨ Reminder created successfully");
    } catch (err) {
      toast.error("Error creating reminder");
      console.error("Reminder creation error:", err);
    } finally {
      setCreatingReminder(false);
    }
  };

  // 🔥 ACTUALIZADO: Marcar como completado
  const handleMarkReminderCompleted = async (reminderId) => {
    try {
      setCompletingId(reminderId);
      await reminderService.markAsCompleted(reminderId);
      await loadReminders(currentObjectId);
      toast.success("🎉 Task accomplished!");
    } catch (err) {
      toast.error("Error updating reminder");
    } finally {
      setCompletingId(null);
    }
  };

  // 🔥 NUEVO: Eliminar recordatorio con confirmación
  const handleDeleteReminderClick = (reminder) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete Reminder",
      message: reminder.repeatType !== "NONE"
        ? `This will delete ALL reminders in the recurring chain for "${reminder.title}"`
        : `Are you sure you want to delete the reminder "${reminder.title}"?`,
      confirmText: "Delete",
      itemName: reminder.title,
      itemDescription: reminder.repeatType !== "NONE" 
        ? `Recurring: ${reminder.repeatType} - This will delete all occurrences` 
        : "This reminder will be permanently deleted.",
      onConfirm: () => handleConfirmDeleteReminder(reminder.idReminder),
      itemId: reminder.idReminder,
    });
  };

  const handleConfirmDeleteReminder = async (reminderId) => {
    setDeletingReminderId(reminderId);
    try {
      await reminderService.deleteChain(reminderId);
      await loadReminders(currentObjectId);
      toast.success("🗑️ Reminder deleted");
    } catch (err) {
      toast.error("Failed to delete reminder");
    } finally {
      setDeletingReminderId(null);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Función para mostrar el diálogo de confirmación para eliminar archivo
  const handleDeleteFileClick = (node, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete File",
      message: `Are you sure you want to delete the file "${node.name}"?`,
      confirmText: "Delete File",
      itemName: node.name,
      itemDescription: node.description || "No description",
      onConfirm: () => handleConfirmDeleteFile(node.idNode),
      itemId: node.idNode,
    });
  };

  // Función para eliminar el archivo
  const handleConfirmDeleteFile = async (idNode) => {
    setDeletingItem(idNode);
    try {
      await nodeService.deleteFile(idNode);
      toast.success("File deleted successfully");
      setNodes(prevNodes => prevNodes.filter(node => node.idNode !== idNode));
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Delete file error", err);
      toast.error("Failed to delete file");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const filteredObjects = useMemo(() => {
    return objects.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [objects, searchTerm]);

  const getFileExt = (name) => {
    return name.split(".").pop().toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🔥 NUEVO: Función para obtener prioridad
  const getPriority = (date) => {
    const now = new Date();
    const daysDiff = differenceInDays(parseISO(date), now);
    if (daysDiff < 0)
      return {
        label: "Overdue",
        color: "bg-red-100 text-red-700 border-red-200",
      };
    if (daysDiff === 0)
      return {
        label: "Today",
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    if (daysDiff <= 3)
      return {
        label: "Soon",
        color: "bg-orange-100 text-orange-700 border-orange-200",
      };
    return {
      label: "Upcoming",
      color: "bg-green-100 text-green-700 border-green-200",
    };
  };

  // 🔥 NUEVO: Función para obtener label de repetición
  const getRepeatLabel = (repeatType) => {
    const labels = {
      NONE: "One time",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      YEARLY: "Yearly",
    };
    return labels[repeatType] || "One time";
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            <button
              onClick={() => goToPath(0)}
              className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors"
              title="Root directory"
            >
              <Home size={15} strokeWidth={1.5} />
            </button>

          <nav className="flex items-center gap-1 text-[13px] font-medium text-[#1C1C1E]">
            {pathStack.map((item, idx) => (
              <div key={item.idObject || idx} className="flex items-center">
                <button
                  onClick={() => goToPath(idx)}
                  className={`hover:text-[#1C1C1E] transition-colors cursor-pointer ${
                    idx === pathStack.length - 1
                      ? "text-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73]"
                  }`}
                >
                  {item.title}
                </button>
                {idx < pathStack.length - 1 && (
                  <ChevronRight size={14} strokeWidth={1.5} className="text-[#AEAEB2] mx-1" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateObject(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FAFAFA] text-[#1C1C1E] border border-[#E5E5EA] px-3.5 py-2 rounded-[10px] text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New object</span>
          </button>

          {currentObjectId && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Upload size={14} strokeWidth={1.5} />
              <span>Upload file</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
          size={15}
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Search objects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2.5 pl-9 pr-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] transition-all"
        />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-6 min-h-[400px]">
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[8px] p-3 flex items-center gap-2 mb-4">
            <AlertCircle size={16} strokeWidth={1.5} className="text-[#EF4444]" />
            <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="text-[#171717] animate-spin" size={24} strokeWidth={1.5} />
            <p className="text-[12px] text-[#AEAEB2]">Loading explorer...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column: Sub-objects & Files */}
            <div className="space-y-6">
              {/* Current Object Description */}
              {pathStack.length > 0 && pathStack[pathStack.length - 1]?.description && (
                <div className="p-4 bg-[#FAFAFA] rounded-[10px] border border-[#E5E5EA]">
                  <p className="text-[12.5px] text-[#6E6E73]">
                    {pathStack[pathStack.length - 1]?.description}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-[#1C1C1E]">
                  Sub-objects ({filteredObjects.length})
                </h3>

                {filteredObjects.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredObjects.map((obj) => (
                      <div
                        key={obj.idObject}
                        className="group flex flex-col items-center gap-2 p-3 rounded-[10px] border border-[#E5E5EA] hover:border-[#171717]/30 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                        onClick={() => handleObjectClick(obj)}
                      >
                        <div className="w-12 h-12 flex items-center justify-center rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E]">
                          <Folder size={24} strokeWidth={1.5} />
                        </div>

                        <div className="text-center w-full px-1">
                          <p className="text-[12px] font-medium text-[#1C1C1E] truncate">
                            {obj.title}
                          </p>
                          {obj.description && (
                            <p className="text-[10px] text-[#AEAEB2] truncate">
                              {obj.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#AEAEB2]">
                    <Folder size={28} strokeWidth={1.5} className="mx-auto mb-1 opacity-60" />
                    <p className="text-[12px]">
                      {searchTerm ? "No results found" : "No sub-objects"}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Files */}
              {currentObjectId && (
                <div className="pt-4 border-t border-[#E5E5EA] space-y-3">
                  <h3 className="text-[13px] font-semibold text-[#1C1C1E]">
                    Linked files ({nodes.length})
                  </h3>

                  {nodes.length > 0 ? (
                    <div className="space-y-2">
                      {nodes.map((node) => (
                        <div
                          key={node.idNode}
                          className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E5E5EA] hover:bg-[#FAFAFA] transition-colors"
                        >
                          <div
                            className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                            onClick={() => setSelectedFile(node)}
                          >
                            <FileText size={15} strokeWidth={1.5} className="text-[#AEAEB2] shrink-0" />
                            <span className="text-[12.5px] font-medium text-[#1C1C1E] truncate">
                              {node.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedFile(node)}
                              className="p-1 text-[#6E6E73] hover:text-[#1C1C1E] rounded cursor-pointer"
                              title="View file"
                            >
                              <Eye size={13} strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFileClick(node, e)}
                              disabled={deletingItem === node.idNode}
                              className="p-1 text-[#AEAEB2] hover:text-[#EF4444] rounded cursor-pointer"
                              title="Delete file"
                            >
                              {deletingItem === node.idNode ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} strokeWidth={1.5} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#AEAEB2] py-4 text-center">
                      No attached files
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right column: Reminders */}
            {currentObjectId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                  <div className="flex items-center gap-2">
                    <Bell size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                    <h3 className="text-[13px] font-semibold text-[#1C1C1E]">
                      Reminders ({reminders.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCreateReminder(true)}
                    className="flex items-center gap-1 text-[12px] font-medium text-[#171717] hover:underline cursor-pointer"
                  >
                    <Plus size={13} strokeWidth={1.5} />
                    <span>Add reminder</span>
                  </button>
                </div>

                {reminders.length > 0 ? (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                    {reminders.map((reminder) => {
                      const date = parseISO(reminder.reminderDate);
                      const isCompleted = reminder.isCompleted;

                      return (
                        <div
                          key={reminder.idReminder}
                          className={`p-3 rounded-[10px] border transition-colors ${
                            isCompleted
                              ? "bg-[#FAFAFA] border-[#E5E5EA] opacity-60"
                              : "bg-white border-[#E5E5EA] hover:border-[#171717]/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <p
                                className={`text-[13px] font-medium text-[#1C1C1E] ${
                                  isCompleted ? "line-through text-[#AEAEB2]" : ""
                                }`}
                              >
                                {reminder.title}
                              </p>

                              {reminder.description && (
                                <p className="text-[12px] text-[#6E6E73] line-clamp-2">
                                  {reminder.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#6E6E73]">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} strokeWidth={1.5} />
                                  <span>{format(date, "MMM dd, HH:mm")}</span>
                                </span>

                                {reminder.repeatType !== "NONE" && (
                                  <span className="flex items-center gap-0.5 text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] px-1.5 py-0.5 rounded-full lowercase text-[10px]">
                                    <Repeat size={10} strokeWidth={1.5} />
                                    {getRepeatLabel(reminder.repeatType).toLowerCase()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!isCompleted && (
                                <button
                                  onClick={() => handleMarkReminderCompleted(reminder.idReminder)}
                                  disabled={completingId === reminder.idReminder}
                                  className="p-1 text-[#AEAEB2] hover:text-[#10B981] rounded cursor-pointer"
                                  title="Mark as completed"
                                >
                                  {completingId === reminder.idReminder ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={14} strokeWidth={1.5} />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReminderClick(reminder)}
                                disabled={deletingReminderId === reminder.idReminder}
                                className="p-1 text-[#AEAEB2] hover:text-[#EF4444] rounded cursor-pointer"
                                title="Delete"
                              >
                                {deletingReminderId === reminder.idReminder ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Trash2 size={13} strokeWidth={1.5} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#AEAEB2] py-8 text-center">
                    No reminders
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: New Object */}
      {showCreateObject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-sm w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                New object
              </h3>
              <button
                onClick={() => setShowCreateObject(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateObject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  title *
                </label>
                <input
                  type="text"
                  placeholder="object title..."
                  value={objectForm.title}
                  onChange={(e) =>
                    setObjectForm({ ...objectForm, title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  placeholder="optional description..."
                  value={objectForm.description}
                  onChange={(e) =>
                    setObjectForm({ ...objectForm, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowCreateObject(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingObject}
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {creatingObject && <Loader2 size={13} className="animate-spin" />}
                  <span>Save object</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Resource */}
      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-sm w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                Upload file
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-3.5">
              <div className="border border-dashed border-[#E5E5EA] rounded-[10px] p-6 text-center hover:border-[#171717] transition-colors">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input-object"
                />
                <label htmlFor="file-input-object" className="cursor-pointer block">
                  <Upload size={24} strokeWidth={1.5} className="mx-auto mb-1 text-[#AEAEB2]" />
                  <p className="text-[12px] font-medium text-[#1C1C1E]">
                    {uploadFile ? uploadFile.name : "Select a file"}
                  </p>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  placeholder="optional description..."
                  value={fileDesc}
                  onChange={(e) => setFileDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] resize-none h-18"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {uploading && <Loader2 size={13} className="animate-spin" />}
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Reminder */}
      {showCreateReminder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                New reminder
              </h3>
              <button
                onClick={() => setShowCreateReminder(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  title *
                </label>
                <input
                  type="text"
                  placeholder="reminder title..."
                  value={reminderForm.title}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  placeholder="optional description..."
                  value={reminderForm.description}
                  onChange={(e) =>
                    setReminderForm({
                      ...reminderForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] resize-none h-18"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  date & time *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reminderForm.reminderDate}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        reminderDate: e.target.value,
                      })
                    }
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                    required
                  />
                  <input
                    type="time"
                    value={reminderForm.reminderTime}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        reminderTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  repeat
                </label>
                <select
                  value={reminderForm.repeatType}
                  onChange={(e) =>
                    setReminderForm({
                      ...reminderForm,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  <option value="NONE">one time</option>
                  <option value="DAILY">daily</option>
                  <option value="WEEKLY">weekly</option>
                  <option value="MONTHLY">monthly</option>
                  <option value="YEARLY">yearly</option>
                </select>
              </div>

              {reminderForm.repeatType !== "NONE" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    repeat until *
                  </label>
                  <input
                    type="date"
                    value={reminderForm.repeatEndDate}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        repeatEndDate: e.target.value,
                      })
                    }
                    min={reminderForm.reminderDate || format(new Date(), "yyyy-MM-dd")}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowCreateReminder(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingReminder}
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {creatingReminder && <Loader2 size={13} className="animate-spin" />}
                  <span>Save reminder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Viewer */}
      {selectedFile && (
        <FileViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        itemName={confirmDialog.itemName}
        itemDescription={confirmDialog.itemDescription}
        isLoading={deletingItem === confirmDialog.itemId || deletingReminderId === confirmDialog.itemId}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default ProjectObjectExplorer;