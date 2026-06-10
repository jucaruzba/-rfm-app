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
  Eye,
} from "lucide-react";
import { getUsernameFromToken } from "../../../../utils/authUtils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import FileViewer from "../FileViewer";
import { activityService } from "../../../../services/activityService";
import { userService } from "../../../../services/userService";
import { nodeService } from "../../../../services/nodeService";
import ConfirmDialog from "../../../ui/ConfirmDialog"; // Ajusta la ruta según tu estructura

const ActivityDetailView = ({
  isOpen,
  onClose,
  activityId,
  onActivityUpdated,
}) => {
  const [activity, setActivity] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  
  // Estado para el modal de confirmación
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

  // 1. Cargar datos del usuario al abrir el componente
  useEffect(() => {
    if (isOpen) {
      const fetchUserData = async () => {
        try {
          const username = getUsernameFromToken();
          const user = await userService.getByUsername(username);
          setUserData(user);
        } catch (err) {
          console.error("Error fetching user data", err);
        }
      };
      fetchUserData();
    }
  }, [isOpen]);

  // 2. Cargar detalles de la actividad y comentarios
  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivityDetails();
      fetchComments();
    }
  }, [isOpen, activityId]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    try {
      const data = await activityService.getActivity(activityId);
      const formattedDate = format(
        parseISO(data.eventDate),
        "yyyy-MM-dd'T'HH:mm",
      );
      setActivity({ ...data, editDate: formattedDate });
      if (data.idNode) fetchNodes(data.idNode);
    } catch (err) {
      toast.error("Error loading activity details");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await activityService.getComments(activityId);
      setComments(
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
    } catch (err) {
      console.error("Comments error", err);
    }
  };

  const fetchNodes = async (idParent) => {
    try {
      const data = await activityService.getNodes(idParent);
      setNodes(data);
    } catch (err) {
      console.error("Nodes fetch error", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedPayload = {
        ...activity,
        title: activity.title,
        description: activity.description,
        eventDate: activity.editDate,
      };

      await activityService.updateActivity(activityId, updatedPayload);
      toast.success("Activity intelligence updated");
      setIsEditing(false);
      onActivityUpdated();
      fetchActivityDetails();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userData) return;
    setSendingComment(true);
    try {
      await activityService.createComment({
        content: newComment,
        idActivity: activityId,
        idUser: userData.id,
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      toast.error("Comment failed");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (idComment) => {
    if (!userData) return;
    try {
      await activityService.deleteComment(idComment, { idUser: userData.id });
      setComments(comments.filter((c) => c.idComment !== idComment));
      toast.success("Comment purged");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activity?.idNode) return;
    setUploading(true);
    
    const toastId = toast.loading("Uploading file...", { closeButton: true });
    
    try {
      await activityService.uploadNodeFile({
        file,
        idParent: activity.idNode,
        idCompany: activity.idCompany || 0,
        description: `Upload: ${file.name}`,
      });
      toast.success("Resource uploaded to NAS", { id: toastId, closeButton: true });
      fetchNodes(activity.idNode);
    } catch (err) {
      toast.error("Upload error", { id: toastId, closeButton: true });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Función para mostrar el diálogo de confirmación para eliminar archivo
  const handleDeleteFileClick = (node) => {
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

  // Función para eliminar el archivo usando nodeService
  const handleConfirmDeleteFile = async (idNode) => {
    setDeletingFile(idNode);
    
    const toastId = toast.loading("Deleting file from NAS...", { closeButton: true });
    
    try {
      await nodeService.deleteFile(idNode);
      
      toast.success("File deleted successfully", { id: toastId, closeButton: true });
      
      // Actualizar la lista localmente (eliminación optimista)
      setNodes(prevNodes => prevNodes.filter(node => node.idNode !== idNode));
      
      // Cerrar el modal
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Delete file error", err);
      toast.error("Failed to delete file", { id: toastId, closeButton: true });
    } finally {
      setDeletingFile(null);
    }
  };

  // Función para cerrar el diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleViewFile = (node) => {
    if (node.nodeType !== "FOLDER") {
      setSelectedFile(node);
    }
  };

  if (!isOpen || loading || !activity) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-[#001F3F]/30 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#F3F4F6] h-full w-full max-w-xl shadow-[-10px_0_50px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-right duration-500">
          {/* HEADER */}
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
            <div>
              <h2 className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mb-0.5 italic">
                Operational Intelligence
              </h2>
              <h1 className="text-xl font-black text-[#001F3F] uppercase italic tracking-tighter leading-none">
                Activity Detail
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
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest">
                          Activity Title
                        </label>
                        <input
                          className="text-2xl font-black text-[#001F3F] uppercase italic border-b-2 border-blue-600 outline-none w-full bg-blue-50/20 px-2 py-1"
                          value={activity.title}
                          onChange={(e) =>
                            setActivity({ ...activity, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase text-gray-400 tracking-widest italic flex items-center gap-1">
                          <Calendar size={10} /> Schedule / Postpone
                        </label>
                        <input
                          type="datetime-local"
                          className="text-sm font-black text-blue-600 border-b-2 border-blue-600 outline-none bg-blue-50/20 px-2 py-1 w-full"
                          value={activity.editDate}
                          onChange={(e) =>
                            setActivity({ ...activity, editDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-[#001F3F] uppercase italic tracking-tight leading-tight">
                        {activity.title}
                      </h3>
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase self-start">
                          <Clock size={12} strokeWidth={3} />{" "}
                          {format(parseISO(activity.eventDate), "HH:mm 'HRS'")}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <Calendar size={12} />{" "}
                          {format(
                            parseISO(activity.eventDate),
                            "EEEE, MMMM dd, yyyy",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={isEditing ? handleUpdate : () => setIsEditing(true)}
                  className={`p-3 rounded-2xl transition-all shadow-lg ${isEditing ? "bg-green-600 text-white" : "bg-[#001F3F] text-white"}`}
                >
                  {isEditing ? <Save size={20} /> : <Edit3 size={20} />}
                </button>
              </div>

              <div className="space-y-2 border-t border-gray-50 pt-6">
                <p className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                  <AlignLeft size={12} /> Narrative Analysis
                </p>
                {isEditing ? (
                  <textarea
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-xl p-4 text-[11px] font-medium h-32 outline-none transition-all resize-none"
                    value={activity.description}
                    onChange={(e) =>
                      setActivity({ ...activity, description: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                    {activity.description || "No tactical description."}
                  </p>
                )}
              </div>
            </div>

            {/* COMENTARIOS */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-6 flex flex-col h-[500px]">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
                <MessageSquare size={16} className="text-[#001F3F]" />
                <h4 className="text-[12px] font-black text-[#001F3F] uppercase tracking-[0.2em]">
                  Activity Comments
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scroll">
                {comments.map((comment) => (
                  <div
                    key={comment.idComment}
                    className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm text-white text-[10px] font-black"
                      style={{ backgroundColor: "#001F3F" }}
                    >
                      {comment.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-[#001F3F] uppercase italic">
                          {comment.username}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                            {format(
                              new Date(comment.createdAt),
                              "MMM dd yyyy HH:mm",
                            )}
                          </span>
                          {userData && comment.idUser === userData.id && (
                            <button
                              onClick={() =>
                                handleDeleteComment(comment.idComment)
                              }
                              className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#F9FAFB] p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-inner w-full">
                        <p className="text-[13px] text-gray-600 font-medium leading-relaxed break-words whitespace-pre-wrap overflow-hidden">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleAddComment}
                className="relative pt-4 border-t border-gray-50"
              >
                <input
                  type="text"
                  placeholder="Secure message..."
                  className="w-full bg-[#F9FAFB] border-2 border-transparent focus:border-[#001F3F] rounded-2xl px-5 py-4 text-[13px] font-bold outline-none pr-14 transition-all italic"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="absolute right-3 top-[26px] p-2 bg-[#001F3F] text-white rounded-xl active:scale-95 transition-transform"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* ARCHIVOS - ACTUALIZADO CON BOTÓN DE ELIMINAR */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2">
                  <Folder size={16} className="text-[#001F3F]" />
                  <h4 className="text-[15px] font-black text-[#001F3F] uppercase tracking-[0.2em]">
                    Linked Assets
                  </h4>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FilePlus size={16} />
                  )}
                  Attach Resource
                </button>
              </div>
              
              {nodes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  No files attached
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {nodes.map((node) => (
                    <div
                      key={node.idNode}
                      className="flex items-center justify-between p-5 bg-[#F9FAFB] border border-gray-100 rounded-[2rem] hover:border-blue-600 transition-all group"
                    >
                      <div 
                        className="flex items-center gap-5 flex-1 cursor-pointer"
                        onClick={() => handleViewFile(node)}
                      >
                        <FileText
                          size={20}
                          className="text-gray-300 group-hover:text-[#001F3F]"
                        />
                        <div>
                          <p className="text-[13px] font-black text-[#001F3F] uppercase tracking-tighter leading-none mb-1">
                            {node.name}
                          </p>
                          <p className="text-[9px] text-gray-300 font-bold uppercase">
                            {node.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewFile(node)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="View File"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFileClick(node)}
                          disabled={deletingFile === node.idNode}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Delete File"
                        >
                          {deletingFile === node.idNode ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FileViewer Modal */}
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
        isLoading={deletingFile === confirmDialog.itemId}
        type={confirmDialog.type}
      />
    </>
  );
};

export default ActivityDetailView;