import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Briefcase,
  Loader2,
  Edit3,
  X,
  Save,
  Calendar,
  User,
  Clock,
  Archive,
  AlertCircle,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { toast } from "sonner";

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
      toast.error("Error al cargar la información del proyecto");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    setUpdating(true);
    try {
      const updatedProject = await projectService.updateProject(projectId, {
        title: editForm.title,
        description: editForm.description,
      });
      setProject(updatedProject);
      setIsEditing(false);
      toast.success("Proyecto actualizado correctamente");
    } catch (err) {
      toast.error("Error al actualizar el proyecto");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#001F3F]" size={40} />
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 px-4">
      {/* CARD MAESTRA REFINADA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#002B54] rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_70px_rgba(0,31,63,0.22)] border border-white/10 flex flex-col gap-8">
        {/* Marca de agua de fondo */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white pointer-events-none hidden md:block">
          <Briefcase size={280} />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* CONTENEDOR DEL ICONO */}
          <div className="relative group shrink-0">
            <div className="w-44 h-44 bg-white rounded-3xl p-5 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-blue-500/20">
              <Briefcase size={72} className="text-[#001F3F]" />
            </div>
          </div>

          {/* TEXTOS Y DETALLES */}
          <div className="flex-1 text-center md:text-left space-y-4 pt-1">
            <div className="space-y-2">
              <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-md backdrop-blur-sm">
                Project Space
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                {project?.title}
              </h1>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="pt-4 max-w-3xl">
              <p className="text-sm md:text-base text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                {project?.description ||
                  "No description has been declared for this project."}
              </p>
            </div>

            {/* METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
                <User size={16} className="text-blue-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Created By
                  </p>
                  <p className="text-sm font-bold text-white">
                    {project?.createdByUsername || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
                <Calendar size={16} className="text-blue-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Created At
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatDate(project?.createdAt)}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
                <Clock size={16} className="text-blue-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Updated At
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatDate(project?.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3">
                <Briefcase size={16} className="text-blue-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Project ID
                  </p>
                  <p className="text-sm font-mono text-white font-bold">
                    {projectId}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Editar */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl flex items-center gap-2 text-white transition-all duration-300 hover:scale-105"
              >
                <Edit3 size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Edit Project
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {isEditing && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic">
                Edit <span className="text-gray-300 font-light">Project</span>
              </h2>
              <p className="text-xs text-gray-400 italic mt-1">
                Update project details
              </p>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F]"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F] resize-none h-32"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  disabled={updating}
                  className="bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Changes
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

export default ProjectDashboard;
