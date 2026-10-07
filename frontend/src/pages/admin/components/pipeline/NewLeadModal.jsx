import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  companyName: "",
  interestedIn: "",
  phone: "",
  email: "",
  value: "",
  source: "",
  sourceOther: "",
  notes: "",
  nextFollowUp: "",
};

const SOURCES = [
  { value: "REFERRAL", label: "Referral" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

const NewLeadModal = ({ isOpen, onClose, onLeadCreated }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const notesRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(EMPTY_FORM);
      setSubmitting(false);
      if (notesRef.current) {
        notesRef.current.style.height = "auto";
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Lead name is required");
      return;
    }

    if (!formData.nextFollowUp) {
      toast.error("Next follow-up date is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || null,
        interestedIn: formData.interestedIn.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        value: formData.value ? parseFloat(formData.value) : 0,
        source: formData.source || null,
        sourceOther: formData.source === "OTHER" ? (formData.sourceOther.trim() || null) : null,
        notes: formData.notes.trim() || null,
        nextFollowUp: formData.nextFollowUp,
      };

      await onLeadCreated(payload);
      toast.success("Lead created successfully");
      setFormData(EMPTY_FORM);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[16px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative max-h-[92vh] overflow-y-auto">
        <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
          <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
            New lead
          </h2>
          <p className="text-[12.5px] text-[#6E6E73] mt-0.5">
            Capture contact details and a next follow-up date.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              name <span className="text-[#EF4444]">*required</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Juan Carlos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              company <span className="text-[#AEAEB2]">(optional — links to Companies)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. JC IT"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                interested in <span className="text-[#AEAEB2]">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Web design, consulting..."
                value={formData.interestedIn}
                onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                value ($) <span className="text-[#AEAEB2]">(optional)</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                phone
              </label>
              <input
                type="tel"
                placeholder="e.g. (210) 555-0142"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                email
              </label>
              <input
                type="email"
                placeholder="e.g. name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              source <span className="text-[#AEAEB2]">(optional — where they came from)</span>
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-2.5 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] cursor-pointer"
            >
              <option value="">— select —</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {formData.source === "OTHER" && (
            <div className="space-y-1 animate-in fade-in duration-100">
              <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                tell us where
              </label>
              <input
                type="text"
                placeholder="e.g. Facebook group, trade show, flyer..."
                value={formData.sourceOther}
                onChange={(e) => setFormData({ ...formData, sourceOther: e.target.value })}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              notes <span className="text-[#AEAEB2]">(optional)</span>
            </label>
            <textarea
              ref={notesRef}
              rows={2}
              placeholder="e.g. wants wholesale pricing on 3 spice blends..."
              value={formData.notes}
              onChange={(e) => {
                setFormData({ ...formData, notes: e.target.value });
                if (notesRef.current) {
                  notesRef.current.style.height = "auto";
                  notesRef.current.style.height = `${notesRef.current.scrollHeight}px`;
                }
              }}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] resize-none overflow-hidden transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#EF4444] block">
              next follow-up *required
            </label>
            <input
              type="date"
              required
              value={formData.nextFollowUp}
              onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] cursor-pointer"
            />
          </div>

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
              className="bg-[#5B5FEF] hover:bg-[#4B4FE0] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLeadModal;
