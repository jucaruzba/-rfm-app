import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Check,
} from "lucide-react";
import { leadService } from "../../../../services/leadService";
import { toast } from "sonner";
import NewLeadModal from "./NewLeadModal";
import StageChangeModal from "./StageChangeModal";
import LeadDetailModal from "./LeadDetailModal";

const COLUMNS = [
  { id: "NEW", label: "new", dotColor: "#5B5FEF" },
  { id: "CONTACTED", label: "contacted", dotColor: "#F59E0B" },
  { id: "QUOTED", label: "quoted", dotColor: "#5B5FEF" },
];

const PipelinePage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & toolbar toggles
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [showClosedLost, setShowClosedLost] = useState(false);

  // Modals state
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stageChangeData, setStageChangeData] = useState({
    isOpen: false,
    lead: null,
    targetStage: null,
  });

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getActiveLeads();
      setLeads(data || []);
    } catch (err) {
      toast.error("Error loading pipeline leads");
    } finally {
      setLoading(false);
    }
  };

  // Helper for date badge format & color
  const getFollowUpBadge = (dateStr) => {
    if (!dateStr) return null;
    const isToday = dateStr === todayStr;
    const isOverdue = dateStr < todayStr;

    // Format display like "Sep 11", "Sep 5 · overdue", or "Today"
    const parsed = new Date(dateStr + "T00:00:00");
    const monthDay = parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (isOverdue) {
      return (
        <span className="text-[11px] font-medium text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 rounded-[6px]">
          {monthDay} · overdue
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="text-[11px] font-medium text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded-[6px]">
          Today
        </span>
      );
    }

    return (
      <span className="text-[11.5px] font-medium text-[#8E8E93]">
        {monthDay}
      </span>
    );
  };

  // Count metrics for toolbar chips
  const dueTodayCount = leads.filter(
    (l) => l.status !== "CLOSED_LOST" && l.status !== "WON" && l.nextFollowUp === todayStr
  ).length;

  const closedLostCount = leads.filter((l) => l.status === "CLOSED_LOST").length;

  // Filtered leads based on dueTodayOnly and showClosedLost
  const getFilteredLeadsForColumn = (columnId) => {
    return leads.filter((lead) => {
      if (lead.status !== columnId) return false;
      if (dueTodayOnly && lead.nextFollowUp !== todayStr) return false;
      return true;
    });
  };

  // Handle stage change
  const handleStageChangeSubmit = async ({ newStatus, note, nextFollowUp }) => {
    if (!stageChangeData.lead) return;
    try {
      await leadService.changeStage(stageChangeData.lead.idLead, {
        newStatus,
        note,
        nextFollowUp,
      });
      toast.success("Stage updated and logged");
      fetchLeads();
      // If detail modal is open for this lead, update it
      if (selectedLead && selectedLead.idLead === stageChangeData.lead.idLead) {
        const refreshed = await leadService.getLeadById(selectedLead.idLead);
        setSelectedLead(refreshed);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage");
      throw err;
    }
  };

  // Handle Mark as Won
  const handleMarkAsWon = async (lead) => {
    try {
      await leadService.markAsWon(lead.idLead);
      toast.success(
        `Lead "${lead.name}" won! Converted to Client company with onboarding checklist.`
      );
      if (selectedLead) setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error converting lead");
    }
  };

  // Handle Not moving forward (Lost)
  const handleMarkAsLost = async (lead) => {
    try {
      await leadService.markAsLost(lead.idLead);
      toast.success(`Lead "${lead.name}" moved to closed-lost.`);
      if (selectedLead) setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating lead");
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (leadId) => {
    try {
      await leadService.deleteLead(leadId);
      toast.success("Lead deleted");
      if (selectedLead) setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  // Handle Update Lead
  const handleUpdateLead = async (leadId, payload) => {
    await leadService.updateLead(leadId, payload);
    fetchLeads();
    const refreshed = await leadService.getLeadById(leadId);
    setSelectedLead(refreshed);
  };

  return (
    <div className="space-y-5">
      {/* Top Notification / Objective Banner */}
      <div className="bg-[#5B5FEF]/5 border border-[#5B5FEF]/15 rounded-[12px] p-4 text-[#5B5FEF] text-[13px] leading-relaxed flex items-center justify-between">
        <p className="font-medium">
          The point: never let someone who showed interest get forgotten. Mark a
          lead Won and watch it leave the board entirely — it becomes a Client in
          Companies instead.
        </p>
      </div>

      {/* Toolbar: Chips + New Lead Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Due Today Filter Chip */}
          <button
            type="button"
            onClick={() => setDueTodayOnly(!dueTodayOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors border cursor-pointer ${
              dueTodayOnly
                ? "bg-[#171717] text-white border-[#171717]"
                : "bg-white text-[#6E6E73] hover:text-[#1C1C1E] border-[#E5E5EA] hover:bg-[#FAFAFA]"
            }`}
          >
            <span>due today · {dueTodayCount}</span>
          </button>

          {/* Closed-lost Toggle Chip */}
          <button
            type="button"
            onClick={() => setShowClosedLost(!showClosedLost)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors border cursor-pointer ${
              showClosedLost
                ? "bg-[#6B7280] text-white border-[#6B7280]"
                : "bg-white text-[#6E6E73] hover:text-[#1C1C1E] border-[#E5E5EA] hover:bg-[#FAFAFA]"
            }`}
          >
            <span>closed-lost · {closedLostCount}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsNewLeadModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#5B5FEF] hover:bg-[#4B4FE0] text-white px-4 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={14} strokeWidth={2} />
          <span>New lead</span>
        </button>
      </div>

      {/* Kanban Board Container */}
      <div
        className={`grid gap-4 items-start ${
          showClosedLost
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-3"
        }`}
      >
        {COLUMNS.map((col) => {
          const columnLeads = getFilteredLeadsForColumn(col.id);

          return (
            <div
              key={col.id}
              className="bg-[#F8F9FA] rounded-[14px] border border-[#E5E5EA] p-3 flex flex-col min-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.dotColor }}
                  />
                  <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] lowercase">
                    {col.label}
                  </h3>
                </div>
                <span className="text-[12px] font-medium text-[#8E8E93]">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 flex-1">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-24 bg-white border border-[#E5E5EA] rounded-[10px] animate-pulse"
                      />
                    ))}
                  </div>
                ) : columnLeads.length > 0 ? (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.idLead}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white rounded-[10px] border border-[#E5E5EA] p-3.5 hover:border-[#171717]/30 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] group"
                    >
                      <div className="space-y-1">
                        <h4 className="text-[13.5px] font-semibold text-[#1C1C1E] group-hover:text-[#5B5FEF] transition-colors leading-tight">
                          {lead.name}
                        </h4>
                        <p className="text-[12px] text-[#6E6E73] truncate">
                          {lead.companyName || "—"}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#E5E5EA]/60 flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#1C1C1E]">
                          {lead.value
                            ? `$${Number(lead.value).toLocaleString()}`
                            : "—"}
                        </span>
                        <div>{getFollowUpBadge(lead.nextFollowUp)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex items-center justify-center border border-dashed border-[#E5E5EA] rounded-[10px] text-[12px] text-[#AEAEB2]">
                    No leads in {col.label}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Optional 4th Column: Closed-lost (Revealed via toggle) */}
        {showClosedLost && (
          <div className="bg-[#F8F9FA] rounded-[14px] border border-[#E5E5EA] p-3 flex flex-col min-h-[600px] animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
                <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] lowercase">
                  closed-lost
                </h3>
              </div>
              <span className="text-[12px] font-medium text-[#8E8E93]">
                {getFilteredLeadsForColumn("CLOSED_LOST").length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {getFilteredLeadsForColumn("CLOSED_LOST").map((lead) => (
                <div
                  key={lead.idLead}
                  onClick={() => setSelectedLead(lead)}
                  className="bg-white/70 rounded-[10px] border border-[#E5E5EA] p-3.5 hover:border-[#171717]/30 transition-all cursor-pointer opacity-75 hover:opacity-100"
                >
                  <div className="space-y-1">
                    <h4 className="text-[13.5px] font-semibold text-[#1C1C1E] leading-tight">
                      {lead.name}
                    </h4>
                    <p className="text-[12px] text-[#6E6E73] truncate">
                      {lead.companyName || "—"}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E5E5EA]/60 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#6E6E73]">
                      {lead.value
                        ? `$${Number(lead.value).toLocaleString()}`
                        : "—"}
                    </span>
                    <span className="text-[11px] text-[#8E8E93]">
                      {lead.nextFollowUp || "—"}
                    </span>
                  </div>
                </div>
              ))}
              {getFilteredLeadsForColumn("CLOSED_LOST").length === 0 && (
                <div className="h-32 flex items-center justify-center border border-dashed border-[#E5E5EA] rounded-[10px] text-[12px] text-[#AEAEB2]">
                  No closed-lost leads
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onLeadCreated={async (payload) => {
          await leadService.createLead(payload);
          fetchLeads();
        }}
      />

      {/* Stage Change Modal ("Log it" popup) */}
      <StageChangeModal
        isOpen={stageChangeData.isOpen}
        lead={stageChangeData.lead}
        targetStage={stageChangeData.targetStage}
        onClose={() =>
          setStageChangeData({ isOpen: false, lead: null, targetStage: null })
        }
        onConfirm={handleStageChangeSubmit}
      />

      {/* Lead Detail & Actions Drawer/Modal */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={!!selectedLead}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onMarkAsWon={handleMarkAsWon}
          onMarkAsLost={handleMarkAsLost}
          onOpenStageChange={(lead, target) => {
            setStageChangeData({
              isOpen: true,
              lead: lead,
              targetStage: target,
            });
          }}
          onDeleteLead={handleDeleteLead}
          onUpdateLead={handleUpdateLead}
        />
      )}
    </div>
  );
};

export default PipelinePage;
