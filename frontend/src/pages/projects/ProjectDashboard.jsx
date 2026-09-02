import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Briefcase,
  Loader2,
  Edit3,
  X,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { toast } from "sonner";
import { formatUsDate } from "../../utils/dateUtils";

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const data = await projectService.getProject(projectId);
      setProject(data);
      setEditForm({
        title: data.title || "",
        description: data.description || "",
      });
    } catch (err) {
      toast.error("Error loading project information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editForm.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    setUpdating(true);
    try {
      const updatedProject = await projectService.updateProject(projectId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });
      setProject(updatedProject);
      setIsEditing(false);
      toast.success("Project updated");
    } catch (err) {
      toast.error("Error updating project");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#171717]" size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Main Project Card */}
      <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-6 sm:p-8 space-y-6 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E5E5EA]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[12px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center shrink-0">
              <Briefcase size={26} strokeWidth={1.5} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[11px] font-medium lowercase">
                  project
                </span>
              </div>
              <h1 className="text-[22px] font-semibold text-[#1C1C1E]">
                {project?.title}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-[#E5E5EA] bg-white text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] text-[12.5px] font-medium transition-colors self-start cursor-pointer"
          >
            <Edit3 size={13} strokeWidth={1.5} />
            <span>Edit project</span>
          </button>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
            description
          </label>
          <p className="text-[13.5px] text-[#1C1C1E] leading-relaxed whitespace-pre-line">
            {project?.description || "No description provided for this project."}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E5E5EA]">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 flex items-center gap-3">
            <User size={16} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <div>
              <p className="text-[10.5px] font-medium lowercase text-[#6E6E73]">
                created by
              </p>
              <p className="text-[13px] font-medium text-[#1C1C1E]">
                {project?.createdByUsername || "Unknown"}
              </p>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 flex items-center gap-3">
            <Calendar size={16} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <div>
              <p className="text-[10.5px] font-medium lowercase text-[#6E6E73]">
                created date
              </p>
              <p className="text-[13px] font-medium text-[#1C1C1E]">
                {formatUsDate(project?.createdAt)}
              </p>
            </div>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 flex items-center gap-3">
            <Clock size={16} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <div>
              <p className="text-[10.5px] font-medium lowercase text-[#6E6E73]">
                last updated
              </p>
              <p className="text-[13px] font-medium text-[#1C1C1E]">
                {formatUsDate(project?.updatedAt || project?.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                Edit project
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  project title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  rows="4"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none"
                />
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
                  type="button"
                  disabled={updating}
                  onClick={handleUpdateProject}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {updating && <Loader2 size={13} className="animate-spin" />}
                  <span>Save changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
