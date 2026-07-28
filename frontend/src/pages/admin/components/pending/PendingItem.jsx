import { useState, useEffect } from "react";
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
  ExternalLink,
  Plus,
  Loader2,
  Users,
  ClipboardList,
  ChevronDown,
  Pencil,
  Save,
  Trash2, // Añadir este icono
} from "lucide-react";
import { toast } from "sonner";
import { pendingItemService } from "../../../../services/pendingItemService";
import { userService } from "../../../../services/userService";
import TaskDetailView from "../task/TaskDetailView";

// ==========================================
// COLORES DE SEMÁFORO 🚥
// ==========================================
const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase();
  const colors = {
    pending: "bg-red-100 text-red-700 border border-red-200",
    in_progress: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    "in-progress": "bg-yellow-100 text-yellow-700 border border-yellow-200",
    completed: "bg-green-100 text-green-700 border border-green-200",
  };
  return (
    colors[statusLower] || "bg-gray-100 text-gray-700 border border-gray-200"
  );
};

// ==========================================
// COLORES DE SEMÁFORO PARA SELECTOR
// ==========================================
const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color:
      "bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200",
  },
  {
    value: "completed",
    label: "Completed",
    color:
      "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200",
  },
];

// ==========================================
// FORMATO PARA UI
// ==========================================
const formatStatusForUI = (status) => {
  const statusLower = status?.toLowerCase();
  const statusMap = {
    pending: "PENDING",
    in_progress: "IN PROGRESS",
    "in-progress": "IN PROGRESS",
    completed: "COMPLETED",
  };
  return statusMap[statusLower] || status?.toUpperCase() || "UNKNOWN";
};

// ==========================================
// INDICADOR DE SEMÁFORO
// ==========================================
const StatusDot = ({ status }) => {
  const statusLower = status?.toLowerCase();
  const dotColors = {
    pending: "bg-red-500",
    in_progress: "bg-yellow-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
  };
  const color = dotColors[statusLower] || "bg-gray-500";
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />
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

  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingPending, setCreatingPending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [newPendingForm, setNewPendingForm] = useState({
    title: "",
    description: "",
    status: "pending",
    assignedTo: "",
  });

  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Nuevo estado para el delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal de confirmación
  const [itemToDelete, setItemToDelete] = useState(null);

  // ==========================================
  // VERIFICAR SI ES ADMIN
  // ==========================================
  const isAdmin =
    user?.role?.toLowerCase() === "admin" || user?.role === "ADMIN";

  // ==========================================
  // OBTENER DATOS DE LA TABLA
  // ==========================================
  const fetchItems = async () => {
    if (!user?.idUser && !user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const userId = user?.idUser || user?.id;
      const requestFilters = {
        ...(filters.viewType === "assigned" && { assignedTo: userId }),
        ...(filters.viewType === "created" && { createdBy: userId }),
        ...(filters.status && { status: filters.status.toLowerCase() }),
        ...(filters.referenceType && { referenceType: filters.referenceType }),
      };

      const response = await pendingItemService.getFilters(
        page,
        pageSize,
        requestFilters,
      );

      setPendingItems(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("Error fetching pending items", error);
      toast.error("Failed to load pending items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.idUser || user?.id) {
      fetchItems();
    }
  }, [user, page, filters]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.findAll();
        setAllUsers(users || []);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    fetchUsers();
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================
  const getUserNameById = (userId) => {
    if (!userId) return "N/A";
    if (
      typeof userId === "string" &&
      (userId.includes("@") || userId.length > 10)
    ) {
      return userId;
    }
    const userFound = allUsers.find(
      (u) => (u.idUser || u.id) === Number(userId),
    );
    return userFound?.username || userFound?.name || `User ${userId}`;
  };

  // ==========================================
  // HANDLERS
  // ==========================================
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
      viewType: filters.viewType,
    });
    setPage(0);
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title,
      description: item.description || "",
      status: item.status,
      assignedTo: item.assignedTo,
    });
    setIsEditing(false);
    setIsViewModalOpen(true);
  };

  // ==========================================
  // HANDLERS DE ELIMINACIÓN
  // ==========================================
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.idPending);
    try {
      await pendingItemService.delete(itemToDelete.idPending);
      toast.success("Pending item deleted successfully");

      // Cerrar modales si están abiertos
      setIsDeleteModalOpen(false);
      if (isViewModalOpen) {
        setIsViewModalOpen(false);
        setIsEditing(false);
      }

      // Refrescar la lista
      fetchItems();
    } catch (error) {
      console.error("Delete error", error);
      toast.error("Failed to delete pending item");
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // ==========================================
  // HANDLERS DE EDICIÓN
  // ==========================================
  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        title: selectedItem.title,
        description: selectedItem.description || "",
        status: selectedItem.status,
        assignedTo: selectedItem.assignedTo,
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
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        createdBy: selectedItem.createdBy,
        assignedTo: Number(editForm.assignedTo),
        referenceType: selectedItem.referenceType,
        referenceId: selectedItem.referenceId,
      };

      await pendingItemService.update(selectedItem.idPending, payload);
      toast.success("Pending item updated successfully");

      setSelectedItem((prev) => ({
        ...prev,
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        assignedTo: Number(editForm.assignedTo),
      }));

      setIsEditing(false);
      fetchItems();
    } catch (err) {
      console.error("Update error", err);
      toast.error("Failed to update pending item");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleShowTask = () => {
    if (
      selectedItem?.referenceType?.toLowerCase() === "task" &&
      selectedItem?.referenceId
    ) {
      setSelectedTaskId(selectedItem.referenceId);
      setIsDetailViewOpen(true);
    }
  };

  const handleCloseTaskDetail = () => {
    setIsDetailViewOpen(false);
    setSelectedTaskId(null);
  };

  const handleTaskUpdated = () => {
    fetchItems();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleCreatePending = async () => {
    if (!newPendingForm.title.trim() || !newPendingForm.assignedTo) {
      toast.error("Title and assigned user are required");
      return;
    }

    setCreatingPending(true);
    try {
      const payload = {
        title: newPendingForm.title,
        description: newPendingForm.description,
        status: newPendingForm.status,
        createdBy: user?.id || user?.idUser,
        assignedTo: Number(newPendingForm.assignedTo),
      };

      await pendingItemService.create(payload);
      toast.success("Pending item created successfully");
      setNewPendingForm({
        title: "",
        description: "",
        status: "pending",
        assignedTo: "",
      });
      setIsCreateModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error("Create pending error", err);
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
      toast.success(`Status updated to ${newStatus.toUpperCase()}`);

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
      console.error("Update status error", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ==========================================
  // COMPONENTE VISUAL
  // ==========================================
  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-[#001F3F] tracking-tight flex items-center gap-2">
            <ListTodo className="text-blue-500" /> Pending Items
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {filters.viewType === "assigned"
              ? `Assigned to you (${totalElements} total)`
              : `Created by you (${totalElements} total)`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Plus size={16} /> Create Pending
          </button>
          <button
            onClick={fetchItems}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* TOGGLES Y FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2 mb-4 border-b border-gray-100 pb-4">
          <button
            onClick={() => handleViewTypeChange("assigned")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filters.viewType === "assigned"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Users size={16} />
            Assigned to Me
          </button>
          <button
            onClick={() => handleViewTypeChange("created")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filters.viewType === "created"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ClipboardList size={16} />
            Created by Me
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">🔴 Pending</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="completed">🟢 Completed</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Reference Type
            </label>
            <select
              name="referenceType"
              value={filters.referenceType}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
            >
              <option value="">All Types</option>
              <option value="task">Task</option>
              <option value="activity">Activity</option>
            </select>
          </div>

          {(filters.status || filters.referenceType) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE PENDIENTES */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">
                  {filters.viewType === "assigned"
                    ? "Created By"
                    : "Assigned To"}
                </th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Activity size={20} className="animate-spin" />
                      Loading items...
                    </div>
                  </td>
                </tr>
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={24} className="text-gray-400" />
                      <p>No pending items found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingItems.map((item) => (
                  <tr
                    key={item.idPending}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="p-4">
                      <p className="text-sm font-semibold text-[#001F3F]">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                        {item.referenceType || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      {filters.viewType === "assigned" ? (
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateStatus(item.idPending, e.target.value)
                          }
                          disabled={updatingStatusId === item.idPending}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md cursor-pointer transition-all ${getStatusColor(item.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getStatusColor(item.status)}`}
                        >
                          <StatusDot status={item.status} />
                          {formatStatusForUI(item.status)}
                        </span>
                      )}
                      {updatingStatusId === item.idPending && (
                        <Loader2
                          size={12}
                          className="inline ml-2 animate-spin text-gray-400"
                        />
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-gray-400" />
                        {filters.viewType === "assigned"
                          ? getUserNameById(item.createdBy)
                          : getUserNameById(item.assignedTo)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {/* Botón de eliminar - SOLO PARA ADMIN */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(item)}
                            disabled={deletingId === item.idPending}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === item.idPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
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

        {/* PAGINACIÓN */}
        {totalPages > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/30">
            <div className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL DE VISUALIZACIÓN / EDICIÓN */}
      {/* ========================================== */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm p-10">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-[#001F3F] to-blue-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? <Pencil size={18} /> : <FileText size={18} />}
                {isEditing ? "Edit Pending Item" : "Pending Item Details"}
              </h3>
              <div className="flex items-center gap-2">
                {/* Botón de Editar/Guardar */}
                {!isEditing ? (
                  <button
                    onClick={handleEditToggle}
                    className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                )}
                {/* Botón de eliminar en el modal - SOLO PARA ADMIN */}
                {isAdmin && !isEditing && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleDeleteClick(selectedItem);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* TITLE */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Title *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    placeholder="Enter title..."
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedItem.title}
                  </p>
                )}
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Type
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedItem.referenceType?.toUpperCase() || "N/A"}
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none h-20"
                    placeholder="Enter description..."
                  />
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedItem.description || "No description provided"}
                    </p>
                  </div>
                )}
              </div>

              {/* STATUS */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className={`w-full text-sm font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-all ${getStatusColor(editForm.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center text-sm font-bold uppercase tracking-wider px-3 py-2 rounded-lg ${getStatusColor(selectedItem.status)}`}
                  >
                    <StatusDot status={selectedItem.status} />
                    {formatStatusForUI(selectedItem.status)}
                  </span>
                )}
              </div>

              {/* ASSIGNED TO */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Assigned To *
                </label>
                {isEditing ? (
                  <select
                    name="assignedTo"
                    value={editForm.assignedTo}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                  >
                    <option value="">-- Select User --</option>
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
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    {getUserNameById(selectedItem.assignedTo)}
                  </p>
                )}
              </div>

              {/* CREATED BY */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Created By
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  {getUserNameById(selectedItem.createdBy)}
                </p>
              </div>

              {/* CREATED AT */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedItem.createdAt
                    ? new Date(selectedItem.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
              {selectedItem.referenceType?.toLowerCase() === "task" && (
                <button
                  onClick={handleShowTask}
                  className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={16} /> View Task
                </button>
              )}

              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="px-5 py-2 text-sm font-semibold bg-[#001F3F] text-white hover:bg-blue-900 rounded-xl transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {/* ========================================== */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 size={20} />
                Confirm Deletion
              </h3>
              <button
                onClick={handleCancelDelete}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center text-5xl text-red-500 mb-2">
                <AlertCircle size={64} className="text-red-500" />
              </div>

              <h4 className="text-center text-lg font-semibold text-gray-900">
                Are you sure you want to delete this pending item?
              </h4>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Title:</span>{" "}
                  {itemToDelete.title}
                </p>
                {itemToDelete.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Description:</span>{" "}
                    {itemToDelete.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Status:</span>{" "}
                  {formatStatusForUI(itemToDelete.status)}
                </p>
              </div>

              <p className="text-sm text-red-600 text-center font-semibold">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === itemToDelete.idPending}
                className="px-5 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {deletingId === itemToDelete.idPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
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

      {/* MODAL CREAR PENDIENTE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-[#001F3F] to-blue-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} />
                Create Pending Item
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
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter pending item title..."
                  value={newPendingForm.title}
                  onChange={(e) =>
                    setNewPendingForm({
                      ...newPendingForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Enter description..."
                  value={newPendingForm.description}
                  onChange={(e) =>
                    setNewPendingForm({
                      ...newPendingForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Status
                </label>
                <select
                  value={newPendingForm.status}
                  onChange={(e) =>
                    setNewPendingForm({
                      ...newPendingForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                  Assign To *
                </label>
                <select
                  value={newPendingForm.assignedTo}
                  onChange={(e) =>
                    setNewPendingForm({
                      ...newPendingForm,
                      assignedTo: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-sm"
                >
                  <option value="">-- Select User --</option>
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

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
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
                className="px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePending}
                disabled={creatingPending}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingItem;
