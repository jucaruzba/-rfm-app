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
    (task.repeatType && task.repeatType !== "NONE") || task.parentTaskId;

  const handleConfirm = () => {
    onConfirm(task, deleteFuture);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header con fondo rojo idéntico a Pending */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-red-600 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Trash2 size={20} />
            Confirm Deletion
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center text-5xl text-red-500 mb-2">
            <AlertCircle size={64} className="text-red-500" />
          </div>

          <h4 className="text-center text-lg font-semibold text-gray-900">
            Are you sure you want to delete this task?
          </h4>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1.5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Title:</span>{" "}
              {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-semibold text-gray-900">Description:</span>{" "}
                {task.description}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Status:</span>{" "}
              <span className="font-bold uppercase text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                {task.status}
              </span>
            </p>
            {task.priority && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Priority:</span>{" "}
                <span className="font-bold uppercase text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                  {task.priority}
                </span>
              </p>
            )}
          </div>

          {/* Opciones de recurrencia si es tarea repetitiva */}
          {isRecurring && (
            <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs uppercase tracking-wider">
                <Repeat size={14} />
                Recurring Task Options
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRecurringTask"
                    checked={!deleteFuture}
                    onChange={() => setDeleteFuture(false)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-gray-900">Delete this event only</span>
                    <p className="text-[11px] text-gray-500 font-normal">
                      Removes only this specific occurrence.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 text-xs font-semibold text-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRecurringTask"
                    checked={deleteFuture}
                    onChange={() => setDeleteFuture(true)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-red-700 font-bold">
                      Delete all future events
                    </span>
                    <p className="text-[11px] text-gray-500 font-normal">
                      Removes this occurrence and cancels all future recurrences.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <p className="text-sm text-red-600 text-center font-semibold">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-red-600/20"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDeleteDialog;
