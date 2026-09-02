import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { addDays, subDays, format, isSameDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Eye,
  Trash2,
  Calendar,
} from "lucide-react";
import { activityService } from "../../../services/activityService";
import { toast } from "sonner";
import CreateActivityModal from "../../admin/components/activity/CreateActivityModal";
import ActivityDetailView from "../../admin/components/activity/ActivityDetailView";

const CompanyActivities = () => {
  const { companyId } = useParams();
  const [baseDate, setBaseDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const dateInputRef = useRef(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [targetDate, setTargetDate] = useState("");

  const daysToShow = useMemo(
    () => [subDays(baseDate, 1), baseDate, addDays(baseDate, 1)],
    [baseDate],
  );

  const fetchActivities = async () => {
    try {
      const data = await activityService.getActivities({
        idCompany: companyId,
        start: format(daysToShow[0], "yyyy-MM-dd'T'00:00:00"),
        end: format(daysToShow[2], "yyyy-MM-dd'T'23:59:59"),
      });
      setActivities(data || []);
    } catch (err) {
      toast.error("Error loading activities");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [baseDate, companyId]);

  const handleCalendarClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.click();
      }
    }
  };

  const openDetail = (act) => {
    setSelectedActivity(act);
    setIsDetailOpen(true);
  };

  const handleDeleteActivity = async (id, title) => {
    const confirmed = window.confirm(
      `Delete activity "${title}"? This action cannot be undone.`,
    );

    if (confirmed) {
      try {
        await activityService.deleteActivity(id);
        toast.success("Activity deleted");
        fetchActivities();
      } catch (err) {
        toast.error("Error deleting activity");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Date navigation bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#E5E5EA]">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1C1C1E]">
            Activities
          </h1>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            {activities.length} activity entries recorded
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
          <button
            onClick={() => setBaseDate(subDays(baseDate, 1))}
            className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] hover:bg-white transition-colors"
            title="Previous day"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          <div
            onClick={handleCalendarClick}
            className="relative px-3 py-1 text-center min-w-[140px] cursor-pointer hover:bg-white rounded-[6px] transition-colors"
          >
            <input
              ref={dateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 pointer-events-none -z-10"
              value={format(baseDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setBaseDate(new Date(e.target.value + "T00:00:00"));
                }
              }}
            />
            <span className="text-[13px] font-medium text-[#1C1C1E]">
              {format(baseDate, "MMM dd, yyyy")}
            </span>
          </div>

          <button
            onClick={() => setBaseDate(addDays(baseDate, 1))}
            className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] hover:bg-white transition-colors"
            title="Next day"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 3-Column Days Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
        {daysToShow.map((day, idx) => {
          const isFocus = idx === 1;
          const dayActivities = activities
            .filter((act) => isSameDay(new Date(act.eventDate), day))
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

          return (
            <div
              key={day.toString()}
              className={`flex flex-col bg-white rounded-[12px] border overflow-hidden min-h-[380px] ${
                isFocus
                  ? "border-[#171717]/40 shadow-xs"
                  : "border-[#E5E5EA]"
              }`}
            >
              {/* Day column header */}
              <div
                className={`px-4 py-3 flex justify-between items-center border-b border-[#E5E5EA] ${
                  isFocus ? "bg-[#FAFAFA]" : "bg-[#FAFAFA]"
                }`}
              >
                <div>
                  <p className="text-[11px] font-medium lowercase text-[#6E6E73]">
                    {format(day, "EEEE")}
                  </p>
                  <h2 className="text-[14px] font-semibold text-[#1C1C1E]">
                    {format(day, "dd MMM")}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setTargetDate(format(day, "yyyy-MM-dd"));
                    setIsCreateOpen(true);
                  }}
                  className="p-1.5 bg-white border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1C1C1E] hover:border-[#171717] rounded-[8px] transition-colors cursor-pointer"
                  title="New activity"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Activities list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#FAFAFA]">
                {dayActivities.length > 0 ? (
                  dayActivities.map((act) => (
                    <div
                      key={act.idActivity}
                      className="group bg-white rounded-[10px] border border-[#E5E5EA] p-3 hover:border-[#171717]/30 transition-colors shadow-xs"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-medium text-[#1C1C1E] bg-[#FAFAFA] border border-[#E5E5EA] px-2 py-0.5 rounded-full">
                          {format(new Date(act.eventDate), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDetail(act)}
                            className="p-1 text-[#6E6E73] hover:text-[#1C1C1E] rounded transition-colors cursor-pointer"
                            title="View activity"
                          >
                            <Eye size={13} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteActivity(act.idActivity, act.title)
                            }
                            className="p-1 text-[#AEAEB2] hover:text-[#EF4444] rounded transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-[13px] font-semibold text-[#1C1C1E] line-clamp-1">
                        {act.title}
                      </h3>
                      {act.description && (
                        <p className="text-[12px] text-[#6E6E73] line-clamp-2 mt-0.5">
                          {act.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-[#AEAEB2]">
                    <Clock size={22} strokeWidth={1.5} />
                    <p className="text-[12px] mt-1">
                      No activities
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        selectedDate={targetDate}
        idCompany={companyId}
        onActivityCreated={fetchActivities}
      />

      <ActivityDetailView
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activityId={selectedActivity?.idActivity}
        onActivityUpdated={fetchActivities}
      />
    </div>
  );
};

export default CompanyActivities;

