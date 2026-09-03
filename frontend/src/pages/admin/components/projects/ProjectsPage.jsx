import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  X,
  Loader2,
  Calendar,
  User,
  Eye,
  Trash2,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { projectService } from "../../../../services/projectService";
import { userService } from "../../../../services/userService";
import { toast } from "sonner";
import { getUsernameFromToken } from "../../../../utils/auth";
import { formatUsDate } from "../../../../utils/dateUtils";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState(null);
  const [viewMode, setViewMode] = useState("icons"); // "icons" or "list"

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const descRef = useRef(null);

  // 2-Step Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    projectId: null,
    projectTitle: "",
    step: 1, // 1 or 2
    isDeleting: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const username = getUsernameFromToken();
      if (username) {
        const userData = await userService.getByUsername(username);
        setUserId(userData.idUser || userData.id);
        await fetchProjects();
      }
    } catch (err) {
      toast.error("Error loading user data");
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err) {
      toast.error("Error loading projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    setSubmitting(true);
    try {
      await projectService.createProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        createdBy: userId,
      });
      toast.success("Project created successfully");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
      });
      if (descRef.current) {
        descRef.current.style.height = "auto";
      }
      fetchProjects();
    } catch (err) {
      toast.error("Error creating project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (project) => {
    setConfirmModal({
      isOpen: true,
      projectId: project.idProject,
      projectTitle: project.title,
      step: 1,
      isDeleting: false,
    });
  };

  const handleProceedToStep2 = () => {
    setConfirmModal((prev) => ({ ...prev, step: 2 }));
  };

  const handleBackToStep1 = () => {
    setConfirmModal((prev) => ({ ...prev, step: 1 }));
  };

  const closeConfirmModal = () => {
    if (!confirmModal.isDeleting) {
      setConfirmModal({
        isOpen: false,
        projectId: null,
        projectTitle: "",
        step: 1,
        isDeleting: false,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.projectId) return;

    setConfirmModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      await projectService.deleteProject(confirmModal.projectId);
      toast.success(`Project "${confirmModal.projectTitle}" and all related files deleted successfully`);
      setConfirmModal({
        isOpen: false,
        projectId: null,
        projectTitle: "",
        step: 1,
        isDeleting: false,
      });
      fetchProjects();
    } catch (err) {
      toast.error("Error deleting project");
      setConfirmModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Action bar & Search (Slim single row matching Companies) */}
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
              placeholder="Search projects..."
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
            onClick={() => {
              setFormData({ title: "", description: "" });
              if (descRef.current) descRef.current.style.height = "auto";
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>New project</span>
          </button>
        </div>
      </div>

      {/* Projects view (Grid or List) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 bg-white border border-[#E5E5EA] animate-pulse rounded-[10px]"
            />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === "icons" ? (
          /* Grid View - Slim Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.map((project) => (
              <div
                key={project.idProject}
                className="bg-white rounded-[10px] border border-[#E5E5EA] p-3.5 flex flex-col justify-between transition-colors hover:border-[#171717]/30 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 bg-[#FAFAFA] rounded-[8px] flex items-center justify-center border border-[#E5E5EA] text-[#1C1C1E] shrink-0 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.idProject}`)}
                      >
                        <Briefcase size={16} strokeWidth={1.5} />
                      </div>

                      <div
                        className="min-w-0 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.idProject}`)}
                      >
                        <h2 className="text-[13.5px] font-semibold text-[#1C1C1E] hover:text-[#171717] transition-colors truncate">
                          {project.title}
                        </h2>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[10px] font-medium lowercase shrink-0">
                      project
                    </span>
                  </div>

                  {project.description && (
                    <p
                      className="text-[11.5px] text-[#6E6E73] line-clamp-1 cursor-pointer mb-2"
                      onClick={() => navigate(`/projects/${project.idProject}`)}
                    >
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-[#AEAEB2] pt-1">
                    <span className="flex items-center gap-1">
                      <User size={11} strokeWidth={1.5} />
                      <span>{project.createdByUsername || "Unknown"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} strokeWidth={1.5} />
                      <span>{formatUsDate(project.createdAt)}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/projects/${project.idProject}`)}
                    className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors cursor-pointer"
                    title="View workspace"
                  >
                    <Eye size={15} strokeWidth={1.5} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(project);
                    }}
                    className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
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
                    <th className="p-3.5">project</th>
                    <th className="p-3.5">created by</th>
                    <th className="p-3.5">date</th>
                    <th className="p-3.5">description</th>
                    <th className="p-3.5 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {filteredProjects.map((project) => (
                    <tr
                      key={`list-${project.idProject}`}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project.idProject}`)}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#FAFAFA] rounded-[6px] flex items-center justify-center border border-[#E5E5EA] text-[#1C1C1E] shrink-0">
                            <Briefcase size={14} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-semibold text-[13.5px] text-[#1C1C1E]">
                              {project.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[12px] text-[#6E6E73]">
                          {project.createdByUsername || "Unknown"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[12px] text-[#6E6E73]">
                          {formatUsDate(project.createdAt)}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs md:max-w-md">
                        <p className="text-[12px] text-[#6E6E73] truncate">
                          {project.description || "No description provided."}
                        </p>
                      </td>

                      <td
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              navigate(`/projects/${project.idProject}`)
                            }
                            className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[6px] transition-colors cursor-pointer"
                            title="View workspace"
                          >
                            <Eye size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(project)}
                            className="p-1.5 text-[#AEAEB2] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-[6px] transition-colors cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
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
          <p className="text-[13px] text-[#6E6E73]">
            No projects found
          </p>
        </div>
      )}

      {/* 2-Step Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
            <button
              type="button"
              disabled={confirmModal.isDeleting}
              onClick={closeConfirmModal}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {confirmModal.step === 1 ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E5E5EA]">
                  <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                    Delete project (Step 1 of 2)
                  </h2>
                </div>

                <div className="p-3.5 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-[10px] flex items-start gap-3">
                  <AlertTriangle size={18} strokeWidth={1.5} className="text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="text-[12.5px] text-[#1C1C1E] space-y-1">
                    <p className="font-semibold">
                      Are you sure you want to delete &ldquo;{confirmModal.projectTitle}&rdquo;?
                    </p>
                    <p className="text-[#6E6E73] text-[12px]">
                      This action will delete all related documents, files, folders, and reminders contained inside this project.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
                  <button
                    type="button"
                    onClick={closeConfirmModal}
                    className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Continue to confirmation</span>
                    <ArrowRight size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#E5E5EA]">
                  <h2 className="text-[17px] font-semibold text-[#EF4444]">
                    Final Confirmation (Step 2 of 2)
                  </h2>
                </div>

                <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[10px] flex items-start gap-3">
                  <ShieldAlert size={18} strokeWidth={1.5} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div className="text-[12.5px] text-[#1C1C1E] space-y-1">
                    <p className="font-semibold text-[#EF4444]">
                      Permanent and Irreversible Action
                    </p>
                    <p className="text-[#6E6E73] text-[12px]">
                      You are about to permanently delete &ldquo;{confirmModal.projectTitle}&rdquo; and wipe all its files, directory structures, and reminders from the database and storage. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                  <button
                    type="button"
                    disabled={confirmModal.isDeleting}
                    onClick={handleBackToStep1}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                  >
                    ← Back
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={confirmModal.isDeleting}
                      onClick={closeConfirmModal}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={confirmModal.isDeleting}
                      onClick={handleConfirmDelete}
                      className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-[8px] text-[12px] font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {confirmModal.isDeleting && <Loader2 size={13} className="animate-spin" />}
                      <span>{confirmModal.isDeleting ? "Deleting..." : "Permanently delete"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                New project
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  project title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Portal Redesign"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
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
                  placeholder="briefly describe the project goals..."
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
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{submitting ? "Creating..." : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
