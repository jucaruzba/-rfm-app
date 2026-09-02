import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Building2,
  Upload,
  Globe,
  Loader2,
  Edit3,
  X,
  Save,
  Briefcase,
  Users,
  Handshake,
  User,
  Circle,
  Clock,
  Archive,
  AlertCircle,
} from "lucide-react";
import { companyService } from "../../services/companyService";
import { fileService } from "../../services/fileService";
import { toast } from "sonner";

const COMPANY_TYPES = [
  { value: "MY_BUSINESS", label: "my business", icon: Briefcase },
  { value: "CLIENT", label: "client", icon: Users },
  { value: "PARTNERSHIP", label: "partnership", icon: Handshake },
  { value: "PERSONAL", label: "personal", icon: User },
];

const COMPANY_STATUSES = [
  { value: "ACTIVE", label: "active" },
  { value: "IN_PROGRESS", label: "in progress" },
  { value: "ON_HOLD", label: "on hold" },
  { value: "ARCHIVED", label: "archived" },
];

const getStatusColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20";
    case "IN_PROGRESS":
      return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
    case "ON_HOLD":
    case "ARCHIVED":
    default:
      return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
  }
};

const CompanyDashboard = () => {
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [company, setCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: "",
    status: "",
  });

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const data = await companyService.getCompany(companyId);
      setCompany(data);
      setEditForm({
        type: data.type || "MY_BUSINESS",
        status: data.status || "ACTIVE",
      });
    } catch (err) {
      toast.error("Error loading company details");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const updatedCompany = await companyService.uploadLogo(companyId, file);
      setCompany(updatedCompany);
      toast.success("Logo updated successfully");
    } catch (err) {
      toast.error("Error uploading logo");
    }
  };

  const handleUpdateTypeAndStatus = async () => {
    setUpdating(true);
    try {
      const updatedCompany = await companyService.updateTypeAndStatus(
        companyId,
        editForm.type,
        editForm.status,
      );
      setCompany(updatedCompany);
      setIsEditing(false);
      toast.success("Company details updated");
    } catch (err) {
      toast.error("Error updating company");
    } finally {
      setUpdating(false);
    }
  };

  const getLogoUrl = (path) => {
    return fileService.getFileUrl(path);
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#171717]" size={24} strokeWidth={1.5} />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-[12px] p-6 border border-[#E5E5EA] shadow-none flex flex-col md:flex-row items-start gap-6">
        {/* Logo Container */}
        <div className="relative group shrink-0">
          <div className="w-28 h-28 bg-[#FAFAFA] rounded-[10px] p-2 flex items-center justify-center overflow-hidden border border-[#E5E5EA]">
            {company?.logoPath ? (
              <img
                src={getLogoUrl(company.logoPath)}
                alt={company.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 size={36} strokeWidth={1.5} className="text-[#AEAEB2]" />
            )}
          </div>

          <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleLogoUpload}
              accept="image/*"
            />
            <div className="text-center text-white p-2">
              <Upload size={16} strokeWidth={1.5} className="mx-auto mb-1 text-white" />
              <span className="text-[10px] font-medium block">
                Change logo
              </span>
            </div>
          </label>
        </div>

        {/* Company Info */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
                {company?.name}
              </h1>
              <p className="text-[12px] text-[#AEAEB2] mt-0.5">
                ID: #{company?.idCompany}
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="bg-white hover:bg-[#FAFAFA] border border-[#E5E5EA] px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 text-[#6E6E73] hover:text-[#1C1C1E] transition-colors text-[12px] font-medium"
            >
              <Edit3 size={13} strokeWidth={1.5} />
              <span>Edit details</span>
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {company?.status && (
              <span
                className={`inline-flex items-center text-[11px] font-medium lowercase px-2.5 py-0.5 rounded-full border ${getStatusColor(company?.status)}`}
              >
                {COMPANY_STATUSES.find((s) => s.value === company?.status)
                  ?.label || company?.status?.toLowerCase()}
              </span>
            )}

            {company?.type && (
              <span className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[11px] font-medium lowercase">
                {COMPANY_TYPES.find((t) => t.value === company?.type)?.label ||
                  company?.type?.toLowerCase()}
              </span>
            )}

            {company?.nasRootFolder && (
              <div className="bg-[#FAFAFA] border border-[#E5E5EA] px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[#6E6E73] text-[11px]">
                <Globe size={11} strokeWidth={1.5} className="text-[#AEAEB2]" />
                <span>
                  nas: {company.nasRootFolder.split("/").pop() || "n/a"}
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px]">
              <div className="text-[11px] font-medium lowercase text-[#6E6E73]">
                total tasks
              </div>
              <div className="text-[20px] font-semibold text-[#1C1C1E] mt-1">
                {stats.totalTasks}
              </div>
            </div>

            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px]">
              <div className="text-[11px] font-medium lowercase text-[#6E6E73]">
                in progress
              </div>
              <div className="text-[20px] font-semibold text-[#F59E0B] mt-1">
                {stats.inProgressTasks}
              </div>
            </div>

            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px]">
              <div className="text-[11px] font-medium lowercase text-[#6E6E73]">
                pending
              </div>
              <div className="text-[20px] font-semibold text-[#EF4444] mt-1">
                {stats.pendingTasks}
              </div>
            </div>

            <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px]">
              <div className="text-[11px] font-medium lowercase text-[#6E6E73]">
                completed
              </div>
              <div className="text-[20px] font-semibold text-[#10B981] mt-1">
                {stats.completedTasks}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/companies/${idCompany}/tasks`)}
            className="p-5 bg-white border border-[#E5E5EA] rounded-[12px] text-left hover:border-[#171717]/30 transition-colors group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center mb-3">
              <CheckSquare size={17} strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] mb-1">
              Company tasks
            </h3>
            <p className="text-[12px] text-[#6E6E73]">
              Manage and track assigned tasks and workflows.
            </p>
          </button>

          <button
            onClick={() => navigate(`/companies/${idCompany}/activities`)}
            className="p-5 bg-white border border-[#E5E5EA] rounded-[12px] text-left hover:border-[#171717]/30 transition-colors group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center mb-3">
              <Activity size={17} strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] mb-1">
              Activities & notes
            </h3>
            <p className="text-[12px] text-[#6E6E73]">
              View ongoing events, timelines, and meeting notes.
            </p>
          </button>

          <button
            onClick={() => navigate(`/companies/${idCompany}/explorer`)}
            className="p-5 bg-white border border-[#E5E5EA] rounded-[12px] text-left hover:border-[#171717]/30 transition-colors group cursor-pointer shadow-xs"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center mb-3">
              <FolderTree size={17} strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-semibold text-[#1C1C1E] mb-1">
              Object explorer
            </h3>
            <p className="text-[12px] text-[#6E6E73]">
              Access folder structure, files, and project links.
            </p>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                Edit company settings
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  company type *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  {COMPANY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  status *
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
                >
                  {COMPANY_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTypeAndStatus}
                  disabled={updating}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {updating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} strokeWidth={1.5} />
                      <span>Save changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;