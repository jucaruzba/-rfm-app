import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  User,
  Mail,
  Shield,
  Palette,
  Loader2,
  X,
  Save,
  Edit3,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { userService } from "../../../../services/userService";
import { toast } from "sonner";

const UserPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modal and Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // State to toggle visibility

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    colorCode: "#001F3F",
    role: "ASSISTANT",
  });

  // Load full operator list (Requires ADMIN role in Backend)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.findAll();
      setUsers(data || []);
    } catch (err) {
      toast.error("Error syncing security user stack");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle open modal for clean creation
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setShowPassword(false); // Reset to hidden
    setFormData({
      username: "",
      password: "",
      email: "",
      colorCode: "#001F3F",
      role: "ASSISTANT",
    });
    setIsModalOpen(true);
  };

  // Handle open modal for editing (Preloads data)
  const handleOpenEdit = (user) => {
    setIsEditing(true);
    const userId = user.id || user.idUser;
    setSelectedUserId(userId);
    setShowPassword(false); // Reset to hidden
    setFormData({
      username: user.username,
      password: "", // Empty string to skip password update if blank
      email: user.email,
      colorCode: user.colorCode || "#001F3F",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  // Submit payload (Create or Update) to Spring Boot
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.email.trim()) {
      return toast.error("Username and Email are mandatory fields");
    }

    if (!isEditing && !formData.password) {
      return toast.error("Password string is required for new operators");
    }

    setSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password || null, // Si está editando y va vacía, el service backend decide
        email: formData.email.trim(),
        colorCode: formData.colorCode,
        role: formData.role,
      };

      if (isEditing && selectedUserId !== null) {
        await userService.update(selectedUserId, payload);
        toast.success("Operator profile updated correctly");
      } else {
        await userService.create(payload);
        toast.success("New operational account deployed successfully");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Operation aborted. Check credential uniqueness.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle logical/physical deletion
  const handleDeleteUser = async (id, name) => {
    const confirmed = window.confirm(
      `⚠️ SECURITY WARNING: \n\nAre you sure you want to revoke and delete operator account "${name.toUpperCase()}"?\n\nThis will terminate current session tokens and cascade restricted nodes access.`,
    );
    if (confirmed) {
      try {
        await userService.delete(id);
        toast.success("Operator purged from registry");
        fetchUsers();
      } catch (err) {
        toast.error("Failed to revoke operator access");
      }
    }
  };

  // Trigger temporary password reset
  const handleTriggerReset = async (email) => {
    try {
      await userService.forgotPassword({ email });
      toast.success("Temporary password sent to targets email");
    } catch (err) {
      toast.error("Failed to route recovery transmission");
    }
  };

  // In-memory data filtering for search responsiveness
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER BLOCK --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-[2rem] px-8 py-6 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#001F3F] text-white rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
              Users{"   "}
              <span className="text-gray-300 font-light">Registry</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-bold tracking-wide mt-1 uppercase">
              System Access Control & Authentication Identity
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
        >
          <Plus size={14} strokeWidth={3} /> Add Operator
        </button>
      </div>

      {/* --- FILTER CONTROL PANEL --- */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl overflow-x-auto">
          {[
            { id: "ALL", label: "All Staff" },
            { id: "ADMIN", label: "Admins" },
            { id: "ASSISTANT", label: "Assistants" },
          ].map((tab) => (
            <button
              key={`tab-role-${tab.id}`}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg whitespace-nowrap transition-all ${
                roleFilter === tab.id
                  ? "bg-[#001F3F] text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            size={15}
          />
          <input
            type="text"
            placeholder="Search operators by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-[#001F3F] focus:bg-white font-bold text-xs text-[#001F3F] transition-all"
          />
        </div>
      </div>

      {/* --- CARDS RESPONSIVE GRID --- */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#001F3F]" size={36} />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((userItem) => (
            <div
              key={`user-card-${userItem.id || userItem.idUser}`}
              className="group bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between gap-6 hover:border-blue-500/20 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Lateral indicator of assigned corporate ColorCode */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[4px]"
                style={{ backgroundColor: userItem.colorCode || "#001F3F" }}
              />

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Circular avatar with initial */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg border-2 border-white shadow-md shadow-gray-200"
                    style={{ backgroundColor: userItem.colorCode || "#001F3F" }}
                  >
                    {userItem.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-black text-[#001F3F] uppercase tracking-tight truncate">
                      {userItem.username}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[8px] font-black tracking-widest bg-gray-50 border border-gray-100 text-gray-400 uppercase mt-1">
                      <Shield size={10} /> {userItem.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <p className="flex items-center gap-2 truncate text-gray-400 font-medium lowercase">
                    <Mail size={13} className="text-gray-300 shrink-0" />{" "}
                    {userItem.email}
                  </p>
                  <p className="flex items-center gap-2 text-gray-400">
                    <Palette size={13} className="text-gray-300 shrink-0" />{" "}
                    Node Tone:{" "}
                    <span className="font-mono font-black text-gray-600">
                      {userItem.colorCode || "#001F3F"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Acciones del Operador */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-50 shrink-0">
                <button
                  onClick={() => handleTriggerReset(userItem.email)}
                  className="p-2 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                  title="Force Temporary Password Pipeline"
                >
                  <KeyRound size={20} />
                </button>
                <button
                  onClick={() => handleOpenEdit(userItem)}
                  className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Modify Profile Parameters"
                >
                  <Edit3 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center">
          <User className="mx-auto text-gray-200 mb-3" size={44} />
          <p className="text-xs font-black text-[#001F3F] uppercase tracking-wider">
            No secure operator profiles match the filter criteria
          </p>
        </div>
      )}

      {/* --- EXPANSIVE MANAGE MODAL (CREATE/EDIT) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-8 relative shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-transform hover:rotate-90 p-1"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-[#001F3F] tracking-tighter uppercase italic">
                {isEditing ? "Modify Credentials" : "Provision Account"}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                Set operational clearance, specific hex identity and access
                tags.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">
                  Account Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Operational unique handle..."
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">
                  Secure Email Directive *
                </label>
                <input
                  type="email"
                  required
                  placeholder="operator@rfm.application..."
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                />
              </div>

              {/* Conditional password: required only for new registry */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">
                  {isEditing
                    ? "Update Password (Leave blank to keep current)"
                    : "Secret String Clearance *"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!isEditing}
                    placeholder="••••••••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 pr-10 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">
                    Security Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-[#001F3F] font-bold text-xs text-[#001F3F] cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="ASSISTANT">ASSISTANT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 italic">
                    Visual Identity Tone
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) =>
                        setFormData({ ...formData, colorCode: e.target.value })
                      }
                      className="w-10 h-10 bg-transparent border-none rounded-xl cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={formData.colorCode}
                      onChange={(e) =>
                        setFormData({ ...formData, colorCode: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3 outline-none text-center font-mono text-xs font-black uppercase text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#001F3F] text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  {isEditing ? "Save Adjustments" : "Deploy Operator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
