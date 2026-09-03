import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Folder,
  FileText,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { nodeService } from "../../../services/nodeService";
import { useAuth } from "../../../context/AuthContext";
import FileViewer from "../../admin/components/FileViewer";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { toast } from "sonner";

const CompanyExplorer = () => {
  const { companyId } = useParams();
  const { user } = useAuth();
  const isAdmin =
    user?.role?.toLowerCase() === "admin" || user?.role === "ADMIN";

  const [nodes, setNodes] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [pathStack, setPathStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal create folder
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const folderDescRef = useRef(null);

  // Modal upload file
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [fileDesc, setFileDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileDescRef = useRef(null);

  // Modal confirm
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "Delete",
    itemName: "",
    itemDescription: "",
    onConfirm: null,
    itemId: null,
  });

  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    loadRootNode();
  }, [companyId]);

  const loadRootNode = async () => {
    try {
      setLoading(true);
      setError(null);
      const root = await nodeService.getRootNode(companyId);
      setCurrentNodeId(root.idNode);
      setPathStack([{ idNode: root.idNode, name: root.name }]);
      loadNodeChildren(root.idNode);
    } catch (err) {
      setError("Error loading root folder");
    }
  };

  const loadNodeChildren = async (nodeId) => {
    try {
      setLoading(true);
      const children = await nodeService.getNodesByParent(nodeId);
      setNodes(children || []);
      setError(null);
    } catch (err) {
      setError("Error loading items");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder) => {
    setCurrentNodeId(folder.idNode);
    setPathStack([...pathStack, { idNode: folder.idNode, name: folder.name }]);
    await loadNodeChildren(folder.idNode);
  };

  const handleBack = async () => {
    if (pathStack.length > 1) {
      const newPath = pathStack.slice(0, -1);
      setPathStack(newPath);
      const parentNode = newPath[newPath.length - 1];
      setCurrentNodeId(parentNode.idNode);
      await loadNodeChildren(parentNode.idNode);
    }
  };

  const goToPath = async (index) => {
    const newPath = pathStack.slice(0, index + 1);
    setPathStack(newPath);
    const targetNode = newPath[index];
    setCurrentNodeId(targetNode.idNode);
    await loadNodeChildren(targetNode.idNode);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      setCreatingFolder(true);
      await nodeService.createFolder({
        idParent: currentNodeId,
        folderName: folderName.trim(),
        description: folderDesc.trim(),
        idCompany: companyId,
      });
      toast.success("Folder created");
      setFolderName("");
      setFolderDesc("");
      setShowCreateFolder(false);
      await loadNodeChildren(currentNodeId);
    } catch (err) {
      toast.error("Error creating folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setUploading(true);
      await nodeService.uploadFile(
        currentNodeId,
        uploadFile,
        fileDesc,
        companyId,
      );
      toast.success("File uploaded");
      setUploadFile(null);
      setFileDesc("");
      setShowUpload(false);
      await loadNodeChildren(currentNodeId);
    } catch (err) {
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (item) => {
    const isFolder = item.nodeType === "FOLDER";
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: isFolder ? "Delete folder" : "Delete file",
      message: isFolder
        ? `Are you sure you want to delete "${item.name}" and all its contents?`
        : `Are you sure you want to delete "${item.name}"?`,
      confirmText: "Delete",
      itemName: item.name,
      itemDescription: item.description || "",
      itemId: item.idNode,
      onConfirm: () => handleExecuteDelete(item),
    });
  };

  const handleExecuteDelete = async (item) => {
    setDeletingItem(item.idNode);
    try {
      if (item.nodeType === "FOLDER") {
        await nodeService.deleteFolder(item.idNode);
      } else {
        await nodeService.deleteFile(item.idNode);
      }
      toast.success("Item deleted");
      await loadNodeChildren(currentNodeId);
    } catch (err) {
      toast.error("Error deleting item");
    } finally {
      setDeletingItem(null);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const filteredNodes = nodes.filter((node) =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Unified Slim Action & Navigation Card */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-[12px] border border-[#E5E5EA]">
        {/* Left: Back button & Breadcrumb path */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full w-full md:w-auto">
          {pathStack.length > 1 && (
            <button
              onClick={handleBack}
              className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] rounded-[6px] hover:bg-[#FAFAFA] border border-[#E5E5EA] transition-colors cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
            </button>
          )}

          <div className="flex items-center gap-1 text-[12.5px] font-medium text-[#1C1C1E] shrink-0">
            {pathStack.map((item, idx) => (
              <div key={item.idNode || idx} className="flex items-center">
                <button
                  onClick={() => goToPath(idx)}
                  className={`hover:text-[#171717] transition-colors cursor-pointer ${
                    idx === pathStack.length - 1
                      ? "text-[#1C1C1E] font-semibold"
                      : "text-[#6E6E73]"
                  }`}
                >
                  {item.name}
                </button>
                {idx < pathStack.length - 1 && (
                  <ChevronRight size={13} strokeWidth={1.5} className="text-[#AEAEB2] mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Search, New folder, Upload file */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <div className="relative flex-1 md:w-56">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
              size={13}
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Search in folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5EA] rounded-[8px] py-1.5 pl-7 pr-3 outline-none focus:border-[#171717] focus:bg-white text-[12px] text-[#1C1C1E] transition-all"
            />
          </div>

          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FAFAFA] text-[#1C1C1E] border border-[#E5E5EA] px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer shrink-0"
          >
            <Plus size={13} strokeWidth={1.5} />
            <span>New folder</span>
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Upload size={13} strokeWidth={1.5} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[12px] border border-[#E5E5EA] p-5 min-h-[380px]">
        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[8px] p-3 flex items-center gap-2 mb-4">
            <AlertCircle size={15} strokeWidth={1.5} className="text-[#EF4444]" />
            <p className="text-[12.5px] text-[#EF4444] font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="text-[#171717] animate-spin" size={22} strokeWidth={1.5} />
            <p className="text-[12px] text-[#AEAEB2]">Loading explorer...</p>
          </div>
        ) : filteredNodes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredNodes.map((item) => (
              <div
                key={item.idNode}
                className="group flex flex-col items-center gap-2 p-3 rounded-[10px] border border-[#E5E5EA] hover:border-[#171717]/30 hover:bg-[#FAFAFA] transition-colors relative shadow-xs"
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-[8px] transition-colors ${
                    item.nodeType === "FOLDER"
                      ? "bg-[#FAFAFA] border border-[#E5E5EA] text-[#1C1C1E] cursor-pointer hover:bg-white"
                      : "bg-[#FAFAFA] text-[#AEAEB2] cursor-pointer hover:bg-white"
                  }`}
                  onClick={() =>
                    item.nodeType === "FOLDER"
                      ? handleFolderClick(item)
                      : handleFileClick(item)
                  }
                  onDoubleClick={() =>
                    item.nodeType === "FOLDER" && handleFolderClick(item)
                  }
                >
                  {item.nodeType === "FOLDER" ? (
                    <Folder size={24} strokeWidth={1.5} className="text-[#1C1C1E]" />
                  ) : (
                    <FileText size={24} strokeWidth={1.5} className="text-[#6E6E73]" />
                  )}
                </div>

                <div className="text-center w-full px-1">
                  <p
                    className="text-[12px] font-medium text-[#1C1C1E] truncate cursor-pointer hover:underline"
                    title={item.name}
                    onClick={() =>
                      item.nodeType === "FOLDER"
                        ? handleFolderClick(item)
                        : handleFileClick(item)
                    }
                  >
                    {item.name}
                  </p>
                </div>

                {/* Quick actions on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-xs rounded-[6px] p-0.5 border border-[#E5E5EA] shadow-xs">
                  {item.nodeType !== "FOLDER" && (
                    <button
                      onClick={() => handleFileClick(item)}
                      className="p-1 hover:bg-[#FAFAFA] rounded text-[#6E6E73] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                      title="View file"
                    >
                      <Eye size={12} strokeWidth={1.5} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="p-1 hover:bg-[#EF4444]/10 rounded text-[#AEAEB2] hover:text-[#EF4444] transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-[12.5px] text-[#AEAEB2]">This folder is empty</p>
          </div>
        )}
      </div>

      {/* Modal: New Folder */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-sm w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[15px] font-semibold text-[#1C1C1E]">
                New folder
              </h3>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  folder name *
                </label>
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[12.5px] text-[#1C1C1E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  ref={folderDescRef}
                  placeholder="Optional description..."
                  value={folderDesc}
                  rows={2}
                  onChange={(e) => {
                    setFolderDesc(e.target.value);
                    if (folderDescRef.current) {
                      folderDescRef.current.style.height = "auto";
                      folderDescRef.current.style.height = `${folderDescRef.current.scrollHeight}px`;
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[12.5px] text-[#1C1C1E] resize-none overflow-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {creatingFolder && <Loader2 size={13} className="animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload File */}
      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[14px] p-6 max-w-sm w-full border border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <h3 className="text-[15px] font-semibold text-[#1C1C1E]">
                Upload file
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-[#AEAEB2] hover:text-[#1C1C1E] cursor-pointer"
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-3.5">
              <div className="border border-dashed border-[#E5E5EA] rounded-[10px] p-5 text-center hover:border-[#171717] transition-colors bg-[#FAFAFA]">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload size={22} strokeWidth={1.5} className="mx-auto mb-1.5 text-[#AEAEB2]" />
                  <p className="text-[12px] font-medium text-[#1C1C1E]">
                    {uploadFile ? uploadFile.name : "Select a file"}
                  </p>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium lowercase text-[#6E6E73] block">
                  description
                </label>
                <textarea
                  ref={fileDescRef}
                  placeholder="Optional description..."
                  value={fileDesc}
                  rows={2}
                  onChange={(e) => {
                    setFileDesc(e.target.value);
                    if (fileDescRef.current) {
                      fileDescRef.current.style.height = "auto";
                      fileDescRef.current.style.height = `${fileDescRef.current.scrollHeight}px`;
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-[8px] focus:border-[#171717] outline-none text-[12.5px] text-[#1C1C1E] resize-none overflow-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-3.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#2C2C2E] text-white rounded-[8px] text-[12px] font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {uploading && <Loader2 size={13} className="animate-spin" />}
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Viewer */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        itemName={confirmDialog.itemName}
        itemDescription={confirmDialog.itemDescription}
        isLoading={deletingItem === confirmDialog.itemId}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default CompanyExplorer;