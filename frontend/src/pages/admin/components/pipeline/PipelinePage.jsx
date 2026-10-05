import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { leadService } from "../../../../services/leadService";
import { toast } from "sonner";
import NewLeadModal from "./NewLeadModal";
import StageChangeModal from "./StageChangeModal";
import LeadDetailModal from "./LeadDetailModal";
import { formatUsDate } from "../../../../utils/dateUtils";

const COLUMNS = [
  { id: "NEW", label: "new" },
  { id: "CONTACTED", label: "contacted" },
  { id: "QUOTED", label: "quoted" },
];

const PipelinePage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [showClosedLost, setShowClosedLost] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stageChangeData, setStageChangeData] = useState({
    isOpen: false,
    lead: null,
    targetStage: null,
  });
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const draggingRef = useRef(false);
  const dragJustEndedRef = useRef(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchLeads();

    const handleGlobalDragEnd = () => {
      draggingRef.current = false;
      setDragOverColumn(null);
      setTimeout(() => {
        dragJustEndedRef.current = false;
      }, 150);
    };

    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("mouseup", handleGlobalDragEnd);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("mouseup", handleGlobalDragEnd);
    };
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

  const formatLeadValue = (value) => {
    const amount = value == null || value === "" ? 0 : Number(value);
    return `$${amount.toLocaleString("en-US")}`;
  };

  const getFollowUpBadge = (dateStr) => {
    if (!dateStr) return null;
    const isToday = dateStr === todayStr;
    const isOverdue = dateStr < todayStr;
    const monthDay = formatUsDate(dateStr);

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

  const dueTodayCount = leads.filter(
    (l) => l.status !== "CLOSED_LOST" && l.status !== "WON" && l.nextFollowUp === todayStr
  ).length;

  const closedLostCount = leads.filter((l) => l.status === "CLOSED_LOST").length;

  const sortLeads = (a, b) => {
    const aDate = a.nextFollowUp || "";
    const bDate = b.nextFollowUp || "";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  };

  const getFilteredLeadsForColumn = (columnId) => {
    return leads
      .filter((lead) => {
        if (lead.status !== columnId) return false;
        if (dueTodayOnly && lead.nextFollowUp !== todayStr) return false;
        return true;
      })
      .sort(sortLeads);
  };

  const handleStageChangeSubmit = async ({ newStatus, note, nextFollowUp }) => {
    if (!stageChangeData.lead) return;
    try {
      await leadService.changeStage(stageChangeData.lead.idLead, {
        newStatus,
        note,
        nextFollowUp,
      });
      toast.success("Stage updated and logged");
      setStageChangeData({ isOpen: false, lead: null, targetStage: null });
      fetchLeads();
      if (selectedLead && selectedLead.idLead === stageChangeData.lead.idLead) {
        const refreshed = await leadService.getLeadById(selectedLead.idLead);
        setSelectedLead(refreshed);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stage");
      throw err;
    }
  };

  const handleDropOnColumn = (columnId, event) => {
    event.preventDefault();
    setDragOverColumn(null);
    draggingRef.current = false;
    dragJustEndedRef.current = true;
    setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 150);

    const leadId = Number(event.dataTransfer.getData("text/plain"));
    if (!leadId) return;
    const lead = leads.find((l) => l.idLead === leadId);
    if (!lead || lead.status === columnId) return;

    // Open StageChangeModal to ask for contact date and note
    setStageChangeData({
      isOpen: true,
      lead: lead,
      targetStage: columnId,
    });
  };

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

  const handleUpdateLead = async (leadId, payload) => {
    await leadService.updateLead(leadId, payload);
    fetchLeads();
    const refreshed = await leadService.getLeadById(leadId);
    setSelectedLead(refreshed);
  };

  const renderLeadCard = (lead, muted = false) => (
    <div
      key={lead.idLead}
      draggable
      onDragStart={(e) => {
        draggingRef.current = true;
        dragJustEndedRef.current = false;
        e.dataTransfer.setData("text/plain", String(lead.idLead));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        draggingRef.current = false;
        dragJustEndedRef.current = true;
        setDragOverColumn(null);
        setTimeout(() => {
          dragJustEndedRef.current = false;
        }, 150);
      }}
      onClick={() => {
        if (draggingRef.current || dragJustEndedRef.current) return;
        setSelectedLead(lead);
      }}
      className={`bg-white rounded-[10px] border border-[#E5E5EA] px-3 py-2.5 hover:border-[#171717]/30 transition-all cursor-grab active:cursor-grabbing shadow-[0_1px_2px_rgba(0,0,0,0.03)] group ${
        muted ? "bg-white/70 opacity-75 hover:opacity-100" : ""
      }`}
    >
      <div className="space-y-0.5">
        <h4 className="text-[13px] font-semibold text-[#1C1C1E] group-hover:text-[#5B5FEF] transition-colors leading-tight">
          {lead.name}
        </h4>
        <p className="text-[12px] text-[#6E6E73] truncate">
          {lead.companyName || "—"}
        </p>
      </div>
      <div className="mt-2 pt-2 border-t border-[#E5E5EA]/60 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-[#1C1C1E]">
          {formatLeadValue(lead.value)}
        </span>
        <div>{getFollowUpBadge(lead.nextFollowUp)}</div>
      </div>
    </div>
  );

  const renderColumn = (col) => {
    const columnLeads = getFilteredLeadsForColumn(col.id);
    return (
      <div
        key={col.id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverColumn(col.id);
        }}
        onDragLeave={() => setDragOverColumn((current) => (current === col.id ? null : current))}
        onDrop={(e) => handleDropOnColumn(col.id, e)}
        className={`bg-[#F8F9FA] rounded-[14px] border p-2.5 flex flex-col min-h-[600px] max-w-[280px] w-full ${
          dragOverColumn === col.id ? "border-[#5B5FEF] bg-[#5B5FEF]/5" : "border-[#E5E5EA]"
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
          <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] lowercase">
            {col.label}
          </h3>
          <span className="text-[12px] font-medium text-[#8E8E93]">
            {columnLeads.length}
          </span>
        </div>
        <div className="space-y-2 flex-1">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-20 bg-white border border-[#E5E5EA] rounded-[10px] animate-pulse"
                />
              ))}
            </div>
          ) : columnLeads.length > 0 ? (
            columnLeads.map((lead) => renderLeadCard(lead))
          ) : (
            <div className="h-32 flex items-center justify-center border border-dashed border-[#E5E5EA] rounded-[10px] text-[12px] text-[#AEAEB2]">
              No leads in {col.label}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[12px] border border-[#E5E5EA]">
        <div className="flex items-center gap-2 flex-wrap">
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

      <div
        className={`flex flex-wrap gap-3 items-start ${
          showClosedLost ? "" : ""
        }`}
      >
        {COLUMNS.map(renderColumn)}

        {showClosedLost && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn("CLOSED_LOST");
            }}
            onDragLeave={() =>
              setDragOverColumn((current) => (current === "CLOSED_LOST" ? null : current))
            }
            onDrop={(e) => handleDropOnColumn("CLOSED_LOST", e)}
            className={`bg-[#F8F9FA] rounded-[14px] border p-2.5 flex flex-col min-h-[600px] max-w-[280px] w-full ${
              dragOverColumn === "CLOSED_LOST"
                ? "border-[#5B5FEF] bg-[#5B5FEF]/5"
                : "border-[#E5E5EA]"
            }`}
          >
            <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
              <h3 className="text-[13.5px] font-semibold text-[#1C1C1E] lowercase">
                closed-lost
              </h3>
              <span className="text-[12px] font-medium text-[#8E8E93]">
                {getFilteredLeadsForColumn("CLOSED_LOST").length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {getFilteredLeadsForColumn("CLOSED_LOST").map((lead) =>
                renderLeadCard(lead, true)
              )}
              {getFilteredLeadsForColumn("CLOSED_LOST").length === 0 && (
                <div className="h-32 flex items-center justify-center border border-dashed border-[#E5E5EA] rounded-[10px] text-[12px] text-[#AEAEB2]">
                  No closed-lost leads
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onLeadCreated={async (payload) => {
          await leadService.createLead(payload);
          fetchLeads();
        }}
      />

      <StageChangeModal
        isOpen={stageChangeData.isOpen}
        lead={stageChangeData.lead}
        targetStage={stageChangeData.targetStage}
        onClose={() =>
          setStageChangeData({ isOpen: false, lead: null, targetStage: null })
        }
        onConfirm={handleStageChangeSubmit}
      />

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
