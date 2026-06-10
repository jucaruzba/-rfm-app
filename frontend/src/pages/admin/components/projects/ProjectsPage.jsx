import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { projectService } from "../../../../services/projectService";
import { userService } from "../../../../services/userService";
import { toast } from "sonner";
import { getUsernameFromToken } from "../../../../utils/auth";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState(null);

  // --- ESTADOS PARA EL MODAL DE CREACIÓN ---
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
      toast.error("Error al cargar datos del usuario");
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      toast.error("Error al sincronizar el directorio de proyectos");
    } finally {
      setLoading(false);
    }
  };

  // --- CONTROLADOR PARA GUARDAR EL PROYECTO ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título del proyecto es obligatorio");
      return;
    }

    setSubmitting(true);
    try {
      await projectService.createProject({
        title: formData.title,
        description: formData.description,
        createdBy: userId,
      });
      toast.success("Proyecto creado correctamente");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
      });
      fetchProjects();
    } catch (err) {
      toast.error("Error al crear el proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#001F3F] tracking-tighter uppercase italic leading-none">
            Projects{" "}
            <span className="text-gray-300 font-light">Directory</span>
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001F3F] text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Add Project
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative group">
        <Search
          className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-all"
          size={22}
        />
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-[1.5rem] py-5 pl-16 pr-8 outline-none focus:border-blue-600 transition-all shadow-sm font-bold text-sm text-[#001F3F]"
        />
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem]"
            ></div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.idProject}
              onClick={() => navigate(`/projects/${project.idProject}`)}
              className="group bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,31,63,0.06)] relative overflow-hidden"
            >
              {/* Efecto de fondo sutil al hacer Hover */}
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 to-[#001F3F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* TOP ROW: Icon y Badge */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200 shadow-inner group-hover:scale-105 transition-transform duration-300 shrink-0">
                    <Briefcase size={28} className="text-blue-600" />
                  </div>

                  {/* Badge de tipo */}
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                      Project
                    </span>
                  </div>
                </div>

                {/* PROJECT INFO */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-[#001F3F] uppercase tracking-tight group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {project.title}
                  </h2>

                  <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3">
                    {project.description ||
                      "No description provided for this project."}
                  </p>

                  {/* Metadata */}
                  <div className="pt-2 space-y-1 text-[10px] text-gray-400 font-bold uppercase">
                    <p>
                      Created: <span className="text-gray-600">{formatDate(project.createdAt)}</span>
                    </p>
                    <p>
                      By: <span className="text-gray-600">{project.createdByUsername || "Unknown"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER DE LA CARD: Acción visual */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400 group-hover:text-blue-600 transition-colors duration-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Enter Workspace
                </span>
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
          <p className="text-lg font-black text-[#001F3F] uppercase italic">
            No projects found
          </p>
        </div>
      )}

      {/* --- INTERFAZ DEL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Contenedor principal del Modal */}
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Encabezado del Modal */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase italic">
                Create <span className="text-gray-300 font-light">Project</span>
              </h2>
              <p className="text-xs text-gray-400 italic mt-1">
                Start a new project workspace.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo: Título */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Portal Redesign"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-sm text-[#001F3F]"
                />
              </div>

              {/* Campo: Descripción */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Description
                </label>
                <textarea
                  rows="4"
                  placeholder="Briefly describe the project goals and scope..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 outline-none focus:border-blue-600 focus:bg-white transition-all font-medium text-sm text-[#001F3F] resize-none"
                />
              </div>

              {/* Acciones del formulario */}
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
                  className="bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Project"
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
