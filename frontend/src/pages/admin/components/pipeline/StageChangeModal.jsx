import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { toast } from "sonner";

const STAGE_LABELS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUOTED: "quoted",
  CLOSED_LOST: "closed-lost",
  WON: "won",
};

const StageChangeModal = ({ isOpen, onClose, lead, targetStage, onConfirm }) => {
  const [note, setNote] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState(
    lead?.nextFollowUp || new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lead || !targetStage) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nextFollowUp) {
      toast.error("Next follow-up date is required");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        newStatus: targetStage,
        note: note.trim() || undefined,
        nextFollowUp: nextFollowUp,
      });
      onClose();
    } catch (err) {
      toast.error("Error updating stage");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="mb-4 pb-3 border-b border-[#E5E5EA]">
          <h2 className="text-[17px] font-semibold text-[#1C1C1E]">
            Log stage change
          </h2>
          <p className="text-[12.5px] text-[#6E6E73] mt-1">
            Moving <strong className="text-[#1C1C1E]">{lead.name}</strong> to{" "}
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] border border-[#5B5FEF]/20 lowercase">
              {STAGE_LABELS[targetStage] || targetStage}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#FAFAFA] p-3 rounded-[10px] border border-[#E5E5EA] text-[12px] text-[#5B5FEF] leading-relaxed">
            Stage change and logging are the same action. The follow-up date is
            required every time — you can't move a lead without saying when
            you'll act next.
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
              what happened / note (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Call connected, discussed pricing for basic package, requested proposal by Friday..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium lowercase text-[#EF4444] flex items-center gap-1">
              <span>next follow-up *required</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-2 px-3 outline-none focus:border-[#171717] text-[13px] text-[#1C1C1E] cursor-pointer"
              />
            </div>
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
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StageChangeModal;
