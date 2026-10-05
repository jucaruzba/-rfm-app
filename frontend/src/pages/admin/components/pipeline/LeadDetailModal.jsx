import { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Trash2,
  Edit2,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../context/AuthContext";
import { leadService } from "../../../../services/leadService";
import { formatUsDate, formatUsDateTime } from "../../../../utils/dateUtils";

const STAGE_COLORS = {
  NEW: "bg-[#5B5FEF]/10 text-[#5B5FEF] border-[#5B5FEF]/20",
  CONTACTED: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  QUOTED: "bg-[#5B5FEF]/10 text-[#5B5FEF] border-[#5B5FEF]/20",
  CLOSED_LOST: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20",
  WON: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
};

const SOURCES = [
  { value: "REFERRAL", label: "Referral" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

const STATUSES = [
  { value: "NEW", label: "new" },
  { value: "CONTACTED", label: "contacted" },
  { value: "QUOTED", label: "quoted" },
  { value: "CLOSED_LOST", label: "closed-lost" },
];

const formatLeadValue = (value) => {
  const amount = value == null || value === "" ? 0 : Number(value);
  return `$${amount.toLocaleString("en-US")}`;
};

const LeadDetailModal = ({
  isOpen,
  onClose,
  lead,
  onMarkAsWon,
  onMarkAsLost,
  onDeleteLead,
  onUpdateLead,
  onOpenStageChange,
}) => {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [stageModalData, setStageModalData] = useState({
    isOpen: false,
    targetStage: null,
    note: "",
    nextFollowUp: "",
  });

  const buildForm = (current) => ({
    name: current?.name || "",
    companyName: current?.companyName || "",
    phone: current?.phone || "",
    email: current?.email || "",
    value: current?.value ?? 0,
    notes: current?.notes || "",
    nextFollowUp: current?.nextFollowUp || "",
    source: current?.source || "",
    sourceOther: current?.sourceOther || "",
    status: current?.status || "NEW",
    stageNote: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData(buildForm(lead));
      setIsEditing(false);
      setStageModalData({ isOpen: false, targetStage: null, note: "", nextFollowUp: "" });
      fetchComments(lead.idLead);
    }
  }, [lead?.idLead]);

  const fetchComments = async (idLead) => {
    try {
      const data = await leadService.getLeadComments(idLead);
      const sorted = (data || []).sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setComments(sorted);
    } catch (err) {
      setComments([]);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus !== lead.status) {
      setStageModalData({
        isOpen: true,
        targetStage: newStatus,
        note: formData.stageNote || "",
        nextFollowUp: formData.nextFollowUp || new Date().toISOString().split("T")[0],
      });
    } else {
      setFormData({
        ...formData,
        status: newStatus,
        stageNote: "",
      });
    }
  };

  if (!isOpen || !lead) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (formData.status !== lead.status) {
      if (!formData.nextFollowUp || formData.nextFollowUp === lead.nextFollowUp) {
        toast.error(`Debes ingresar la nueva fecha de contacto para el estado ${formData.status.toLowerCase()}`);
        setStageModalData({
          isOpen: true,
          targetStage: formData.status,
          note: formData.stageNote || "",
          nextFollowUp: "",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      await onUpdateLead(lead.idLead, {
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        value: formData.value === "" || formData.value == null ? 0 : parseFloat(formData.value),
        notes: formData.notes.trim() || null,
        nextFollowUp: formData.nextFollowUp || lead.nextFollowUp,
        source: formData.source || null,
        sourceOther: formData.source === "OTHER" ? (formData.sourceOther.trim() || null) : null,
        status: formData.status,
        stageNote: formData.stageNote || null,
      });
      setIsEditing(false);
      toast.success("Lead updated successfully");
    } catch (err) {
      toast.error("Failed to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser) return;
    setSendingComment(true);
    try {
      await leadService.createLeadComment({
        content: newComment,
        idLead: lead.idLead,
        idUser: authUser.id || authUser.idUser,
      });
      setNewComment("");
      fetchComments(lead.idLead);
    } catch (err) {
      toast.error("Comment failed");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (idComment) => {
    try {
      await leadService.deleteLeadComment(
        idComment,
        authUser?.id || authUser?.idUser
      );
      setComments(comments.filter((c) => c.idComment !== idComment));
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-[16px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 relative max-h-[90vh] flex flex-col">
        <div className="pb-4 border-b border-[#E5E5EA]">
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

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {lead.status !== "WON" && (
            <div className="p-3 bg-[#FAFAFA] rounded-[12px] border border-[#E5E5EA] flex flex-wrap items-center gap-2.5">
              {lead.status === "NEW" && onOpenStageChange && (
                <button
                  type="button"
                  onClick={() => onOpenStageChange(lead, "CONTACTED")}
                  className="bg-[#5B5FEF] hover:bg-[#4B4FE0] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar size={14} strokeWidth={1.5} />
                  <span>Move to Contacted</span>
                </button>
              )}
              {lead.status === "CONTACTED" && onOpenStageChange && (
                <button
                  type="button"
                  onClick={() => onOpenStageChange(lead, "QUOTED")}
                  className="bg-[#5B5FEF] hover:bg-[#4B4FE0] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar size={14} strokeWidth={1.5} />
                  <span>Move to Quoted</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onMarkAsWon(lead)}
                className="bg-[#10B981] hover:bg-[#059669] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
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
          )}

          {!isEditing ? (
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  phone
                </span>
                <p className="text-[#1C1C1E] font-medium">{lead.phone || "—"}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  email
                </span>
                <p className="text-[#1C1C1E] font-medium">{lead.email || "—"}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  deal value
                </span>
                <p className="text-[#1C1C1E] font-medium">{formatLeadValue(lead.value)}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  next follow-up
                </span>
                <p className="text-[#1C1C1E] font-medium flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#6E6E73]" />
                  <span>{formatUsDate(lead.nextFollowUp)}</span>
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#8E8E93] uppercase tracking-wide block mb-0.5">
                  created
                </span>
                <p className="text-[#6E6E73]">{formatUsDate(lead.createdAt)}</p>
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
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Value ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] cursor-pointer"
                  >
                    <option value="">— select —</option>
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1 flex items-center justify-between">
                    <span>Next follow-up / fecha contacto</span>
                    {formData.status !== lead.status && (
                      <span className="text-[#EF4444] font-medium">*requerida</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={formData.nextFollowUp}
                    onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                    className={`w-full bg-white border rounded-[8px] py-1.5 px-3 text-[13px] ${
                      formData.status !== lead.status && (!formData.nextFollowUp || formData.nextFollowUp === lead.nextFollowUp)
                        ? "border-[#EF4444] focus:border-[#EF4444]"
                        : "border-[#E5E5EA]"
                    }`}
                    required
                  />
                </div>
              </div>
              {formData.status !== lead.status && (
                <div className="bg-[#5B5FEF]/10 border border-[#5B5FEF]/20 p-2.5 rounded-[8px] flex items-center justify-between text-[12px] text-[#5B5FEF]">
                  <span>
                    Cambiando estado a <strong>{formData.status.toLowerCase()}</strong> (Fecha contacto: <strong>{formData.nextFollowUp || "Pendiente"}</strong>)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStageModalData({
                        isOpen: true,
                        targetStage: formData.status,
                        note: formData.stageNote || "",
                        nextFollowUp: formData.nextFollowUp || "",
                      })
                    }
                    className="underline font-medium hover:text-[#4B4FE0] cursor-pointer"
                  >
                    Cambiar fecha
                  </button>
                </div>
              )}
              {formData.source === "OTHER" && (
                <div>
                  <label className="text-[11px] text-[#6E6E73] block mb-1">Tell us where</label>
                  <input
                    type="text"
                    value={formData.sourceOther}
                    onChange={(e) => setFormData({ ...formData, sourceOther: e.target.value })}
                    className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px]"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] text-[#6E6E73] block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(buildForm(lead));
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-[12px] text-[#6E6E73] hover:text-[#1C1C1E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#171717] text-white px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-[#E5E5EA]">
            <h3 className="text-[13px] font-semibold text-[#1C1C1E] mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-[#AEAEB2]" />
              <span>Activity</span>
            </h3>
            {lead.activityLogs && lead.activityLogs.length > 0 ? (
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                {lead.activityLogs.map((log) => {
                  const expanded = expandedLogId === log.idLog;
                  return (
                    <button
                      type="button"
                      key={log.idLog}
                      onClick={() =>
                        setExpandedLogId(expanded ? null : log.idLog)
                      }
                      className="w-full text-left p-2 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5EA] text-[12px] cursor-pointer hover:border-[#171717]/20"
                    >
                      <div className="flex items-center justify-between gap-2 text-[#6E6E73]">
                        <span className="font-medium text-[#1C1C1E] truncate">
                          {log.fromStatus
                            ? `${log.fromStatus.toLowerCase()} → ${log.toStatus.toLowerCase()}`
                            : `Status: ${log.toStatus?.toLowerCase()}`}
                        </span>
                        <span className="text-[11px] text-[#AEAEB2] shrink-0 flex items-center gap-1">
                          {formatUsDateTime(log.createdAt)}
                          <ChevronDown
                            size={12}
                            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                          />
                        </span>
                      </div>
                      {expanded && (
                        <div className="mt-1.5 space-y-1">
                          {log.note && (
                            <p className="text-[#1C1C1E] text-[12px] whitespace-pre-wrap">
                              {log.note}
                            </p>
                          )}
                          {log.nextFollowUp && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#5B5FEF]">
                              <Calendar size={11} />
                              Next action: {formatUsDate(log.nextFollowUp)}
                            </span>
                          )}
                          {log.createdByUser && (
                            <p className="text-[11px] text-[#8E8E93]">by {log.createdByUser}</p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#AEAEB2] italic">
                No activity history logged yet.
              </p>
            )}
          </div>

          <div className="bg-[#FAFAFA] rounded-[12px] p-3.5 border border-[#E5E5EA] space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-[#6E6E73]" />
              <h4 className="text-[13px] font-semibold text-[#1C1C1E]">Comments</h4>
            </div>
            <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-3 text-[#AEAEB2] text-[12px]">
                  no comments yet
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.idComment} className="group relative">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-[#E5E5EA] text-[#6E6E73] flex items-center justify-center shrink-0">
                        <User size={12} />
                      </div>
                      <div className="flex-1 min-w-0 bg-white border border-[#E5E5EA] rounded-[8px] p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-[#1C1C1E]">
                            {comment.username}
                          </span>
                          <span className="text-[10px] text-[#AEAEB2]">
                            {formatUsDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6E6E73] mt-1 break-words">
                          {comment.content}
                        </p>
                      </div>
                      {(authUser?.id === comment.idUser ||
                        authUser?.idUser === comment.idUser) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.idComment)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EF4444]/10 rounded text-[#AEAEB2] hover:text-[#EF4444] cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-[#E5E5EA]">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-white border border-[#E5E5EA] rounded-[8px] px-3 py-1.5 outline-none focus:border-[#171717] text-[13px]"
              />
              <button
                type="submit"
                disabled={sendingComment || !newComment.trim()}
                className="bg-[#171717] text-white p-2 rounded-[8px] hover:bg-[#2C2C2E] disabled:opacity-50 cursor-pointer"
              >
                {sendingComment ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDeleteLead(lead.idLead)}
            className="text-[#EF4444] hover:bg-red-50 p-2 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1 text-[12px]"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setFormData(buildForm(lead));
                  setIsEditing(true);
                }}
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

      {stageModalData.isOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-5 relative">
            <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-1">
              Fecha de contacto requerida
            </h3>
            <p className="text-[12.5px] text-[#6E6E73] mb-3">
              Al cambiar el estado a <strong className="text-[#5B5FEF]">{stageModalData.targetStage?.toLowerCase()}</strong>, debes ingresar la fecha del contacto o siguiente seguimiento.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#EF4444] block">
                  fecha de contacto / seguimiento *requerida
                </label>
                <input
                  type="date"
                  required
                  value={stageModalData.nextFollowUp}
                  onChange={(e) =>
                    setStageModalData({ ...stageModalData, nextFollowUp: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  nota del cambio (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle o resumen del contacto..."
                  value={stageModalData.note}
                  onChange={(e) =>
                    setStageModalData({ ...stageModalData, note: e.target.value })
                  }
                  className="w-full bg-white border border-[#E5E5EA] rounded-[8px] py-1.5 px-3 text-[13px] text-[#1C1C1E] outline-none focus:border-[#171717] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => {
                    const prevStatus = lead.status;
                    setStageModalData({ isOpen: false, targetStage: null, note: "", nextFollowUp: "" });
                    if (!formData.nextFollowUp || formData.status === stageModalData.targetStage) {
                      setFormData({ ...formData, status: prevStatus });
                    }
                  }}
                  className="px-3 py-1.5 text-[12px] text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] bg-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!stageModalData.nextFollowUp) {
                      toast.error("Por favor selecciona la fecha de contacto");
                      return;
                    }
                    setFormData({
                      ...formData,
                      status: stageModalData.targetStage,
                      nextFollowUp: stageModalData.nextFollowUp,
                      stageNote: stageModalData.note,
                    });
                    setStageModalData({ isOpen: false, targetStage: null, note: "", nextFollowUp: "" });
                    toast.success("Fecha de contacto actualizada");
                  }}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#5B5FEF] hover:bg-[#4B4FE0] rounded-[8px] shadow-xs cursor-pointer"
                >
                  Confirmar fecha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailModal;
