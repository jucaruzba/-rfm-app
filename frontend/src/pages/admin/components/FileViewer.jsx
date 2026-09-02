import { useState, useEffect } from "react";
import { X, Download, Loader2, FileWarning } from "lucide-react";
import { fileService } from "../../../services/fileService";

const FileViewer = ({ file, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file?.name || "");
  const isPDF = /\.pdf$/i.test(file?.name || "");

  useEffect(() => {
    if (!file?.idNode) return;

    const fetchFile = async () => {
      try {
        const response = await fileService.fetchFileBlob(file.idNode);
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: response.headers["content-type"] }),
        );
        setBlobUrl(url);
      } catch (error) {
        console.error("Error loading file", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
    };
  }, [file?.idNode]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E5EA]/20 bg-[#1C1C1E]/90 shrink-0">
        <div className="min-w-0 flex-1 mr-4">
          <h2 className="text-white font-medium text-[15px] truncate">
            {file.name}
          </h2>
          <p className="text-[#AEAEB2] text-[11px] lowercase">
            {file.nodeType?.toLowerCase() || "file"} • {loading ? "loading..." : "ready"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {blobUrl && (
            <button
              onClick={() => window.open(blobUrl, "_blank")}
              className="p-2 text-[#AEAEB2] hover:text-white hover:bg-white/10 rounded-[8px] transition-colors"
              title="Download file"
            >
              <Download size={17} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-[#AEAEB2] hover:text-white hover:bg-white/10 rounded-[8px] transition-colors"
            title="Close viewer"
          >
            <X size={17} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-center text-[#AEAEB2]">
            <Loader2 className="text-white animate-spin" size={28} strokeWidth={1.5} />
            <p className="text-[12px]">Loading preview...</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isImage && (
              <img
                src={blobUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain rounded-[10px] shadow-2xl animate-in zoom-in-95 duration-200"
              />
            )}

            {isPDF && (
              <div className="w-full h-full max-w-5xl flex flex-col bg-white rounded-[10px] overflow-hidden shadow-2xl">
                <iframe
                  src={`${blobUrl}#view=FitH`}
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </div>
            )}

            {!isImage && !isPDF && (
              <div className="bg-white rounded-[14px] border border-[#E5E5EA] p-8 text-center space-y-4 max-w-sm mx-auto shadow-2xl">
                <div className="w-12 h-12 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] mx-auto flex items-center justify-center text-[#6E6E73]">
                  <FileWarning size={24} strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] font-semibold text-[#1C1C1E]">
                    Preview not available
                  </p>
                  <p className="text-[12px] text-[#6E6E73]">
                    This file format cannot be displayed directly in the browser.
                  </p>
                </div>
                <button
                  onClick={() => window.open(blobUrl, "_blank")}
                  className="px-4 py-2 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12.5px] font-medium transition-colors shadow-xs cursor-pointer"
                >
                  Download file
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;

