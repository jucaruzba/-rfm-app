import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  X,
  Loader2,
  Calendar,
  User,
  ArrowRight,
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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
      toast.success("Project created");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
      });
      fetchProjects();
    } catch (err) {
      toast.error("Error creating project");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
            Projects
          </h1>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            {projects.length} total projects
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>New project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
          size={15}
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#E5E5EA] rounded-[10px] py-2.5 pl-9 pr-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] transition-all"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 bg-white border border-[#E5E5EA] animate-pulse rounded-[12px]"
            />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.idProject}
              onClick={() => navigate(`/projects/${project.idProject}`)}
              className="group bg-white rounded-[12px] border border-[#E5E5EA] p-5 flex flex-col justify-between cursor-pointer transition-colors hover:border-[#171717]/30 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center shrink-0">
                    <Briefcase size={18} strokeWidth={1.5} />
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[10.5px] font-medium lowercase">
                    project
                  </span>
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold text-[#1C1C1E] transition-colors line-clamp-1">
                    {project.title}
                  </h2>
                  <p className="text-[12.5px] text-[#6E6E73] line-clamp-2 mt-1">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#AEAEB2] pt-1 border-t border-[#E5E5EA]">
                  <span className="flex items-center gap-1">
                    <User size={12} strokeWidth={1.5} />
                    <span>{project.createdByUsername || "Unknown"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} strokeWidth={1.5} />
                    <span>{formatUsDate(project.createdAt)}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[12px] text-[#6E6E73] group-hover:text-[#1C1C1E] transition-colors">
                <span className="font-medium">Open project</span>
                <ArrowRight size={13} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[12px] border border-[#E5E5EA] text-center">
          <p className="text-[13px] text-[#6E6E73]">
            No projects found
          </p>
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
                  rows="3"
                  placeholder="briefly describe the project goals..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none"
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
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save project"
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

export default ProjectsPage;

