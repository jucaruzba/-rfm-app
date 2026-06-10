import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  X,
  ExternalLink,
  MoreVertical,
  Globe,
  Briefcase,
  Users,
  Handshake,
  User,
  Circle,
  Loader2,
  Clock,
  Archive,
} from "lucide-react";
import { companyService } from "../../../../services/companyService";
import { fileService } from "../../../../services/fileService";
import { toast } from "sonner";

// Constantes para los tipos de empresa
const COMPANY_TYPES = [
  {
    value: "MY_BUSINESS",
    label: "My Business",
    icon: Briefcase,
    color: "blue",
  },
  { value: "CLIENT", label: "Client", icon: Users, color: "green" },
  {
    value: "PARTNERSHIP",
    label: "Partnership",
    icon: Handshake,
    color: "purple",
  },
  { value: "PERSONAL", label: "Personal", icon: User, color: "orange" },
];

// Constantes para los estados de empresa
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

  // --- ESTADOS PARA EL MODAL DE CREACIÓN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "MY_BUSINESS", // Valor por defecto
    status: "ACTIVE", // Valor por defecto
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      toast.error("Error al sincronizar el directorio de empresas");
    } finally {
      setLoading(false);
    }
  };

  // --- CONTROLADOR PARA GUARDAR LA EMPRESA ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    setSubmitting(true);
    try {
      await companyService.createCompany(formData);
      toast.success("Empresa creada correctamente");
      setIsModalOpen(false); // Cerrar modal
      setFormData({
        name: "",
        description: "",
        type: "MY_BUSINESS",
        status: "ACTIVE",
      }); // Resetear formulario
      fetchCompanies(); // Recargar la lista
    } catch (err) {
      toast.error("Error al crear la empresa");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const statusConfig = COMPANY_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return "gray";

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
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#001F3F] text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Add Company
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
          placeholder="Search by corporate name..."
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
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCompanies.map((company) => (
            <div
              key={company.idCompany}
              onClick={() => navigate(`/companies/${company.idCompany}`)}
              className="group bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,31,63,0.06)] relative overflow-hidden"
            >
              {/* Efecto de fondo sutil al hacer Hover */}
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 to-[#001F3F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* TOP ROW: Logo y Badge */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden">
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

                  {/* Badge de tipo de empresa */}
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
                <div className="space-y-3">
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

              {/* FOOTER DE LA CARD: Acción visual */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400 group-hover:text-blue-600 transition-colors duration-300">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  View Profile
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
            No companies found
          </p>
        </div>
      )}

      {/* --- INTERFAZ DEL MODAL ACTUALIZADO --- */}
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
                Create <span className="text-gray-300 font-light">Company</span>
              </h2>
              <p className="text-xs text-gray-400 italic mt-1">
                Register a new operational entity.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo: Nombre */}
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

              {/* Campo: Descripción */}
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

              {/* Campo: Tipo de Empresa */}
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

              {/* Campo: Estado de Empresa */}
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

              {/* Preview visual de la selección */}
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
                          (s) => s.value === formData.status,
                        )?.label
                      }
                    </span>
                  </div>
                </div>
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
                  className="bg-[#001F3F] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
