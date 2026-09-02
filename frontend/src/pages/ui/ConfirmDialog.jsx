import { AlertCircle, Trash2, Loader2, X } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  itemName = "",
  itemDescription = "",
  isLoading = false,
  type = "danger",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[14px] w-full max-w-sm border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
          <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
            {title || "Confirmation"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-[#1C1C1E]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] text-[#1C1C1E]">
            {message || "Are you sure you want to perform this action?"}
          </p>

          {(itemName || itemDescription) && (
            <div className="bg-[#FAFAFA] rounded-[8px] p-3 border border-[#E5E5EA] text-[12px]">
              {itemName && (
                <p className="font-medium text-[#1C1C1E] truncate">
                  {itemName}
                </p>
              )}
              {itemDescription && (
                <p className="text-[#6E6E73] truncate mt-0.5">
                  {itemDescription}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-[8px] text-[12px] font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer ${
              type === "danger"
                ? "bg-[#EF4444] hover:bg-[#DC2626]"
                : "bg-[#171717] hover:bg-[#2C2C2E]"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

