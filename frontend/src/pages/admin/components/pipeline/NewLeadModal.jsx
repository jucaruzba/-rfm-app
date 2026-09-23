import { useState, useRef } from "react";
import { X, Calendar } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { value: "REFERRAL", label: "Referral" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

const NewLeadModal = ({ isOpen, onClose, onLeadCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phoneOrEmail: "",
    value: "",
    source: "",
    sourceOther: "",
    notes: "",
    nextFollowUp: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const notesRef = useRef(null);

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
        phoneOrEmail: formData.phoneOrEmail.trim() || null,
        value: formData.value ? parseFloat(formData.value) : null,
        source: formData.source || null,
        sourceOther: formData.source === "OTHER" ? (formData.sourceOther.trim() || null) : null,
        notes: formData.notes.trim() || null,
        nextFollowUp: formData.nextFollowUp,
      };

      await onLeadCreated(payload);
      toast.success("Lead created successfully");
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
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
          <h2 className="text-[18px] font-semibold text-[#1C1C1E]">
            New lead
          </h2>
          <p className="text-[12.5px] text-[#6E6E73] mt-0.5">
            Only 4 fields — that's all a lead needs to start.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
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

          {/* Company */}
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

          {/* Phone or Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              phone or email <span className="text-[#AEAEB2]">(optional, but you'll want it to follow up)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. (210) 555-0142"
              value={formData.phoneOrEmail}
              onChange={(e) => setFormData({ ...formData, phoneOrEmail: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
            />
          </div>

          {/* Value */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              value ($) <span className="text-[#AEAEB2]">(optional)</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1200"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#5B5FEF] text-[13px] text-[#1C1C1E] transition-all"
            />
          </div>

          {/* Source */}
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

          {/* Source Other Conditional */}
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

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              notes — what are they interested in <span className="text-[#AEAEB2]">(optional, fill in when you know)</span>
            </label>
            <textarea
              ref={notesRef}
              rows={2}
              placeholder="e.g. wants wholesale pricing on 3 spice blends, also asked about a subscription box option..."
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

          {/* Next follow up (required) */}
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

          {/* Actions */}
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
