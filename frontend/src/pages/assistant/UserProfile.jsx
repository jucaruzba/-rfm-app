import { useState, useEffect } from "react";
import {
  User,
  Upload,
  Mail,
  Loader2,
  Save,
  X,
  Eye,
  EyeOff,
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
    colorCode: "#001F3F",
  });
  const [profileImage, setProfileImage] = useState(null);
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
        password: "", // Keep password empty initially
        colorCode: data.colorCode || "#001F3F",
      });
    } catch (err) {
      toast.error("Error loading profile data");
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
        return "Profile picture updated successfully";
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
        password: formData.password || null, // If empty, backend logic handles it
        email: formData.email,
        colorCode: formData.colorCode,
        role: userData.role, // Role is mandatory in DTO but not editable
      };

      const updatedUser = await userService.update(userData.id, updatePayload);
      setUserData(updatedUser);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Update profile error", err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getProfileImageUrl = (path) => {
    return path ? fileService.getFileUrl(path) : null;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#001F3F]" size={40} />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 px-4">
      {/* PROFILE CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#003d7a] rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_70px_rgba(0,31,63,0.22)] border border-white/10 flex flex-col gap-8">
        {/* Background Icon */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white pointer-events-none hidden md:block">
          <User size={280} />
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* PROFILE IMAGE SECTION */}
          <div className="relative group shrink-0">
            <div className="w-44 h-44 bg-white rounded-3xl p-5 shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-blue-500/10">
              {getProfileImageUrl(userData?.imagePath) ? (
                <img
                  src={getProfileImageUrl(userData?.imagePath)}
                  alt={userData?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full rounded-3xl flex items-center justify-center text-white font-black text-6xl"
                  style={{ backgroundColor: userData?.colorCode || "#001F3F" }}
                >
                  {userData?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Upload overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-xs">
              <input
                type="file"
                className="hidden"
                onChange={handleProfileImageChange}
                accept="image/*"
              />
              <div className="text-center text-white p-4">
                <Upload size={24} className="mx-auto mb-2 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest block">
                  Upload Photo
                </span>
              </div>
            </label>
          </div>

          {/* PROFILE INFO */}
          <div className="flex-1 text-center md:text-left space-y-4 pt-1 w-full md:w-auto">
            <div className="space-y-2">
              <span className="inline-block bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-md">
                User Profile
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                {userData?.username}
              </h1>
            </div>

            {/* Status Badge */}
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-300 backdrop-blur-xs">
                <Mail size={14} className="text-blue-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  {userData?.email || "No email"}
                </span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-emerald-400 backdrop-blur-xs">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {userData?.role || "User"}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setEditing(!editing)}
                className={`px-6 py-3 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${
                  editing
                    ? "bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                }`}
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      {editing && (
        <div className="mt-8 bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-black text-[#001F3F] uppercase italic mb-6">
            Edit Profile Information
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-600 tracking-widest">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-600 focus:bg-blue-50/30 transition-all"
                  placeholder="Enter username"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-600 tracking-widest">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-600 focus:bg-blue-50/30 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-600 tracking-widest">
                Update Password (Leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-10 text-sm font-bold outline-none focus:border-blue-600 focus:bg-blue-50/30 transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-[#001F3F] rounded-xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
