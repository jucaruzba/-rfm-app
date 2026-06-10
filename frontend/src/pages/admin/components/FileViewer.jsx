import { useState, useEffect } from "react";
import { X, Download, Maximize2, Loader2, FileWarning } from "lucide-react";
import { fileService } from "../../../services/fileService";

const FileViewer = ({ file, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  const isPDF = /\.pdf$/i.test(file.name);

  useEffect(() => {
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
  }, [file.idNode]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#001F3F]/98 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Top Bar - Ajustada para Responsive */}
      <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-white/5 shrink-0">
        <div className="min-w-0 flex-1 mr-4">
          <h2 className="text-white font-black uppercase tracking-tighter italic text-base md:text-2xl truncate">
            {file.name}
          </h2>
          <p className="text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
            {file.nodeType} • {loading ? "Loading Stream..." : "Ready"}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => window.open(blobUrl, "_blank")}
            className="p-2.5 md:p-3 bg-white/10 text-white rounded-xl hover:bg-white hover:text-[#001F3F] transition-all"
            title="Download"
          >
            <Download size={18} md:size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 md:p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <X size={18} md:size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Viewer Area - Centrado flexible */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2
              className="text-blue-500 animate-spin"
              size={40}
              md:size={48}
            />
            <p className="text-white font-bold uppercase tracking-widest text-[10px] md:text-xs">
              Accessing NAS Storage...
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isImage && (
              <img
                src={blobUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain shadow-2xl rounded-lg md:rounded-2xl animate-in zoom-in-95 duration-500"
              />
            )}

            {isPDF && (
              <div className="w-full h-full max-w-6xl flex flex-col">
                {/* En móviles, los objetos PDF a veces no cargan bien, por lo que el iframe es el fallback seguro */}
                <iframe
                  src={`${blobUrl}#view=FitH`}
                  className="w-full h-full rounded-xl md:rounded-2xl bg-white border-none"
                  title="PDF Viewer"
                />
              </div>
            )}

            {!isImage && !isPDF && (
              <div className="bg-white/5 p-8 md:p-20 rounded-[2rem] md:rounded-[4rem] border border-white/10 text-center space-y-6 md:space-y-8 animate-in slide-in-from-bottom-10 max-w-md mx-auto">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-600 rounded-2xl md:rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl rotate-12">
                  <FileWarning
                    size={32}
                    md:size={48}
                    className="text-white -rotate-12"
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <p className="text-white text-lg md:text-2xl font-black uppercase tracking-tighter italic">
                    Binary Format
                  </p>
                  <p className="text-gray-400 text-[10px] md:text-sm font-medium leading-relaxed">
                    Preview not available for this file type. Download to your
                    workstation to inspect content.
                  </p>
                </div>
                <button
                  onClick={() => window.open(blobUrl, "_blank")}
                  className="w-full md:w-auto px-8 py-3 md:py-4 bg-white text-[#001F3F] rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-blue-400 transition-all shadow-xl"
                >
                  Download Asset
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
