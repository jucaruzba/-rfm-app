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
    <div className="h-full flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* BARRA SUPERIOR */}
      <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            disabled={pathStack.length <= 1}
            className="p-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all text-[#001F3F]"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>

          <nav className="flex items-center gap-1">
            {pathStack.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <button
                  onClick={() => goToPath(idx)}
                  className={`text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${
                    idx === pathStack.length - 1
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-400 hover:text-[#001F3F]"
                  }`}
                >
                  {item.title}
                </button>
                {idx < pathStack.length - 1 && (
                  <ChevronRight size={14} className="text-gray-200 mx-1" />
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-all"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border-none rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#001F3F] outline-none w-64 focus:ring-2 ring-blue-500/10 transition-all"
            />
          </div>

          <button
            onClick={() => setShowCreateObject(true)}
            className="bg-[#001F3F] text-white p-3 rounded-2xl hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-1">
              New Object
            </span>
          </button>

          {currentObjectId && (
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Upload size={18} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest pr-1">
                Upload File
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE CONTENIDO - GRID DE OBJETOS */}
      <div className="flex-1 overflow-y-auto p-10 custom-scroll bg-[#FDFDFD]">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              Loading...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUMNA IZQUIERDA: OBJETOS */}
            <div className="space-y-6">
              {/* INFO OBJETO ACTUAL */}
              {pathStack.length > 0 && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100/20 shadow-sm animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Folder className="text-blue-600" size={24} />
                    <h2 className="text-xl font-black text-[#001F3F] uppercase italic tracking-tighter">
                      {pathStack[pathStack.length - 1]?.title}
                    </h2>
                  </div>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic ml-9 uppercase tracking-wider">
                    {pathStack[pathStack.length - 1]?.description ||
                      "No operational description provided."}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-[#001F3F] tracking-widest flex items-center gap-2">
                  <LayoutGrid size={16} className="text-gray-400" /> Sub-Objects
                  ({filteredObjects.length})
                </h3>
              </div>

              {filteredObjects.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredObjects.map((obj) => (
                    <div
                      key={obj.idObject}
                      className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 border border-transparent hover:border-gray-50 cursor-pointer"
                      onClick={() => handleObjectClick(obj)}
                    >
                      <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-500 group-hover:scale-110">
                        <Folder
                          size={40}
                          fill="currentColor"
                          fillOpacity={0.15}
                        />
                      </div>

                      <div className="text-center w-full px-2">
                        <p className="text-[10px] font-black text-[#001F3F] uppercase italic truncate tracking-tight mb-1">
                          {obj.title}
                        </p>
                        {obj.description && (
                          <p className="text-[8px] text-gray-400 truncate">
                            {obj.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-20">
                  <Folder size={48} strokeWidth={1} />
                  <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">
                    {searchTerm ? "No results found" : "No objects found"}
                  </p>
                </div>
              )}

              {/* EXPLORADOR DE ARCHIVOS */}
              {currentObjectId && (
                <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
                  <h3 className="text-sm font-black uppercase text-[#001F3F] tracking-widest flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" /> Linked
                    Resources ({nodes.length})
                  </h3>
                  {nodes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {nodes.map((node) => (
                        <div
                          key={node.idNode}
                          className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-50"
                        >
                          <div 
                            className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-transform group-hover:scale-105 cursor-pointer"
                            onClick={() => setSelectedFile(node)}
                          >
                            <FileText size={32} strokeWidth={1.5} />
                            <span className="absolute -bottom-1 -right-1 bg-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm border border-gray-100 uppercase">
                              {getFileExt(node.name)}
                            </span>
                          </div>
                          <p className="text-[9px] font-black text-[#001F3F] uppercase italic truncate w-full text-center">
                            {node.name}
                          </p>
                          
                          <button
                            onClick={(e) => handleDeleteFileClick(node, e)}
                            disabled={deletingItem === node.idNode}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50"
                            title="Delete file"
                          >
                            {deletingItem === node.idNode ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center opacity-10">
                      <FileText size={32} className="mx-auto" />
                      <p className="text-[8px] font-black uppercase mt-2">
                        No attached files
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: RECORDATORIOS ACTUALIZADOS */}
            {currentObjectId && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase text-[#001F3F] flex items-center gap-2">
                      <Bell size={18} className="text-blue-600" />
                      Reminders ({reminders.length})
                    </h3>
                    <button
                      onClick={() => setShowCreateReminder(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>

                  {reminders.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {reminders.map((reminder) => {
                        const priority = getPriority(reminder.reminderDate);
                        const date = parseISO(reminder.reminderDate);
                        const isCompleted = reminder.isCompleted;
                        
                        return (
                          <div
                            key={reminder.idReminder}
                            className={`group relative p-4 rounded-xl border-2 transition-all ${
                              isCompleted
                                ? "bg-gray-50 border-gray-200 opacity-60"
                                : `bg-white border-gray-200 hover:border-blue-300 hover:shadow-md`
                            }`}
                          >
                            {!isCompleted && (
                              <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${priority.color.split(" ")[0]}`} />
                            )}

                            <div className={`flex items-start gap-3 ${!isCompleted ? "pl-3" : ""}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      isCompleted ? "bg-gray-400" : "bg-blue-500"
                                    }`}
                                  />
                                  <p className={`text-[13px] font-black uppercase tracking-wider text-[#001F3F] ${
                                    isCompleted ? "line-through opacity-50" : ""
                                  }`}>
                                    {reminder.title}
                                  </p>
                                </div>

                                {reminder.description && (
                                  <p className={`text-[11px] text-gray-500 font-medium mt-1 ${
                                    isCompleted ? "line-through opacity-50" : ""
                                  }`}>
                                    {reminder.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {/* Badge de prioridad */}
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider border ${priority.color}`}>
                                    <span className={`w-1 h-1 rounded-full ${
                                      priority.label === "Overdue" ? "bg-red-500" :
                                      priority.label === "Today" ? "bg-blue-500" :
                                      priority.label === "Soon" ? "bg-orange-500" : "bg-green-500"
                                    }`} />
                                    {priority.label}
                                  </span>

                                  {/* Badge de hora */}
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[7px] font-black text-gray-600 uppercase tracking-wider">
                                    <Clock size={10} />
                                    {format(date, "HH:mm")}
                                  </span>

                                  {/* Badge de repetición */}
                                  {reminder.repeatType !== "NONE" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full text-[7px] font-black text-purple-700 uppercase tracking-wider">
                                      <Repeat size={10} />
                                      {getRepeatLabel(reminder.repeatType)}
                                    </span>
                                  )}

                                  {reminder.objectTitle && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[7px] font-black text-blue-600 uppercase tracking-wider">
                                      <Tag size={10} />
                                      {reminder.objectTitle}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Acciones */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!isCompleted && (
                                  <button
                                    onClick={() => handleMarkReminderCompleted(reminder.idReminder)}
                                    disabled={completingId === reminder.idReminder}
                                    className="p-2 text-gray-400 hover:text-green-600 transition-all rounded-lg hover:bg-green-50 disabled:opacity-50"
                                    title="Mark as completed"
                                  >
                                    {completingId === reminder.idReminder ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <CheckCircle2 size={16} />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteReminderClick(reminder)}
                                  disabled={deletingReminderId === reminder.idReminder}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50 disabled:opacity-50"
                                  title="Delete"
                                >
                                  {deletingReminderId === reminder.idReminder ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isCompleted && (
                              <div className="absolute top-2 right-2">
                                <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  ✓ Done
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-[9px] font-bold uppercase">
                        No reminders
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL - CREAR OBJETO */}
      {showCreateObject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">
                New Object
              </h3>
              <button
                onClick={() => setShowCreateObject(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateObject} className="space-y-4">
              <input
                type="text"
                placeholder="Object title"
                value={objectForm.title}
                onChange={(e) =>
                  setObjectForm({ ...objectForm, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={objectForm.description}
                onChange={(e) =>
                  setObjectForm({ ...objectForm, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F] resize-none h-24"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateObject(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingObject}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingObject ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - SUBIR ARCHIVO */}
      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">
                Upload Resource
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-all">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    {uploadFile
                      ? uploadFile.name
                      : "Seleccionar archivo técnico"}
                  </p>
                </label>
              </div>

              <textarea
                placeholder="Descripción del recurso (opcional)"
                value={fileDesc}
                onChange={(e) => setFileDesc(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F] resize-none h-20"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 MODAL - CREAR RECORDATORIO ACTUALIZADO CON REPETICIÓN */}
      {showCreateReminder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">
                New Reminder
              </h3>
              <button
                onClick={() => setShowCreateReminder(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Reminder title"
                  value={reminderForm.title}
                  onChange={(e) =>
                    setReminderForm({ ...reminderForm, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Description (optional)"
                  value={reminderForm.description}
                  onChange={(e) =>
                    setReminderForm({
                      ...reminderForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F] resize-none h-20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-1.5">
                  Date & Time *
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-1.5">
                  Repeat
                </label>
                <select
                  value={reminderForm.repeatType}
                  onChange={(e) =>
                    setReminderForm({
                      ...reminderForm,
                      repeatType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                >
                  <option value="NONE">One time</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              {reminderForm.repeatType !== "NONE" && (
                <div>
                  <label className="block text-[10px] font-black text-[#001F3F] uppercase tracking-wider mb-1.5">
                    Repeat Until *
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateReminder(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingReminder}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingReminder ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISUALIZADOR DE ARCHIVOS */}
      {selectedFile && (
        <FileViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}

      {/* ConfirmDialog Reutilizable */}
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #001F3F; }
      `,
        }}
      />
    </div>
  );
};

export default ProjectObjectExplorer;