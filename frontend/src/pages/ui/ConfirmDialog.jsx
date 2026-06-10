import { AlertCircle, Trash2, Loader2 } from "lucide-react";

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
  type = "danger", // 'danger' or 'warning'
}) => {
  if (!isOpen) return null;

  const getGradient = () => {
    if (type === "danger") return "from-red-600 to-red-500";
    return "from-amber-600 to-amber-500";
  };

  const getIconBg = () => {
    if (type === "danger") return "bg-red-50";
    return "bg-amber-50";
  };

  const getIconColor = () => {
    if (type === "danger") return "text-red-600";
    return "text-amber-600";
  };

  const getButtonBg = () => {
    if (type === "danger") return "bg-red-600 hover:bg-red-700";
    return "bg-amber-600 hover:bg-amber-700";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${getGradient()} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trash2 size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 ${getIconBg()} rounded-xl`}>
              <AlertCircle size={20} className={getIconColor()} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800 mb-1">{message}</p>
              <p className="text-xs text-gray-500">
                This action cannot be undone. The item will be permanently
                removed from the system.
              </p>
            </div>
          </div>

          {/* Detalles del item */}
          {(itemName || itemDescription) && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {itemName && (
                    <p className="text-sm font-bold text-[#001F3F] truncate">
                      {itemName}
                    </p>
                  )}
                  {itemDescription && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {itemDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 ${getButtonBg()} text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
