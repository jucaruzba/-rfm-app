import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  X,
  Briefcase,
  Users,
  Handshake,
  User,
  Circle,
  Loader2,
  Clock,
  Archive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  LayoutGrid,
  List,
} from "lucide-react";
import { companyService } from "../../../../services/companyService";
import { fileService } from "../../../../services/fileService";
import { toast } from "sonner";

// Company type constants
const COMPANY_TYPES = [
  { value: "MY_BUSINESS", label: "my business", icon: Briefcase },
  { value: "CLIENT", label: "client", icon: Users },
  { value: "PARTNERSHIP", label: "partnership", icon: Handshake },
  { value: "PERSONAL", label: "personal", icon: User },
];

// Company status constants per specification
const COMPANY_STATUSES = [
  { value: "ACTIVE", label: "active", color: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20" },
  { value: "IN_PROGRESS", label: "in progress", color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
  { value: "ON_HOLD", label: "on hold", color: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20" },
  { value: "ARCHIVED", label: "archived", color: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20" },
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

const CompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState("icons"); // "icons" or "list"

  // --- CREATE MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "MY_BUSINESS",
    status: "ACTIVE",
  });
  const descRef = useRef(null);

  // --- CONFIRMATION MODAL STATES ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    companyId: null,
    companyName: null,
    action: null, // 'archive' or 'delete'
    step: 1,
    hasData: false,
  });

  useEffect(() => {
    fetchCompanies();
  }, [showArchived]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      let data;
      if (showArchived) {
        data = await companyService.getCompaniesIncludingArchived();
      } else {
        data = await companyService.getCompanies();
      }
      setCompanies(data || []);
    } catch (err) {
      toast.error("Error loading companies");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE CREATE COMPANY ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSubmitting(true);
    try {
      await companyService.createCompany(formData);
      toast.success("Company created successfully");
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "MY_BUSINESS",
        status: "ACTIVE",
      });
      if (descRef.current) {
        descRef.current.style.height = "auto";
      }
      fetchCompanies();
    } catch (err) {
      toast.error("Error creating company");
    } finally {
      setSubmitting(false);
    }
  };

  // --- HANDLE RESTORE ---
  const handleRestore = async (companyId, companyName) => {
    try {
      await companyService.restoreCompany(companyId);
      toast.success(`Company "${companyName}" restored successfully`);
      fetchCompanies();
    } catch (err) {
      toast.error("Error restoring company");
    }
  };

  // --- HANDLE DELETE ---
  const handleDelete = async (companyId, companyName) => {
    try {
      const hasData = await companyService.checkHasData(companyId);

      setConfirmModal({
        isOpen: true,
        companyId,
        companyName,
        action: hasData ? "archive" : "delete",
        step: 1,
        hasData,
      });
    } catch (err) {
      toast.error("Error processing company");
    }
  };

  const handleArchiveFromModal = async (companyId, companyName) => {
    try {
      await companyService.deleteCompany(companyId);
      toast.success(`Company "${companyName}" archived`);
      closeConfirmModal();
      fetchCompanies();
    } catch (err) {
      toast.error("Error archiving company");
    }
  };

  const handleHardDelete = async (companyId, companyName) => {
    try {
      await companyService.hardDeleteCompany(companyId);
      toast.success(`Company "${companyName}" permanently deleted`);
      closeConfirmModal();
      fetchCompanies();
    } catch (err) {
      toast.error("Error deleting company");
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      companyId: null,
      companyName: null,
      action: null,
      step: 1,
      hasData: false,
    });
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Action bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
              size={14}
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] py-1.5 pl-8 pr-3 outline-none focus:border-[#171717] focus:bg-white text-[12.5px] text-[#1C1C1E] transition-all"
            />
          </div>

          {/* View switcher */}
          <div className="flex items-center bg-[#FAFAFA] p-0.5 rounded-[8px] border border-[#E5E5EA] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("icons")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                viewMode === "icons"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <LayoutGrid size={13} strokeWidth={1.5} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                  : "text-[#6E6E73] hover:text-[#1C1C1E]"
              }`}
            >
              <List size={13} strokeWidth={1.5} />
              <span>List</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors border border-[#E5E5EA] cursor-pointer ${
              showArchived
                ? "bg-[#FAFAFA] text-[#1C1C1E]"
                : "bg-white text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA]"
            }`}
          >
            {showArchived ? (
              <>
                <EyeOff size={13} strokeWidth={1.5} />
                <span>Hide archived</span>
              </>
            ) : (
              <>
                <Archive size={13} strokeWidth={1.5} />
                <span>Show archived</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New company</span>
          </button>
        </div>
      </div>

      {/* Companies view (Grid or List) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 bg-white border border-[#E5E5EA] animate-pulse rounded-[10px]"
            />
          ))}
        </div>
      ) : filteredCompanies.length > 0 ? (
        viewMode === "icons" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCompanies.map((company) => (
              <div
                key={company.idCompany}
                className={`bg-white rounded-[10px] border p-3.5 flex flex-col justify-between transition-colors ${
                  company.status === "ARCHIVED"
                    ? "border-[#E5E5EA] opacity-60"
                    : "border-[#E5E5EA] hover:border-[#171717]/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 bg-[#FAFAFA] rounded-[8px] flex items-center justify-center border border-[#E5E5EA] shrink-0 overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/companies/${company.idCompany}`)}
                      >
                        {company.logoPath ? (
                          <img
                            src={fileService.getFileUrl(company.logoPath)}
                            alt={company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 size={16} strokeWidth={1.5} className="text-[#AEAEB2]" />
                        )}
                      </div>

                      <div
                        className="min-w-0 cursor-pointer"
                        onClick={() => navigate(`/companies/${company.idCompany}`)}
                      >
                        <h2 className="text-[13.5px] font-semibold text-[#1C1C1E] hover:text-[#171717] transition-colors truncate">
                          {company.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {company.status && (
                        <span
                          className={`inline-flex items-center text-[10px] font-medium lowercase px-2 py-0.5 rounded-full border ${getStatusColor(company.status)}`}
                        >
                          {COMPANY_STATUSES.find((s) => s.value === company.status)
                            ?.label || company.status.toLowerCase()}
                        </span>
                      )}
                      {company.type && (
                        <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[10px] font-medium lowercase">
                          {COMPANY_TYPES.find((t) => t.value === company.type)
                            ?.label || company.type.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {company.description && (
                    <p
                      className="text-[11.5px] text-[#6E6E73] line-clamp-1 cursor-pointer mb-1"
                      onClick={() => navigate(`/companies/${company.idCompany}`)}
                    >
                      {company.description}
                    </p>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/companies/${company.idCompany}`)}
                    className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors cursor-pointer"
                    title="View workspace"
                  >
                    <Eye size={15} strokeWidth={1.5} />
                  </button>

                  <div className="flex items-center gap-1">
                    {company.status === "ARCHIVED" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(company.idCompany, company.name);
                        }}
                        className="p-1.5 text-[#10B981] hover:bg-[#10B981]/10 rounded-[6px] transition-colors cursor-pointer"
                        title="Restore company"
                      >
                        <RotateCcw size={14} strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(company.idCompany, company.name);
                        }}
                        className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors cursor-pointer"
                        title="Delete company"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-[12px] border border-[#E5E5EA] overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] text-[#6E6E73] text-[11px] font-medium lowercase border-b border-[#E5E5EA]">
                    <th className="p-3.5">company</th>
                    <th className="p-3.5">type</th>
                    <th className="p-3.5">status</th>
                    <th className="p-3.5">description</th>
                    <th className="p-3.5 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={`list-${company.idCompany}`}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      onClick={() => navigate(`/companies/${company.idCompany}`)}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#FAFAFA] rounded-[6px] flex items-center justify-center border border-[#E5E5EA] shrink-0 overflow-hidden">
                            {company.logoPath ? (
                              <img
                                src={fileService.getFileUrl(company.logoPath)}
                                alt={company.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 size={14} strokeWidth={1.5} className="text-[#AEAEB2]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[13.5px] text-[#1C1C1E]">
                              {company.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {company.type ? (
                          <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[10px] font-medium lowercase">
                            {COMPANY_TYPES.find((t) => t.value === company.type)
                              ?.label || company.type.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-[#AEAEB2] text-xs">--</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {company.status ? (
                          <span
                            className={`inline-flex items-center text-[10px] font-medium lowercase px-2 py-0.5 rounded-full border ${getStatusColor(company.status)}`}
                          >
                            {COMPANY_STATUSES.find(
                              (s) => s.value === company.status,
                            )?.label || company.status.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-[#AEAEB2] text-xs">--</span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs md:max-w-md">
                        <p className="text-[12px] text-[#6E6E73] truncate">
                          {company.description || "No description provided."}
                        </p>
                      </td>

                      <td
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/companies/${company.idCompany}`)
                            }
                            className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors cursor-pointer"
                            title="View workspace"
                          >
                            <Eye size={14} strokeWidth={1.5} />
                          </button>
                          {company.status === "ARCHIVED" ? (
                            <button
                              onClick={() =>
                                handleRestore(company.idCompany, company.name)
                              }
                              className="p-1 text-[#10B981] hover:bg-[#10B981]/10 rounded-[6px] transition-colors cursor-pointer"
                              title="Restore company"
                            >
                              <RotateCcw size={14} strokeWidth={1.5} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleDelete(company.idCompany, company.name)
                              }
                              className="p-1 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors cursor-pointer"
                              title="Delete company"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-[12px] border border-[#E5E5EA] text-center">
          <p className="text-[14px] text-[#6E6E73]">
            {showArchived
              ? "No archived companies found"
              : "No companies found"}
          </p>
        </div>
      )}

      {/* Popup: New Company */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Plain title: "New company" */}
            <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                New company
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  company name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  ref={descRef}
                  rows={1}
                  placeholder="briefly describe company operations..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (descRef.current) {
                      descRef.current.style.height = "auto";
                      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
                    }
                  }}
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none overflow-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                    company type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
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
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
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
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
            <button
              type="button"
              onClick={closeConfirmModal}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div>
              {confirmModal.action === "archive" ? (
                <>
                  <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-2">
                    Archive company
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] mb-4">
                    <strong className="text-[#1C1C1E]">{confirmModal.companyName}</strong> has existing activities and tasks. It will be archived and can be restored later.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
                    <button
                      onClick={closeConfirmModal}
                      className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleArchiveFromModal(
                          confirmModal.companyId,
                          confirmModal.companyName,
                        )
                      }
                      className="bg-[#171717] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium hover:bg-[#2C2C2E] transition-colors shadow-xs cursor-pointer"
                    >
                      Archive company
                    </button>
                  </div>
                </>
              ) : (
                confirmModal.step === 1 ? (
                  <>
                    <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-2">
                      Delete company
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] mb-4">
                      Are you sure you want to delete <strong className="text-[#1C1C1E]">{confirmModal.companyName}</strong>? This company has no data.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
                      <button
                        onClick={closeConfirmModal}
                        className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          setConfirmModal({ ...confirmModal, step: 2 })
                        }
                        className="bg-[#EF4444] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium hover:bg-[#DC2626] transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-2">
                      Confirm permanent deletion
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] mb-4">
                      This action will permanently delete <strong className="text-[#EF4444]">{confirmModal.companyName}</strong>. This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
                      <button
                        onClick={closeConfirmModal}
                        className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          handleHardDelete(
                            confirmModal.companyId,
                            confirmModal.companyName,
                          )
                        }
                        className="bg-[#EF4444] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium hover:bg-[#DC2626] transition-colors"
                      >
                        Delete permanently
                      </button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;