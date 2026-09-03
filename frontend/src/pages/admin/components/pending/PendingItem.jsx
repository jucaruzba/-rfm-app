import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import {
  Eye,
  Activity,
  X,
  AlertCircle,
  ListTodo,
  User,
  FileText,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Users,
  ClipboardList,
  ChevronDown,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { pendingItemService } from "../../../../services/pendingItemService";
import { userService } from "../../../../services/userService";

// ==========================================
// STATUS COLOR CONFIG
// ==========================================
const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase();
  const colors = {
    pending: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
    in_progress: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    "in-progress": "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    completed: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
  };
  return (
    colors[statusLower] || "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20"
  );
};

// ==========================================
// STATUS OPTIONS FOR SELECTOR
// ==========================================
const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "pending",
    color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  },
  {
    value: "in_progress",
    label: "in progress",
    color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  },
  {
    value: "completed",
    label: "completed",
    color: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
  },
];

// ==========================================
// FORMAT FOR UI (lowercase badges)
// ==========================================
const formatStatusForUI = (status) => {
  const statusLower = status?.toLowerCase();
  const statusMap = {
    pending: "pending",
    in_progress: "in progress",
    "in-progress": "in progress",
    completed: "completed",
  };
  return statusMap[statusLower] || status?.toLowerCase() || "unknown";
};

// ==========================================
// STATUS DOT
// ==========================================
const StatusDot = ({ status }) => {
  const statusLower = status?.toLowerCase();
  const dotColors = {
    pending: "bg-[#EF4444]",
    in_progress: "bg-[#F59E0B]",
    "in-progress": "bg-[#F59E0B]",
    completed: "bg-[#10B981]",
  };
  const color = dotColors[statusLower] || "bg-[#6B7280]";
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} mr-1.5`} />
  );
};

const PendingItem = () => {
  const { user } = useAuth();

  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const [filters, setFilters] = useState({
    status: "",
    referenceType: "",
    viewType: "assigned",
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "",
    assignedTo: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const descriptionTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = "auto";
      descriptionTextareaRef.current.style.height = `${descriptionTextareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editForm.description]);

  const newDescriptionTextareaRef = useRef(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingPending, setCreatingPending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [newPendingForm, setNewPendingForm] = useState({
    title: "",
    description: "",
    status: "pending",
    assignedTo: "",
  });

  useEffect(() => {
    if (isCreateModalOpen && newDescriptionTextareaRef.current) {
      newDescriptionTextareaRef.current.style.height = "auto";
      newDescriptionTextareaRef.current.style.height = `${newDescriptionTextareaRef.current.scrollHeight}px`;
    }
  }, [isCreateModalOpen, newPendingForm.description]);

  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const isAdmin =
    user?.role?.toLowerCase() === "admin" || user?.role === "ADMIN";

  const fetchUsers = async () => {
    try {
      const usersData = await userService.findAll();
      setAllUsers(usersData || []);
    } catch (err) {
      console.error("Error loading users", err);
    }
  };

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const currentUserId = user.idUser || user.id;
      const queryFilters = {};
      if (filters.status) queryFilters.status = filters.status;
      if (filters.referenceType) queryFilters.referenceType = filters.referenceType;

      let data;
      if (filters.viewType === "assigned") {
        data = await pendingItemService.getByAssignedTo(
          currentUserId,
          page,
          pageSize,
          queryFilters,
        );
      } else {
        data = await pendingItemService.getByCreatedBy(
          currentUserId,
          page,
          pageSize,
          queryFilters,
        );
      }

      setPendingItems(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error("Error loading pending items", err);
      toast.error("Failed to load pending items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [user, page, filters.viewType, filters.status, filters.referenceType]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleViewTypeChange = (viewType) => {
    setFilters((prev) => ({ ...prev, viewType }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      referenceType: "",
      viewType: "assigned",
    });
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const getUserNameById = (userId) => {
    if (!userId) return "N/A";
    const foundUser = allUsers.find(
      (u) => (u.idUser || u.id) === Number(userId),
    );
    if (!foundUser) return `User #${userId}`;
    return (
      foundUser.name ||
      foundUser.username ||
      foundUser.email ||
      `User #${userId}`
    );
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      status: item.status || "pending",
      assignedTo: item.assignedTo || "",
    });
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditForm({
        title: selectedItem.title || "",
        description: selectedItem.description || "",
        status: selectedItem.status || "pending",
        assignedTo: selectedItem.assignedTo || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || "",
        status: editForm.status,
        createdBy: selectedItem.createdBy,
        assignedTo: editForm.assignedTo
          ? Number(editForm.assignedTo)
          : selectedItem.assignedTo,
        referenceType: selectedItem.referenceType,
        referenceId: selectedItem.referenceId,
      };

      await pendingItemService.update(selectedItem.idPending, payload);
      toast.success("Pending item updated");

      setPendingItems((prev) =>
        prev.map((item) =>
          item.idPending === selectedItem.idPending
            ? { ...item, ...payload }
            : item,
        ),
      );

      setSelectedItem((prev) => ({ ...prev, ...payload }));
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating pending item", err);
      toast.error("Failed to update pending item");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.idPending);
    try {
      await pendingItemService.delete(itemToDelete.idPending);
      toast.success("Pending item deleted");

      setPendingItems((prev) =>
        prev.filter((item) => item.idPending !== itemToDelete.idPending),
      );

      setIsDeleteModalOpen(false);
      setItemToDelete(null);

      if (selectedItem?.idPending === itemToDelete.idPending) {
        setIsViewModalOpen(false);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error deleting pending item", err);
      toast.error("Failed to delete pending item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };


  const handleCreatePending = async (e) => {
    e.preventDefault();
    if (!newPendingForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!newPendingForm.assignedTo) {
      toast.error("Please assign a user");
      return;
    }

    setCreatingPending(true);
    try {
      const payload = {
        title: newPendingForm.title.trim(),
        description: newPendingForm.description.trim() || "",
        status: newPendingForm.status,
        createdBy: user?.id || user?.idUser,
        assignedTo: Number(newPendingForm.assignedTo),
        referenceType: null,
        referenceId: null,
      };

      await pendingItemService.create(payload);
      toast.success("Pending item created");
      setNewPendingForm({
        title: "",
        description: "",
        status: "pending",
        assignedTo: "",
      });
      setIsCreateModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Error creating pending item", err);
      toast.error("Failed to create pending item");
    } finally {
      setCreatingPending(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const currentItem = pendingItems.find((item) => item.idPending === id);
    if (!currentItem) return;

    if (currentItem.status === newStatus) return;

    setUpdatingStatusId(id);
    try {
      const payload = {
        title: currentItem.title,
        description: currentItem.description || "",
        status: newStatus,
        createdBy: currentItem.createdBy,
        assignedTo: currentItem.assignedTo,
        referenceType: currentItem.referenceType,
        referenceId: currentItem.referenceId,
      };

      await pendingItemService.update(id, payload);
      toast.success(`Status updated`);

      setPendingItems((prev) =>
        prev.map((item) =>
          item.idPending === id ? { ...item, status: newStatus } : item,
        ),
      );

      if (selectedItem?.idPending === id) {
        setSelectedItem((prev) => ({ ...prev, status: newStatus }));
        setEditForm((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating status", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
            <button
              onClick={() => handleViewTypeChange("assigned")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                filters.viewType === "assigned"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <Users size={14} strokeWidth={1.5} />
              <span>Assigned to me</span>
            </button>
            <button
              onClick={() => handleViewTypeChange("created")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                filters.viewType === "created"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <ClipboardList size={14} strokeWidth={1.5} />
              <span>Created by me</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            className="p-1.5 bg-[#FAFAFA] text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New pending</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-[#E5E5EA] overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#6E6E73] text-[11px] font-medium lowercase border-b border-[#E5E5EA]">
                <th className="p-3.5">title</th>
                <th className="p-3.5">status</th>
                {filters.viewType === "created" && (
                  <th className="p-3.5">assigned to</th>
                )}
                <th className="p-3.5">date</th>
                <th className="p-3.5 text-center">actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {loading ? (
                <tr>
                  <td colSpan={filters.viewType === "created" ? 5 : 4} className="p-8 text-center text-[#AEAEB2]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-[#171717]" />
                      <span className="text-[13px]">Loading items...</span>
                    </div>
                  </td>
                </tr>
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={filters.viewType === "created" ? 5 : 4} className="p-8 text-center text-[#AEAEB2]">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle size={22} strokeWidth={1.5} className="text-[#AEAEB2]" />
                      <p className="text-[13px]">No pending items found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingItems.map((item) => (
                  <tr
                    key={item.idPending}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="p-3.5">
                      <p className="text-[13.5px] font-medium text-[#1C1C1E]">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[12px] text-[#6E6E73] mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5">
                      {filters.viewType === "assigned" ? (
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateStatus(item.idPending, e.target.value)
                          }
                          disabled={updatingStatusId === item.idPending}
                          className={`text-[11px] font-medium lowercase px-2.5 py-1 rounded-full border cursor-pointer ${getStatusColor(item.status)} outline-none`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center text-[11px] font-medium lowercase px-2.5 py-0.5 rounded-full border ${getStatusColor(item.status)}`}
                        >
                          <StatusDot status={item.status} />
                          {formatStatusForUI(item.status)}
                        </span>
                      )}
                      {updatingStatusId === item.idPending && (
                        <Loader2
                          size={12}
                          className="inline ml-2 animate-spin text-[#AEAEB2]"
                        />
                      )}
                    </td>
                    {filters.viewType === "created" && (
                      <td className="p-3.5 text-[12px] text-[#6E6E73]">
                        <div className="flex items-center gap-1.5">
                          <User size={13} strokeWidth={1.5} className="text-[#AEAEB2]" />
                          <span>{getUserNameById(item.assignedTo)}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-3.5 text-[12px] text-[#6E6E73]">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors cursor-pointer"
                          title="View details"
                        >
                          <Eye size={15} strokeWidth={1.5} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(item)}
                            disabled={deletingId === item.idPending}
                            className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete"
                          >
                            {deletingId === item.idPending ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} strokeWidth={1.5} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#E5E5EA] bg-[#FAFAFA]">
            <div className="text-[12px] text-[#6E6E73] lowercase">
              page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="p-1.5 text-[#6E6E73] hover:bg-white rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 text-[#6E6E73] hover:bg-white rounded-[6px] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Details / Edit */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#E5E5EA]">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                Pending Item
              </h3>
              <div className="flex items-center gap-1.5">
                {!isEditing ? (
                  <button
                    onClick={handleEditToggle}
                    className="text-[#6E6E73] hover:text-[#1C1C1E] p-1 rounded transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={15} strokeWidth={1.5} />
                  </button>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="text-[#6E6E73] hover:text-[#1C1C1E] p-1 rounded transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X size={15} strokeWidth={1.5} />
                  </button>
                )}
                {isAdmin && !isEditing && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleDeleteClick(selectedItem);
                    }}
                    className="text-[#AEAEB2] hover:text-[#EF4444] p-1 rounded transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="text-[#AEAEB2] hover:text-[#1C1C1E] p-1 rounded transition-colors cursor-pointer"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                  title *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                    placeholder="enter title..."
                  />
                ) : (
                  <p className="text-[13px] font-medium text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] p-2.5 rounded-[8px]">
                    {selectedItem.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                  description
                </label>
                {isEditing ? (
                  <textarea
                    ref={descriptionTextareaRef}
                    name="description"
                    value={editForm.description}
                    onChange={(e) => {
                      handleEditChange(e);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] resize-none overflow-hidden leading-relaxed"
                    placeholder="enter description..."
                  />
                ) : (
                  <div className="bg-[#FAFAFA] border border-[#E5E5EA] p-2.5 rounded-[8px]">
                    <p className="text-[13px] text-[#6E6E73] whitespace-pre-wrap break-words leading-relaxed">
                      {selectedItem.description || "no description provided"}
                    </p>
                  </div>
                )}
              </div>

              {/* Status & Assigned To in the same line */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                    status
                  </label>
                  {isEditing ? (
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className={`w-full text-[12px] font-medium lowercase px-2.5 py-1.5 rounded-[8px] border cursor-pointer ${getStatusColor(editForm.status)} outline-none h-[38px]`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] flex items-center h-[38px]">
                      <span
                        className={`inline-flex items-center text-[11px] font-medium lowercase px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedItem.status)}`}
                      >
                        <StatusDot status={selectedItem.status} />
                        {formatStatusForUI(selectedItem.status)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                    assigned to *
                  </label>
                  {isEditing ? (
                    <select
                      name="assignedTo"
                      value={editForm.assignedTo}
                      onChange={handleEditChange}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none cursor-pointer text-[12.5px] text-[#1C1C1E] truncate h-[38px]"
                    >
                      <option value="">-- Select user --</option>
                      {allUsers.map((u) => {
                        const currentId = u.idUser || u.id;
                        const currentUserId = user?.idUser || user?.id;
                        return (
                          <option
                            key={`edit-user-${currentId}`}
                            value={currentId}
                          >
                            {u.username || u.name}
                            {currentId === currentUserId && " (You)"}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p className="text-[12.5px] text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] p-2 rounded-[8px] flex items-center gap-1.5 truncate h-[38px]">
                      <Users size={13} strokeWidth={1.5} className="text-[#AEAEB2] shrink-0" />
                      <span className="truncate">{getUserNameById(selectedItem.assignedTo)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#E5E5EA] bg-[#FAFAFA]">
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-4 py-1.5 text-[12px] font-medium bg-[#171717] text-white hover:bg-[#2C2C2E] rounded-[8px] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {savingEdit ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} strokeWidth={1.5} />
                  )}
                  <span>Save changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Deletion Confirmation */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] p-6 space-y-4">
            <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
              Delete pending item
            </h3>
            <p className="text-[13px] text-[#6E6E73]">
              Are you sure you want to delete <span className="font-semibold text-[#1C1C1E]">"{itemToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
              <button
                onClick={handleCancelDelete}
                className="px-3.5 py-1.5 text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] rounded-[8px] hover:bg-[#FAFAFA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === itemToDelete.idPending}
                className="px-3.5 py-1.5 text-[12px] font-medium bg-[#EF4444] text-white hover:bg-[#DC2626] rounded-[8px] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletingId === itemToDelete.idPending ? "Deleting..." : "Delete item"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E5EA]">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">
                New pending
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewPendingForm({
                    title: "",
                    description: "",
                    status: "pending",
                    assignedTo: "",
                  });
                }}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreatePending} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                  title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="enter title..."
                  value={newPendingForm.title}
                  onChange={(e) =>
                    setNewPendingForm({
                      ...newPendingForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                  description
                </label>
                <textarea
                  ref={newDescriptionTextareaRef}
                  placeholder="enter description..."
                  value={newPendingForm.description}
                  onChange={(e) => {
                    setNewPendingForm({
                      ...newPendingForm,
                      description: e.target.value,
                    });
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[13px] text-[#1C1C1E] resize-none overflow-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                    status
                  </label>
                  <select
                    value={newPendingForm.status}
                    onChange={(e) =>
                      setNewPendingForm({
                        ...newPendingForm,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none cursor-pointer text-[13px] text-[#1C1C1E]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium lowercase text-[#6E6E73] mb-1">
                    assign to *
                  </label>
                  <select
                    required
                    value={newPendingForm.assignedTo}
                    onChange={(e) =>
                      setNewPendingForm({
                        ...newPendingForm,
                        assignedTo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none cursor-pointer text-[13px] text-[#1C1C1E]"
                  >
                    <option value="">-- Select user --</option>
                    {allUsers.map((u) => {
                      const currentId = u.idUser || u.id;
                      const currentUserId = user?.idUser || user?.id;
                      return (
                        <option
                          key={`create-user-${currentId}`}
                          value={currentId}
                        >
                          {u.username || u.name}
                          {currentId === currentUserId && " (You)"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewPendingForm({
                      title: "",
                      description: "",
                      status: "pending",
                      assignedTo: "",
                    });
                  }}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] rounded-[8px] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPending}
                  className="px-4 py-1.5 text-[12px] font-medium bg-[#171717] text-white hover:bg-[#2C2C2E] rounded-[8px] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {creatingPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingItem;
