import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Loader2,
  Edit3,
  X,
  Calendar,
  User,
  Clock,
  FolderTree,
  FileText,
  Bell,
  ArrowRight,
  Layers,
  ChevronRight,
  Plus,
  ShieldCheck,
  Folder,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { projectObjectService } from "../../services/projectObjectService";
import { toast } from "sonner";
import { formatUsDate } from "../../utils/dateUtils";

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [project, setProject] = useState(null);
  const [objects, setObjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  // Estado para editar objeto
  const [editingObject, setEditingObject] = useState(null);
  const [editObjectForm, setEditObjectForm] = useState({
    title: "",
    description: "",
  });
  const [updatingObject, setUpdatingObject] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, objectsData] = await Promise.all([
        projectService.getProject(projectId),
        projectObjectService.getObjectsByProject(projectId).catch(() => []),
      ]);

      setProject(projectData);
      setObjects(objectsData || []);
      setEditForm({
        title: projectData.title || "",
        description: projectData.description || "",
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

  const handleOpenEditObject = (obj, e) => {
    if (e) e.stopPropagation();
    setEditingObject(obj);
    setEditObjectForm({
      title: obj.title || "",
      description: obj.description || "",
    });
  };

  const handleUpdateObject = async (e) => {
    e.preventDefault();
    if (!editingObject || !editObjectForm.title.trim()) {
      toast.error("Object title is required");
      return;
    }

    setUpdatingObject(true);
    try {
      const updated = await projectObjectService.updateObject(
        projectId,
        editingObject.idObject,
        {
          title: editObjectForm.title.trim(),
          description: editObjectForm.description.trim(),
        }
      );

      setObjects((prev) =>
        prev.map((o) =>
          o.idObject === editingObject.idObject ? { ...o, ...updated } : o
        )
      );
      setEditingObject(null);
      toast.success("Object updated successfully");
    } catch (err) {
      toast.error("Error updating object");
    } finally {
      setUpdatingObject(false);
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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Main Project Card */}
      <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center shrink-0">
              <Briefcase size={22} strokeWidth={1.5} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] rounded-full text-[11px] font-medium lowercase">
                  active project
                </span>
              </div>
              <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#1C1C1E]">
                {project?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5EA] bg-white text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] text-[12px] font-medium transition-colors cursor-pointer"
            >
              <Edit3 size={13} strokeWidth={1.5} />
              <span>Edit project</span>
            </button>

            <button
              onClick={() => navigate(`/projects/${projectId}/objects`)}
              className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
            >
              <FolderTree size={14} strokeWidth={1.5} />
              <span>Open objects</span>
              <ArrowRight size={13} strokeWidth={1.5} className="ml-0.5" />
            </button>
          </div>
        </div>

        {/* Project Description */}
        <div className="space-y-1">
          <p className="text-[13.5px] text-[#3C3C43] leading-relaxed whitespace-pre-line">
            {project?.description || "No project description provided."}
          </p>
        </div>

        {/* Metadata summary */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-[#E5E5EA] text-[12px] text-[#6E6E73]">
          <span className="flex items-center gap-1.5">
            <User size={13} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <span>Created by: <strong className="font-medium text-[#1C1C1E]">{project?.createdByUsername || "Admin"}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <span>Created: <strong className="font-medium text-[#1C1C1E]">{formatUsDate(project?.createdAt)}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} strokeWidth={1.5} className="text-[#AEAEB2]" />
            <span>Updated: <strong className="font-medium text-[#1C1C1E]">{formatUsDate(project?.updatedAt || project?.createdAt)}</strong></span>
          </span>
        </div>
      </div>

      {/* 2. Educational Section: Understanding Projects & Objects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1C1C1E]">
              Project Workspace Capabilities
            </h2>
            <p className="text-[12px] text-[#6E6E73]">
              Organize your project into objects, manage associated documents, and set milestone reminders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Capability 1: Hierarchical Objects */}
          <div
            onClick={() => navigate(`/projects/${projectId}/objects`)}
            className="bg-white rounded-[12px] border border-[#E5E5EA] p-5 hover:border-[#171717]/30 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[9px] bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                <Layers size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#1C1C1E] mb-1">
                  1. Modular Objects
                </h3>
                <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                  Objects represent functional units (phases, deliverables, milestones, or sub-components) of your project in a tree structure.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[11.5px] font-medium text-[#171717]">
              <span>{objects.length} root object{objects.length === 1 ? "" : "s"}</span>
              <ChevronRight size={14} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Capability 2: File Organization */}
          <div
            onClick={() => navigate(`/projects/${projectId}/objects`)}
            className="bg-white rounded-[12px] border border-[#E5E5EA] p-5 hover:border-[#171717]/30 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[9px] bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#1C1C1E] mb-1">
                  2. Document Hub
                </h3>
                <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                  Store and organize assets, drawings, spreadsheets, and specifications directly inside each object, stored securely on the corporate NAS.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[11.5px] font-medium text-[#171717]">
              <span>Integrated preview & download</span>
              <ChevronRight size={14} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Capability 3: Deadlines & Reminders */}
          <div
            onClick={() => navigate(`/projects/${projectId}/objects`)}
            className="bg-white rounded-[12px] border border-[#E5E5EA] p-5 hover:border-[#171717]/30 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[9px] bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                <Bell size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[14.5px] font-semibold text-[#1C1C1E] mb-1">
                  3. Linked Reminders
                </h3>
                <p className="text-[12px] text-[#6E6E73] leading-relaxed">
                  Attach date-specific alerts, recurring checkpoints, and deadlines to specific objects to keep project deliverables on track.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E5EA] flex items-center justify-between text-[11.5px] font-medium text-[#171717]">
              <span>Calendar-integrated alerts</span>
              <ChevronRight size={14} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Objects in this Project (Direct Access list) */}
      <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <FolderTree size={16} strokeWidth={1.5} className="text-[#171717]" />
            <h2 className="text-[15px] font-semibold text-[#1C1C1E]">
              Project Objects
            </h2>
            <span className="text-[11px] font-medium bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] px-2 py-0.5 rounded-full">
              {objects.length}
            </span>
          </div>

          <button
            onClick={() => navigate(`/projects/${projectId}/objects`)}
            className="text-[12px] font-medium text-[#171717] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View in explorer</span>
            <ChevronRight size={13} strokeWidth={1.5} />
          </button>
        </div>

        {objects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {objects.map((obj) => (
              <div
                key={obj.idObject}
                onClick={() => navigate(`/projects/${projectId}/objects`)}
                className="p-3.5 bg-[#FAFAFA] hover:bg-white border border-[#E5E5EA] hover:border-[#171717]/30 rounded-[10px] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[7px] bg-white border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] shrink-0">
                    <Folder size={15} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1C1C1E] truncate group-hover:text-[#171717]">
                      {obj.title}
                    </p>
                    {obj.description && (
                      <p className="text-[11px] text-[#6E6E73] truncate">
                        {obj.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditObject(obj, e)}
                    className="p-1 text-[#AEAEB2] hover:text-[#1C1C1E] hover:bg-black/5 rounded-[6px] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Edit object description"
                  >
                    <Edit3 size={13} strokeWidth={1.5} />
                  </button>
                  <ChevronRight size={14} strokeWidth={1.5} className="text-[#AEAEB2] group-hover:text-[#1C1C1E] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] space-y-2">
            <FolderTree size={28} strokeWidth={1.5} className="mx-auto text-[#AEAEB2]" />
            <h3 className="text-[14px] font-medium text-[#1C1C1E]">
              No objects created yet
            </h3>
            <p className="text-[12px] text-[#6E6E73] max-w-sm mx-auto">
              Objects let you organize files, documents, and reminders by phase or category. Create your first object in the explorer.
            </p>
            <button
              onClick={() => navigate(`/projects/${projectId}/objects`)}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={13} strokeWidth={1.5} />
              <span>Go to objects explorer</span>
            </button>
          </div>
        )}
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

      {/* Edit Object Modal */}
      {editingObject && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
                Edit object
              </h2>
              <button
                type="button"
                onClick={() => setEditingObject(null)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleUpdateObject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  object title *
                </label>
                <input
                  type="text"
                  value={editObjectForm.title}
                  onChange={(e) =>
                    setEditObjectForm({ ...editObjectForm, title: e.target.value })
                  }
                  placeholder="enter object title..."
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  rows="3"
                  value={editObjectForm.description}
                  onChange={(e) =>
                    setEditObjectForm({ ...editObjectForm, description: e.target.value })
                  }
                  placeholder="enter object description..."
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setEditingObject(null)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingObject}
                  className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {updatingObject && <Loader2 size={13} className="animate-spin" />}
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
