import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  AlignLeft,
  Folder,
  FileText,
  Save,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  Edit3,
  Eye,
  Upload,
} from "lucide-react";
import { getUsernameFromToken } from "../../../../utils/authUtils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import FileViewer from "../FileViewer";
import { activityService } from "../../../../services/activityService";
import { userService } from "../../../../services/userService";
import ConfirmDialog from "../../../ui/ConfirmDialog";

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
        (data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
    } catch (err) {
      console.error("Comments error", err);
    }
  };

  const fetchNodes = async (idParent) => {
    try {
      const data = await activityService.getNodes(idParent);
      setNodes(data || []);
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
      toast.success("Activity updated");
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
      toast.error("Error sending comment");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (idComment) => {
    try {
      await activityService.deleteComment(idComment);
      toast.success("Comment deleted");
      fetchComments();
    } catch (err) {
      toast.error("Error deleting comment");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await activityService.uploadFile(
        activity.idNode,
        file,
        "Uploaded from activity details",
        activity.idCompany,
      );
      toast.success("File uploaded");
      fetchNodes(activity.idNode);
    } catch (err) {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFileClick = (file) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Delete file",
      message: `Are you sure you want to delete "${file.name}"?`,
      confirmText: "Delete",
      itemName: file.name,
      itemDescription: file.description || "",
      itemId: file.idNode,
      onConfirm: () => handleExecuteDeleteFile(file.idNode),
    });
  };

  const handleExecuteDeleteFile = async (idNode) => {
    setDeletingFile(idNode);
    try {
      await activityService.deleteFile(idNode);
      toast.success("File deleted");
      setNodes((prev) => prev.filter((node) => node.idNode !== idNode));
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error("Error deleting file");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FAFAFA] h-full w-full max-w-xl border-l border-[#E5E5EA] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex justify-between items-center bg-white shrink-0">
          <div>
            <h1 className="text-[17px] font-semibold text-[#1C1C1E]">
              Activity details
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors p-1"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
            </div>
          ) : activity ? (
            <>
              {/* Activity Info Card */}
              <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                            activity title
                          </label>
                          <input
                            className="text-[14px] font-medium text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] outline-none w-full bg-white px-3 py-1.5 focus:border-[#171717]"
                            value={activity.title}
                            onChange={(e) =>
                              setActivity({ ...activity, title: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                            event date & time
                          </label>
                          <input
                            type="datetime-local"
                            className="text-[13px] font-medium text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] outline-none bg-white px-3 py-1.5 w-full focus:border-[#171717]"
                            value={activity.editDate}
                            onChange={(e) =>
                              setActivity({ ...activity, editDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                          {activity.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#6E6E73]">
                          <span className="flex items-center gap-1 text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] px-2 py-0.5 rounded-full font-medium">
                            <Clock size={12} strokeWidth={1.5} />
                            <span>{format(parseISO(activity.eventDate), "HH:mm")}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} strokeWidth={1.5} className="text-[#AEAEB2]" />
                            <span>{format(parseISO(activity.eventDate), "MMMM dd, yyyy")}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={isEditing ? handleUpdate : () => setIsEditing(true)}
                    className={`p-2 rounded-[8px] transition-colors border cursor-pointer ${
                      isEditing
                        ? "bg-[#10B981] text-white border-transparent hover:bg-[#059669]"
                        : "bg-white text-[#6E6E73] border-[#E5E5EA] hover:text-[#1C1C1E] hover:bg-[#FAFAFA]"
                    }`}
                    title={isEditing ? "Save changes" : "Edit activity"}
                  >
                    {isEditing ? <Save size={15} strokeWidth={1.5} /> : <Edit3 size={15} strokeWidth={1.5} />}
                  </button>
                </div>

                <div className="space-y-1 border-t border-[#E5E5EA] pt-3">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    description
                  </label>
                  {isEditing ? (
                    <textarea
                      className="w-full bg-white border border-[#E5E5EA] focus:border-[#171717] rounded-[8px] p-3 text-[13px] text-[#1C1C1E] h-24 outline-none resize-none"
                      value={activity.description}
                      onChange={(e) =>
                        setActivity({ ...activity, description: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-[13px] text-[#6E6E73]">
                      {activity.description || "No description provided."}
                    </p>
                  )}
                </div>
              </div>

              {/* Linked Assets */}
              <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                  <div className="flex items-center gap-2">
                    <Folder size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                    <h4 className="text-[13px] font-semibold text-[#1C1C1E]">
                      Linked assets
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
                    className="flex items-center gap-1 text-[12px] font-medium text-[#1C1C1E] hover:text-[#171717] bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-1 rounded-[6px] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} strokeWidth={1.5} />
                    )}
                    <span>Upload file</span>
                  </button>
                </div>

                {nodes.length > 0 ? (
                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <div
                        key={node.idNode}
                        className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E5E5EA] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
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
                            onClick={() => handleDeleteFileClick(node)}
                            disabled={deletingFile === node.idNode}
                            className="p-1 text-[#AEAEB2] hover:text-[#EF4444] rounded cursor-pointer"
                            title="Delete file"
                          >
                            {deletingFile === node.idNode ? (
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
                  <p className="text-[12px] text-[#AEAEB2] text-center py-4">
                    No files attached
                  </p>
                )}
              </div>

              {/* Comments */}
              <div className="bg-white rounded-[12px] p-5 border border-[#E5E5EA] space-y-4 flex flex-col">
                <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
                  <MessageSquare size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
                  <h4 className="text-[13px] font-semibold text-[#1C1C1E]">
                    Comments
                  </h4>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div
                        key={comment.idComment}
                        className="group flex flex-col gap-1 p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA]"
                      >
                        <div className="flex justify-between items-center text-[11.5px]">
                          <span className="font-semibold text-[#1C1C1E]">
                            {comment.username}
                          </span>
                          <div className="flex items-center gap-2 text-[#AEAEB2]">
                            <span>
                              {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                            </span>
                            {userData && comment.idUser === userData.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.idComment)}
                                className="opacity-0 group-hover:opacity-100 text-[#AEAEB2] hover:text-[#EF4444] transition-opacity cursor-pointer"
                              >
                                <Trash2 size={11} strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[12.5px] text-[#6E6E73] whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-[#AEAEB2] text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-[#E5E5EA]">
                  <input
                    type="text"
                    placeholder="add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] px-3 py-2 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  />
                  <button
                    type="submit"
                    disabled={sendingComment || !newComment.trim()}
                    className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-3 py-2 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center cursor-pointer"
                  >
                    <Send size={13} strokeWidth={1.5} />
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* File Viewer */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Confirm Delete Dialog */}
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
    </div>
  );
};

export default ActivityDetailView;