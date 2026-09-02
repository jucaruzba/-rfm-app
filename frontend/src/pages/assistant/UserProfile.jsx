import { useState, useEffect } from "react";
import {
  User,
  Upload,
  Mail,
  Loader2,
  Edit3,
  Eye,
  EyeOff,
  Shield,
  Palette,
} from "lucide-react";
import { getUsernameFromToken } from "../../utils/authUtils";
import { userService } from "../../services/userService";
import { fileService } from "../../services/fileService";
import { toast } from "sonner";

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    colorCode: "#171717",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const username = getUsernameFromToken();
      const data = await userService.getByUsername(username);
      setUserData(data);
      setFormData({
        email: data.email || "",
        username: data.username || "",
        password: "",
        colorCode: data.colorCode || "#171717",
      });
    } catch (err) {
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const promise = userService.uploadImage(userData.id, file);

    toast.promise(promise, {
      loading: "Uploading profile picture...",
      success: (res) => {
        setUserData(res);
        return "Profile picture updated";
      },
      error: "Error uploading profile picture",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        username: formData.username,
        password: formData.password || null,
        email: formData.email,
        colorCode: formData.colorCode,
        role: userData.role,
      };

      const updatedUser = await userService.update(userData.id, updatePayload);
      setUserData(updatedUser);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getProfileImageUrl = (path) => {
    return path ? fileService.getFileUrl(path) : null;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-6 sm:p-8 space-y-6 shadow-none">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-5">
            {/* Avatar with photo upload */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-[14px] overflow-hidden border border-[#E5E5EA] flex items-center justify-center bg-[#FAFAFA]">
                {getProfileImageUrl(userData?.imagePath) ? (
                  <img
                    src={getProfileImageUrl(userData?.imagePath)}
                    alt={userData?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-semibold text-2xl"
                    style={{ backgroundColor: userData?.colorCode || "#171717" }}
                  >
                    {userData?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleProfileImageChange}
                  accept="image/*"
                />
                <Upload size={16} strokeWidth={1.5} />
                <span className="text-[10px] mt-0.5">change</span>
              </label>
            </div>

            <div className="space-y-1">
              <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
                {userData?.username}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[11px] font-medium lowercase">
                  {userData?.role?.toLowerCase() || "assistant"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-[#E5E5EA] bg-white text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] text-[12.5px] font-medium transition-colors self-start sm:self-center cursor-pointer"
          >
            <Edit3 size={13} strokeWidth={1.5} />
            <span>{editing ? "Cancel" : "Edit profile"}</span>
          </button>
        </div>

        {/* Profile Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 space-y-1">
            <p className="text-[10.5px] font-medium lowercase text-[#6E6E73] flex items-center gap-1.5">
              <Mail size={12} strokeWidth={1.5} className="text-[#AEAEB2]" />
              <span>email address</span>
            </p>
            <p className="text-[13px] font-medium text-[#1C1C1E]">
              {userData?.email || "No email assigned"}
            </p>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 space-y-1">
            <p className="text-[10.5px] font-medium lowercase text-[#6E6E73] flex items-center gap-1.5">
              <Palette size={12} strokeWidth={1.5} className="text-[#AEAEB2]" />
              <span>theme color</span>
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-[#E5E5EA]"
                style={{ backgroundColor: userData?.colorCode || "#171717" }}
              />
              <span className="text-[13px] font-mono text-[#1C1C1E]">
                {userData?.colorCode || "#171717"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-6 sm:p-8 space-y-5 animate-in fade-in duration-150 shadow-none">
          <h2 className="text-[16px] font-semibold text-[#1C1C1E] pb-3 border-b border-[#E5E5EA]">
            Edit profile
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  placeholder="username..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  email address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  placeholder="email address..."
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                new password (leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 pl-3 pr-9 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                  placeholder="••••••••••••"
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

            <div className="space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                theme color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  name="colorCode"
                  value={formData.colorCode}
                  onChange={handleFormChange}
                  className="w-9 h-9 bg-transparent border-none rounded-[8px] cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  name="colorCode"
                  maxLength={7}
                  value={formData.colorCode}
                  onChange={handleFormChange}
                  className="w-28 bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-2 outline-none text-center font-mono text-[12px] text-[#1C1C1E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                <span>Save changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
