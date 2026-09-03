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
  Edit3,
  KeyRound,
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
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    colorCode: "#171717",
    role: "ASSISTANT",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.findAll();
      setUsers(data || []);
    } catch (err) {
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setShowPassword(false);
    setFormData({
      username: "",
      password: "",
      email: "",
      colorCode: "#171717",
      role: "ASSISTANT",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    const userId = user.id || user.idUser;
    setSelectedUserId(userId);
    setShowPassword(false);
    setFormData({
      username: user.username,
      password: "",
      email: user.email,
      colorCode: user.colorCode || "#171717",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleTriggerReset = async (email) => {
    if (!email) {
      toast.error("No email associated with this user");
      return;
    }
    try {
      await userService.forgotPassword({ email });
      toast.success(`Temporary password sent to ${email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset email");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.email.trim()) {
      return toast.error("Username and email are required");
    }

    if (!isEditing && !formData.password) {
      return toast.error("Password is required for new users");
    }

    setSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password || null,
        email: formData.email.trim(),
        colorCode: formData.colorCode,
        role: formData.role,
      };

      if (isEditing && selectedUserId !== null) {
        await userService.update(selectedUserId, payload);
        toast.success("User updated");
      } else {
        await userService.create(payload);
        toast.success("User created");
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "An error occurred saving the user",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole =
      roleFilter === "ALL" ||
      u.role?.toUpperCase() === roleFilter.toUpperCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Unified Action, Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
              size={14}
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] py-1.5 pl-8 pr-3 outline-none focus:border-[#171717] focus:bg-white text-[12.5px] text-[#1C1C1E] transition-all"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-0.5 bg-[#FAFAFA] p-0.5 rounded-[8px] border border-[#E5E5EA] shrink-0">
            {[
              { id: "ALL", label: "all users" },
              { id: "ADMIN", label: "admins" },
              { id: "ASSISTANT", label: "assistants" },
            ].map((tab) => (
              <button
                key={`tab-role-${tab.id}`}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1 text-[12px] font-medium lowercase rounded-[6px] whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === tab.id
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* New user button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New user</span>
          </button>
        </div>
      </div>

      {/* Users Cards Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((userItem) => (
            <div
              key={`user-card-${userItem.id || userItem.idUser}`}
              className="bg-white border border-[#E5E5EA] rounded-[12px] p-5 flex flex-col justify-between gap-4 hover:border-[#171717]/30 transition-colors shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white font-semibold text-[14px]"
                      style={{ backgroundColor: userItem.colorCode || "#171717" }}
                    >
                      {userItem.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-[14.5px] font-semibold text-[#1C1C1E]">
                        {userItem.username}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium lowercase text-[#6E6E73]">
                        <Shield size={11} strokeWidth={1.5} /> {userItem.role?.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full border border-white shadow-xs"
                    style={{ backgroundColor: userItem.colorCode || "#171717" }}
                    title={`Tone: ${userItem.colorCode}`}
                  />
                </div>

                <div className="space-y-1 pt-2 border-t border-[#E5E5EA] text-[12px] text-[#6E6E73]">
                  <p className="flex items-center gap-2 truncate">
                    <Mail size={13} strokeWidth={1.5} className="text-[#AEAEB2] shrink-0" />
                    <span>{userItem.email}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-[#E5E5EA]">
                <button
                  onClick={() => handleTriggerReset(userItem.email)}
                  className="p-1.5 text-[#6E6E73] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-[6px] transition-colors cursor-pointer"
                  title="Send password reset email"
                >
                  <KeyRound size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleOpenEdit(userItem)}
                  className="p-1.5 text-[#6E6E73] hover:text-[#171717] hover:bg-[#171717]/10 rounded-[6px] transition-colors cursor-pointer"
                  title="Edit user"
                >
                  <Edit3 size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[12px] border border-[#E5E5EA] text-center">
          <p className="text-[13px] text-[#6E6E73]">
            No users match the search criteria
          </p>
        </div>
      )}

      {/* New / Edit User Modal */}
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
                {isEditing ? "Edit user" : "New user"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="enter username..."
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  email address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="operator@company.com..."
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  {isEditing
                    ? "password (leave blank to keep current)"
                    : "password *"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!isEditing}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 pl-3 pr-9 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    security role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                  >
                    <option value="ADMIN">admin</option>
                    <option value="ASSISTANT">assistant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    theme color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) =>
                        setFormData({ ...formData, colorCode: e.target.value })
                      }
                      className="w-9 h-9 bg-transparent border-none rounded-[8px] cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={formData.colorCode}
                      onChange={(e) =>
                        setFormData({ ...formData, colorCode: e.target.value })
                      }
                      className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2 outline-none text-center font-mono text-[12px] text-[#1C1C1E]"
                    />
                  </div>
                </div>
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
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{isEditing ? "Saving..." : "Creating..."}</span>
                    </>
                  ) : isEditing ? (
                    "Save user"
                  ) : (
                    "Create user"
                  )}
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
