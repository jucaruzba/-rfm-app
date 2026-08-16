import { useState, useEffect } from "react";
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
  { value: "MY_BUSINESS", label: "My Business", icon: Briefcase, color: "blue" },
  { value: "CLIENT", label: "Client", icon: Users, color: "green" },
  { value: "PARTNERSHIP", label: "Partnership", icon: Handshake, color: "purple" },
  { value: "PERSONAL", label: "Personal", icon: User, color: "orange" },
];

// Company status constants
const COMPANY_STATUSES = [
  { value: "ACTIVE", label: "Active", icon: Circle, color: "green" },
  { value: "IN_PROGRESS", label: "In Progress", icon: Loader2, color: "blue" },
  { value: "ON_HOLD", label: "On Hold", icon: Clock, color: "yellow" },
  { value: "ARCHIVED", label: "Archived", icon: Archive, color: "gray" },
];

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
      setCompanies(data);
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

  // --- HANDLE DELETE (Show appropriate modal) ---
  const handleDelete = async (companyId, companyName) => {
    try {
      // Check if company has data
      const hasData = await companyService.checkHasData(companyId);

      // Open modal with appropriate action
      setConfirmModal({
        isOpen: true,
        companyId,
        companyName,
        action: hasData ? 'archive' : 'delete',
        step: 1,
        hasData,
      });
    } catch (err) {
      toast.error("Error processing company");
    }
  };

  // --- HANDLE ARCHIVE (from modal) ---
  const handleArchiveFromModal = async (companyId, companyName) => {
    try {
      await companyService.archiveCompany(companyId);
      toast.success(`Company "${companyName}" archived successfully`);
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchCompanies();
    } catch (err) {
      toast.error("Error archiving company");
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // --- HANDLE PERMANENT DELETE (from modal) ---
  const handleHardDelete = async (companyId, companyName) => {
    try {
      await companyService.hardDeleteCompany(companyId);
      toast.success(`Company "${companyName}" permanently deleted`);
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchCompanies();
    } catch (err) {
      toast.error("Error deleting company");
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // --- CLOSE CONFIRMATION MODAL ---
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

  // --- FILTER COMPANIES ---
  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status color
  const getStatusColor = (status) => {
    const statusConfig = COMPANY_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return "text-gray-600 bg-gray-50";

    switch (statusConfig.color) {
      case "green":
        return "text-green-600 bg-green-50";
      case "blue":
        return "text-blue-600 bg-blue-50";
      case "yellow":
        return "text-yellow-600 bg-yellow-50";
      case "gray":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
            Companies{" "}
            <span className="text-gray-300 font-light">Directory</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
              showArchived
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {showArchived ? (
              <>
                <EyeOff size={16} /> Hide Archived
              </>
            ) : (
              <>
                <Archive size={16} /> Show Archived
              </>
            )}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#001F3F] text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Add Company
          </button>
        </div>
      </div>

      {/* SEARCH AND VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative group flex-1">
          <Search
            className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-all"
            size={22}
          />
          <input
            type="text"
            placeholder="Search by corporate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-[1.5rem] py-5 pl-16 pr-8 outline-none focus:border-blue-600 transition-all shadow-sm font-bold text-sm text-[#001F3F]"
          />
        </div>

        {/* View Mode Toggle: Icons vs List */}
        <div className="flex items-center bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm self-end sm:self-auto shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setViewMode("icons")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              viewMode === "icons"
                ? "bg-[#001F3F] text-white shadow-md shadow-blue-900/20"
                : "text-gray-400 hover:text-[#001F3F] hover:bg-gray-50"
            }`}
            title="Icons / Grid View"
          >
            <LayoutGrid size={16} /> Icons
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              viewMode === "list"
                ? "bg-[#001F3F] text-white shadow-md shadow-blue-900/20"
                : "text-gray-400 hover:text-[#001F3F] hover:bg-gray-50"
            }`}
            title="List View"
          >
            <List size={16} /> List
          </button>
        </div>
      </div>

      {/* COMPANIES VIEW (GRID OR LIST) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem]"
            ></div>
          ))}
        </div>
      ) : filteredCompanies.length > 0 ? (
        viewMode === "icons" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanies.map((company) => (
              <div
                key={company.idCompany}
                className={`group bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  company.status === "ARCHIVED"
                    ? "border-gray-200 opacity-75 hover:opacity-100"
                    : "border-gray-100 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,31,63,0.06)]"
                }`}
              >
                {/* Background effect */}
                <div
                  className={`absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 to-[#001F3F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    company.status === "ARCHIVED" ? "bg-gray-400" : ""
                  }`}
                />

                <div>
                  {/* TOP ROW: Logo and Badge */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div
                      className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/companies/${company.idCompany}`)}
                    >
                      {company.logoPath ? (
                        <img
                          src={fileService.getFileUrl(company.logoPath)}
                          alt={company.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 size={28} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      {company.type && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                          {COMPANY_TYPES.find((t) => t.value === company.type)
                            ?.label || company.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* COMPANY INFO */}
                  <div
                    className="space-y-3 cursor-pointer"
                    onClick={() => navigate(`/companies/${company.idCompany}`)}
                  >
                    <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                      {company.name}
                    </h2>

                    {/* Status badge */}
                    {company.status && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(company.status)}`}
                      >
                        <Circle size={8} fill="currentColor" />
                        {COMPANY_STATUSES.find((s) => s.value === company.status)
                          ?.label || company.status}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3">
                      {company.description ||
                        "No corporate description provided for this operational entity."}
                    </p>
                  </div>
                </div>

                {/* FOOTER WITH ACTIONS */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/companies/${company.idCompany}`)}
                    className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-600 transition-colors duration-300 flex items-center gap-2"
                  >
                    View Profile
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </button>

                  {/* Actions: Restore or Delete */}
                  <div className="flex items-center gap-2">
                    {company.status === "ARCHIVED" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(company.idCompany, company.name);
                        }}
                        className="p-2 rounded-xl text-green-600 hover:bg-green-50 transition-all"
                        title="Restore company"
                      >
                        <RotateCcw size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(company.idCompany, company.name);
                        }}
                        className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete company"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 pl-6">Company</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={`list-${company.idCompany}`}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/companies/${company.idCompany}`)}
                    >
                      {/* Name & Logo */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                            {company.logoPath ? (
                              <img
                                src={fileService.getFileUrl(company.logoPath)}
                                alt={company.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-sm text-[#001F3F] uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                              {company.name}
                            </p>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              ID: #{company.idCompany}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        {company.type ? (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                            {COMPANY_TYPES.find((t) => t.value === company.type)
                              ?.label || company.type}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {company.status ? (
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(company.status)}`}
                          >
                            <Circle size={6} fill="currentColor" />
                            {COMPANY_STATUSES.find(
                              (s) => s.value === company.status,
                            )?.label || company.status}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-4 max-w-xs md:max-w-md">
                        <p className="text-xs text-gray-500 font-medium truncate">
                          {company.description || "No corporate description provided."}
                        </p>
                      </td>

                      {/* Actions */}
                      <td
                        className="p-4 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/companies/${company.idCompany}`)
                            }
                            className="px-3 py-1.5 bg-gray-50 hover:bg-[#001F3F] text-[#001F3F] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            View
                          </button>
                          {company.status === "ARCHIVED" ? (
                            <button
                              onClick={() =>
                                handleRestore(company.idCompany, company.name)
                              }
                              className="p-2 rounded-xl text-green-600 hover:bg-green-50 transition-all"
                              title="Restore company"
                            >
                              <RotateCcw size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleDelete(company.idCompany, company.name)
                              }
                              className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Delete company"
                            >
                              <Trash2 size={16} />
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
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
          <p className="text-lg font-black text-[#001F3F] uppercase italic">
            {showArchived
              ? "No archived companies found"
              : "No companies found"}
          </p>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic">
                Create <span className="text-gray-300 font-light">Company</span>
              </h2>
              <p className="text-xs text-gray-400 italic mt-1">
                Register a new operational entity.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe the company operations..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-medium text-sm text-[#001F3F] resize-none italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Company Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F] cursor-pointer"
                >
                  {COMPANY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F] cursor-pointer"
                >
                  {COMPANY_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Preview
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">
                      {
                        COMPANY_TYPES.find((t) => t.value === formData.type)
                          ?.label
                      }
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                        formData.status === "ACTIVE"
                          ? "bg-green-50 text-green-600"
                          : formData.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-600"
                          : formData.status === "ON_HOLD"
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {
                        COMPANY_STATUSES.find(
                          (s) => s.value === formData.status
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL (Adaptive) --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={closeConfirmModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              {confirmModal.action === 'archive' ? (
                // --- ARCHIVE MODAL (Company has data) ---
                <>
                  <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Archive size={40} className="text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight mb-2">
                    Archive Company
                  </h3>
                  <p className="text-gray-500 font-medium text-sm mb-2">
                    <strong className="text-[#001F3F]">{confirmModal.companyName}</strong>{" "}
                    has important data (activities and/or tasks).
                  </p>
                  <p className="text-gray-500 font-medium text-sm mb-6">
                    This company will be <strong className="text-blue-600">ARCHIVED</strong>.
                    <br />
                    <span className="text-gray-400 text-xs">
                      Data will be preserved and can be restored later.
                    </span>
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={closeConfirmModal}
                      className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleArchiveFromModal(
                          confirmModal.companyId,
                          confirmModal.companyName
                        )
                      }
                      className="bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                      Archive Company
                    </button>
                  </div>
                </>
              ) : (
                // --- DELETE MODAL (Company has NO data) - Double confirmation ---
                confirmModal.step === 1 ? (
                  <>
                    <div className="w-20 h-20 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                      <AlertTriangle size={40} className="text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight mb-2">
                      Are you sure?
                    </h3>
                    <p className="text-gray-500 font-medium text-sm mb-2">
                      <strong className="text-[#001F3F]">{confirmModal.companyName}</strong>{" "}
                      has no activities or tasks.
                    </p>
                    <p className="text-gray-500 font-medium text-sm mb-6">
                      This will delete{" "}
                      <strong className="text-red-600">EVERYTHING</strong> from this company
                      (configurations, files, history).
                      <br />
                      <span className="text-red-500 font-bold">
                        This action cannot be undone.
                      </span>
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={closeConfirmModal}
                        className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          setConfirmModal({ ...confirmModal, step: 2 })
                        }
                        className="bg-red-500 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-red-600 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                      <Trash2 size={40} className="text-red-600" />
                    </div>
                    <h3 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight mb-2">
                      Confirm permanent deletion
                    </h3>
                    <p className="text-gray-500 font-medium text-sm mb-6">
                      This action will permanently delete{" "}
                      <strong className="text-red-600">
                        {confirmModal.companyName}
                      </strong>{" "}
                      and all its data.
                      <br />
                      <span className="text-red-500 font-bold">
                        This operation is irreversible.
                      </span>
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={closeConfirmModal}
                        className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          handleHardDelete(
                            confirmModal.companyId,
                            confirmModal.companyName
                          )
                        }
                        className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 active:scale-95"
                      >
                        Delete Permanently
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