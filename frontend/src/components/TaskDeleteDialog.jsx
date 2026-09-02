import { useState, useEffect } from "react";
import { Trash2, AlertCircle, Loader2, X, Repeat } from "lucide-react";

const TaskDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  isDeleting = false,
}) => {
  const [deleteFuture, setDeleteFuture] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeleteFuture(false);
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const isRecurring =
    (task.repeatType && task.repeatType !== "NONE") || task.parentTaskId || !!task.seriesId;

  const handleConfirm = () => {
    onConfirm(task, deleteFuture);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA] overflow-hidden">
        {/* Popup Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] bg-white">
          <h3 className="font-semibold text-[16px] text-[#1C1C1E]">
            Delete task
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[13.5px] text-[#1C1C1E]">
            Are you sure you want to delete <span className="font-semibold text-[#1C1C1E]">"{task.title}"</span>? This action cannot be undone.
          </p>

          <div className="bg-[#FAFAFA] rounded-[10px] p-3.5 border border-[#E5E5EA] space-y-1.5 text-[13px]">
            {task.description && (
              <p className="text-[#6E6E73] line-clamp-2">
                <span className="font-medium text-[#1C1C1E] lowercase">description:</span> {task.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1C1C1E] text-[11px] lowercase">status:</span>
              <span className="text-[11px] font-medium lowercase px-2 py-0.5 rounded-full bg-[#E5E5EA]/60 text-[#6E6E73]">
                {task.status?.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[#1C1C1E] font-semibold text-[12px]">
                <Repeat size={14} strokeWidth={1.5} />
                <span>Recurring options</span>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-start gap-2 text-[13px] text-[#1C1C1E] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRecurringTask"
                    checked={!deleteFuture}
                    onChange={() => setDeleteFuture(false)}
                    className="mt-0.5 accent-[#171717] cursor-pointer"
                  />
                  <span>Delete this event only</span>
                </label>

                <label className="flex items-start gap-2 text-[13px] text-[#1C1C1E] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRecurringTask"
                    checked={deleteFuture}
                    onChange={() => setDeleteFuture(true)}
                    className="mt-0.5 accent-[#171717] cursor-pointer"
                  />
                  <span>Delete all future events</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[#E5E5EA] bg-[#FAFAFA]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-[13px] font-medium bg-white hover:bg-[#F2F2F7] text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA] rounded-[10px] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-[13px] font-medium bg-[#EF4444] text-white hover:bg-[#EF4444]/90 rounded-[10px] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} strokeWidth={1.5} />
                <span>Delete task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDeleteDialog;

