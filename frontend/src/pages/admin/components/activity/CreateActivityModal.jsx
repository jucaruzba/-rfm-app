import { useState, useEffect } from "react";
import { X, Loader2, Building2, UserCircle, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { companyService } from "../../../../services/companyService";
import { activityService } from "../../../../services/activityService";
import { toast } from "sonner";

const CreateActivityModal = ({
  isOpen,
  onClose,
  selectedDate,
  idCompany,
  onActivityCreated,
}) => {
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    title: "",
    description: "",
    time: "",
    idCompany: "",
    externalReferenceName: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
          const data = await companyService.getCompanies();
          setCompanies(data);
        } catch (err) {
          toast.error("Failed to load companies catalog");
        } finally {
          setLoadingCompanies(false);
        }
      };
      fetchCompanies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && idCompany) {
      setFormData((prev) => ({
        ...prev,
        idCompany: String(idCompany),
        externalReferenceName: "",
      }));
    }
  }, [isOpen, idCompany]);

  const displayDate = selectedDate
    ? format(parseISO(selectedDate), "EEEE, dd MMMM yyyy")
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time) {
      toast.error("Please specify a time for the activity");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        eventDate: `${selectedDate}T${formData.time}:00`,
        idCompany: formData.idCompany ? Number(formData.idCompany) : null,
        externalReferenceName: formData.externalReferenceName || "",
      };

      await activityService.createActivity(payload);
      toast.success("Activity successfully registered");
      setFormData(initialFormState);
      if (onActivityCreated) onActivityCreated();
      onClose();
    } catch (err) {
      toast.error("Error saving activity");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#001F3F]/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Container con scroll interno para pantallas muy pequeñas */}
      <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 border border-gray-100 max-h-[95vh] flex flex-col">
        {/* Header - Navy Solid (Ajustado para móvil) */}
        <div className="bg-[#001F3F] p-6 sm:p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white/10 p-2 sm:p-3 rounded-2xl hidden xs:block">
              <Calendar size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">
                New Activity
              </h2>
              <p className="text-[9px] sm:text-[10px] text-blue-300 font-bold uppercase tracking-[0.2em]">
                {displayDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-all p-2 bg-white/10 rounded-full text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body con scroll independiente */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scroll"
        >
          {/* Main Title & Time - Grid adaptativo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block italic">
                Activity Title
              </label>
              <input
                required
                type="text"
                value={formData.title}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-2 border-transparent focus:border-[#001F3F] focus:bg-white outline-none transition-all"
                placeholder="e.g. Technical Review"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block italic">
                Event Time
              </label>
              <input
                required
                type="time"
                value={formData.time}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-2 border-transparent focus:border-[#001F3F] focus:bg-white outline-none transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Linking Section - Company vs External */}
          <div className="p-4 sm:p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 italic">
              {/* Select Company */}
              <div
                className={
                  formData.externalReferenceName
                    ? "opacity-30 grayscale pointer-events-none"
                    : ""
                }
              >
                <label className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-[#001F3F] mb-2 tracking-tighter">
                  <Building2 size={14} /> Link to Company
                </label>
                <select
                  className="w-full bg-white rounded-xl px-4 py-3 text-xs font-black border-2 border-transparent focus:border-[#001F3F] outline-none shadow-sm"
                  value={formData.idCompany}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idCompany: e.target.value,
                      externalReferenceName: "",
                    })
                  }
                >
                  <option value="">-- Internal Entity --</option>
                  {companies.map((c) => (
                    <option key={c.idCompany} value={c.idCompany}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* External Name */}
              <div
                className={
                  formData.idCompany
                    ? "opacity-30 grayscale pointer-events-none"
                    : ""
                }
              >
                <label className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-[#001F3F] mb-2 tracking-tighter">
                  <UserCircle size={14} /> External Reference
                </label>
                <input
                  type="text"
                  placeholder="Third party name..."
                  className="w-full bg-white rounded-xl px-4 py-3 text-xs font-black border-2 border-transparent focus:border-[#001F3F] outline-none shadow-sm"
                  value={formData.externalReferenceName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      externalReferenceName: e.target.value,
                      idCompany: "",
                    })
                  }
                />
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest leading-tight">
              * Note: You must choose either a registered company or an external
              reference.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block italic">
              Operational Details
            </label>
            <textarea
              value={formData.description}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm font-medium border-2 border-transparent focus:border-[#001F3F] focus:bg-white outline-none transition-all h-24 sm:h-28 resize-none"
              placeholder="Provide context..."
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Action Button - Sticky o fijo al final en móviles */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#001F3F] text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-4 disabled:bg-gray-400 text-xs sm:text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Processing...</span>
              </>
            ) : (
              "Authorize Activity"
            )}
          </button>
        </form>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
};

export default CreateActivityModal;
