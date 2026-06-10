import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Building2,
  Upload,
  Globe,
  CheckCircle2,
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

// Constantes para los tipos de empresa con colores mejorados
const COMPANY_TYPES = [
  { 
    value: "MY_BUSINESS", 
    label: "My Business", 
    icon: Briefcase, 
    color: "blue",
    bgClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconClass: "text-blue-600"
  },
  { 
    value: "CLIENT", 
    label: "Client", 
    icon: Users, 
    color: "green",
    bgClass: "bg-green-50 text-green-700 border-green-200",
    iconClass: "text-green-600"
  },
  { 
    value: "PARTNERSHIP", 
    label: "Partnership", 
    icon: Handshake, 
    color: "purple",
    bgClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconClass: "text-purple-600"
  },
  { 
    value: "PERSONAL", 
    label: "Personal", 
    icon: User, 
    color: "orange",
    bgClass: "bg-orange-50 text-orange-700 border-orange-200",
    iconClass: "text-orange-600"
  },
];

// Constantes para los estados de empresa con colores mejorados
const COMPANY_STATUSES = [
  { 
    value: "ACTIVE", 
    label: "Active", 
    icon: Circle, 
    color: "green",
    bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconClass: "text-emerald-600"
  },
  { 
    value: "IN_PROGRESS", 
    label: "In Progress", 
    icon: Loader2, 
    color: "blue",
    bgClass: "bg-sky-50 text-sky-700 border-sky-200",
    iconClass: "text-sky-600"
  },
  { 
    value: "ON_HOLD", 
    label: "On Hold", 
    icon: Clock, 
    color: "yellow",
    bgClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-600"
  },
  { 
    value: "ARCHIVED", 
    label: "Archived", 
    icon: Archive, 
    color: "gray",
    bgClass: "bg-gray-100 text-gray-600 border-gray-200",
    iconClass: "text-gray-500"
  },
];

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
      toast.error("Error al cargar la información de la entidad");
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
      toast.success("Logo corporativo actualizado");
    } catch (err) {
      toast.error("Error en la carga del activo");
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
      toast.success("Tipo y estado actualizados correctamente");
    } catch (err) {
      toast.error("Error al actualizar los datos");
    } finally {
      setUpdating(false);
    }
  };

  const getTypeConfig = (typeValue) => {
    return COMPANY_TYPES.find((t) => t.value === typeValue) || COMPANY_TYPES[0];
  };

  const getStatusConfig = (statusValue) => {
    return COMPANY_STATUSES.find((s) => s.value === statusValue) || COMPANY_STATUSES[0];
  };

  const getTypeLabel = (typeValue) => getTypeConfig(typeValue).label;
  const getStatusLabel = (statusValue) => getStatusConfig(statusValue).label;
  const getTypeStyles = (typeValue) => getTypeConfig(typeValue).bgClass;
  const getStatusStyles = (statusValue) => getStatusConfig(statusValue).bgClass;

  const getLogoUrl = (path) => {
    return fileService.getFileUrl(path);
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
          <Building2 size={280} />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* CONTENEDOR DEL LOGO */}
          <div className="relative group shrink-0">
            <div className="w-44 h-44 bg-white rounded-3xl p-5 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-blue-500/20">
              {company?.logoPath ? (
                <img
                  src={getLogoUrl(company.logoPath)}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 size={72} className="text-gray-400" />
              )}
            </div>

            {/* Capa flotante para subir logo */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <input
                type="file"
                className="hidden"
                onChange={handleLogoUpload}
                accept="image/*"
              />
              <div className="text-center text-white p-4">
                <Upload size={24} className="mx-auto mb-2 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest block">
                  Upload Logo
                </span>
              </div>
            </label>
          </div>

          {/* TEXTOS Y DETALLES */}
          <div className="flex-1 text-center md:text-left space-y-4 pt-1">
            <div className="space-y-2">
              <span className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-md backdrop-blur-sm">
                Corporate Entity
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                {company?.name}
              </h1>
            </div>

            {/* Badges de Tipo y Estado mejorados */}
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              {/* Tipo de Empresa - con estilo mejorado */}
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${getTypeStyles(company?.type)} shadow-sm`}>
                {(() => {
                  const TypeIcon = getTypeConfig(company?.type).icon;
                  return <TypeIcon size={14} className={getTypeConfig(company?.type).iconClass} />;
                })()}
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {getTypeLabel(company?.type)}
                </span>
              </div>

              {/* Estado - con estilo mejorado */}
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${getStatusStyles(company?.status)} shadow-sm`}>
                {(() => {
                  const StatusIcon = getStatusConfig(company?.status).icon;
                  return <StatusIcon size={14} className={getStatusConfig(company?.status).iconClass} />;
                })()}
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {getStatusLabel(company?.status)}
                </span>
              </div>

              {/* Botón Editar */}
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 text-white transition-all duration-300 hover:scale-105"
              >
                <Edit3 size={14} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Edit Type & Status
                </span>
              </button>

              {/* Badge NAS */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-gray-300">
                <Globe size={14} className="text-blue-400" />
                <span className="text-[11px] font-medium tracking-wide">
                  NAS:{" "}
                  <span className="font-mono text-blue-300 font-bold">
                    {company?.nasRootFolder?.split("/").pop() || "N/A"}
                  </span>
                </span>
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="pt-4 max-w-3xl">
              <p className="text-sm md:text-base text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                {company?.description ||
                  "No official core description has been declared for this operational unit."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN - mantiene los colores consistentes */}
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
                Edit <span className="text-gray-300 font-light">Entity</span>
              </h2>
              <p className="text-xs text-gray-400 italic mt-1">
                Update company type and operational status
              </p>
            </div>

            <div className="space-y-5">
              {/* Tipo de Empresa */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Company Type *
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
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

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001F3F]">
                  Status *
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
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

              {/* Preview de cambios con colores consistentes */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border border-gray-100">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Preview Changes
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase border ${getTypeStyles(editForm.type)}`}>
                    {(() => {
                      const Icon = getTypeConfig(editForm.type).icon;
                      return <Icon size={12} className={getTypeConfig(editForm.type).iconClass} />;
                    })()}
                    {getTypeLabel(editForm.type)}
                  </div>
                  <span className="text-gray-300 text-xs">→</span>
                  <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase border ${getStatusStyles(editForm.status)}`}>
                    {(() => {
                      const Icon = getStatusConfig(editForm.status).icon;
                      return <Icon size={12} className={getStatusConfig(editForm.status).iconClass} />;
                    })()}
                    {getStatusLabel(editForm.status)}
                  </div>
                </div>
              </div>

              {editForm.status === "ARCHIVED" && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium">
                    Archiving this company will mark it as inactive. You can change this status later.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTypeAndStatus}
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

export default CompanyDashboard;