import { useState, useEffect } from "react";
import { X, Loader2, Building2, UserCircle } from "lucide-react";
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
          setCompanies(data || []);
        } catch (err) {
          toast.error("Failed to load companies");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.time) {
      toast.error("Please specify a time");
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
      toast.success("Activity registered");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Plain Header */}
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex justify-between items-center shrink-0">
          <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
            New activity
          </h2>
          <button
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                activity title *
              </label>
              <input
                required
                type="text"
                value={formData.title}
                className="w-full bg-white rounded-[8px] px-3 py-2 text-[13px] text-[#1C1C1E] border border-[#E5E5EA] focus:border-[#171717] outline-none"
                placeholder="e.g. Technical Review"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                time *
              </label>
              <input
                required
                type="time"
                value={formData.time}
                className="w-full bg-white rounded-[8px] px-3 py-2 text-[13px] text-[#1C1C1E] border border-[#E5E5EA] focus:border-[#171717] outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Linking Section */}
          <div className="p-4 bg-[#FAFAFA] rounded-[10px] border border-[#E5E5EA] space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={
                  formData.externalReferenceName
                    ? "opacity-30 grayscale pointer-events-none space-y-1"
                    : "space-y-1"
                }
              >
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  link to company
                </label>
                <select
                  className="w-full bg-white rounded-[8px] px-3 py-2 text-[12.5px] text-[#1C1C1E] border border-[#E5E5EA] focus:border-[#171717] outline-none cursor-pointer"
                  value={formData.idCompany}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idCompany: e.target.value,
                      externalReferenceName: "",
                    })
                  }
                >
                  <option value="">-- Internal entity --</option>
                  {companies.map((c) => (
                    <option key={c.idCompany} value={c.idCompany}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={
                  formData.idCompany
                    ? "opacity-30 grayscale pointer-events-none space-y-1"
                    : "space-y-1"
                }
              >
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  external reference
                </label>
                <input
                  type="text"
                  placeholder="Third party name..."
                  className="w-full bg-white rounded-[8px] px-3 py-2 text-[12.5px] text-[#1C1C1E] border border-[#E5E5EA] focus:border-[#171717] outline-none"
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
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              description
            </label>
            <textarea
              value={formData.description}
              className="w-full bg-white rounded-[8px] px-3 py-2 text-[13px] text-[#1C1C1E] border border-[#E5E5EA] focus:border-[#171717] outline-none h-20 resize-none"
              placeholder="Provide details..."
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Footer action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Saving...</span>
                </>
              ) : (
                "Save activity"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActivityModal;

