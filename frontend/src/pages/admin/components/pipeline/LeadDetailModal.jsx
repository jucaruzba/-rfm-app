import { useState, useRef } from "react";
import {
  X,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  DollarSign,
  Tag,
  FileText,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const STAGE_COLORS = {
  NEW: "bg-[#5B5FEF]/10 text-[#5B5FEF] border-[#5B5FEF]/20",
  CONTACTED: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  QUOTED: "bg-[#5B5FEF]/10 text-[#5B5FEF] border-[#5B5FEF]/20",
  CLOSED_LOST: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20",
  WON: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
};

const LeadDetailModal = ({
  isOpen,
  onClose,
  lead,
  onMarkAsWon,
  onMarkAsLost,
  onOpenStageChange,
  onDeleteLead,
  onUpdateLead,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: lead?.name || "",
    companyName: lead?.companyName || "",
    phoneOrEmail: lead?.phoneOrEmail || "",
    value: lead?.value || "",
    notes: lead?.notes || "",
    nextFollowUp: lead?.nextFollowUp || "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateLead(lead.idLead, {
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || null,
        phoneOrEmail: formData.phoneOrEmail.trim() || null,
        value: formData.value ? parseFloat(formData.value) : null,
        notes: formData.notes.trim() || null,
        nextFollowUp: formData.nextFollowUp || lead.nextFollowUp,
      });
      setIsEditing(false);
      toast.success("Lead updated successfully");
    } catch (err) {
      toast.error("Failed to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-[16px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-[#E5E5EA] pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center text-[10.5px] font-medium lowercase px-2.5 py-0.5 rounded-full border ${
                STAGE_COLORS[lead.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {lead.status.toLowerCase()}
            </span>
            {lead.source && (
              <span className="text-[11px] text-[#6E6E73] bg-[#FAFAFA] border border-[#E5E5EA] px-2 py-0.5 rounded-full lowercase">
                source: {lead.source.toLowerCase()}
                {lead.sourceOther ? ` (${lead.sourceOther})` : ""}
              </span>
            )}
          </div>
          <h2 className="text-[20px] font-semibold text-[#1C1C1E] tracking-tight">
            {lead.name}
          </h2>
          {lead.companyName && (
            <p className="text-[13px] text-[#6E6E73] flex items-center gap-1.5 mt-0.5">
              <Building2 size={13} className="text-[#AEAEB2]" />
              <span>{lead.companyName}</span>
            </p>
          )}
        </div>

        {/* Content Body: Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Quick Action Buttons per specification */}
          {lead.status !== "WON" && (
            <div className="p-3 bg-[#FAFAFA] rounded-[12px] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMarkAsWon(lead)}
                  className="bg-[#5B5FEF] hover:bg-[#4B4FE0] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} strokeWidth={1.5} />
                  <span>Mark as Won</span>
                </button>

                {lead.status !== "CLOSED_LOST" && (
                  <button
                    type="button"
                    onClick={() => onMarkAsLost(lead)}
                    className="bg-white hover:bg-red-50 text-[#EF4444] border border-[#E5E5EA] px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle size={14} strokeWidth={1.5} />
                    <span>Not moving forward</span>
                  </button>
                )}
              </div>

              {/* Stage Transition Dropdown Trigger */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#6E6E73]">move stage:</span>
                {["NEW", "CONTACTED", "QUOTED"].map((st) => (
                  <button
                    key={st}
                    disabled={lead.status === st}
                    onClick={() => onOpenStageChange(lead, st)}
                    className={`px-2 py-1 rounded-[6px] text-[11px] font-medium lowercase transition-all cursor-pointer ${
                      lead.status === st
                        ? "bg-[#171717] text-white opacity-90"
                        : "bg-white text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA]"
                    }`}
                  >
                    {st.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details / Edit Form */}
          {!isEditing ? (
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  phone or email
                </span>
                <p className="text-[#1C1C1E] font-medium">
                  {lead.phoneOrEmail || "—"}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  deal value
                </span>
                <p className="text-[#1C1C1E] font-medium">
                  {lead.value ? `$${Number(lead.value).toLocaleString()}` : "—"}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  next follow-up
                </span>
                <p className="text-[#1C1C1E] font-medium flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#6E6E73]" />
                  <span>{lead.nextFollowUp || "—"}</span>
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  created
                </span>
                <p className="text-[#6E6E73]">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>

              {lead.notes && (
                <div className="col-span-2 bg-[#FAFAFA] p-3 rounded-[8px] border border-[#E5E5EA]">
                  <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-1">
                    notes
                  </span>
                  <p className="text-[#1C1C1E] text-[12.5px] whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">
                    Phone / Email
                  </label>
                  <input
                    type="text"
                    value={formData.phoneOrEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneOrEmail: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#6E6E73] block mb-1">
                  Next follow-up
                </label>
                <input
                  type="date"
                  value={formData.nextFollowUp}
                  onChange={(e) =>
                    setFormData({ ...formData, nextFollowUp: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6E6E73] block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-[12px] text-[#6E6E73] hover:text-[#1C1C1E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#171717] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}

          {/* Activity / Stage Progression History */}
          <div className="pt-2 border-t border-[#E5E5EA]">
            <h3 className="text-[13px] font-semibold text-[#1C1C1E] mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-[#AEAEB2]" />
              <span>Activity & Follow-up History</span>
            </h3>

            {lead.activityLogs && lead.activityLogs.length > 0 ? (
              <div className="space-y-2.5">
                {lead.activityLogs.map((log) => (
                  <div
                    key={log.idLog}
                    className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[12px]"
                  >
                    <div className="flex items-center justify-between text-[#6E6E73] mb-1">
                      <span className="font-medium text-[#1C1C1E]">
                        {log.fromStatus
                          ? `${log.fromStatus.toLowerCase()} → ${log.toStatus.toLowerCase()}`
                          : `Status: ${log.toStatus.toLowerCase()}`}
                      </span>
                      <span className="text-[11px] text-[#AEAEB2]">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-[#1C1C1E] text-[12px] mb-1">
                        {log.note}
                      </p>
                    )}
                    {log.nextFollowUp && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#5B5FEF]">
                        <Calendar size={11} />
                        Next action: {log.nextFollowUp}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#AEAEB2] italic">
                No activity history logged yet.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDeleteLead(lead.idLead)}
            className="text-[#EF4444] hover:bg-red-50 p-2 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1 text-[12px]"
            title="Delete lead permanently"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-[#171717] hover:bg-[#2C2C2E] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
