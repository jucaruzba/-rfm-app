import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Folder, FileText, ChevronRight, HardDrive, Search, Plus,
  Download, Trash2, ArrowLeft, Upload, X, Loader2, AlertCircle,
  LayoutGrid, List, Eye
} from "lucide-react";
import { nodeService } from "../../../services/nodeService";
import FileViewer from "../../admin/components/FileViewer";
import ConfirmDialog from "../../ui/ConfirmDialog"; // Ajusta la ruta según tu estructura
import { toast } from "sonner";
const CompanyExplorer = () => {
  const { companyId } = useParams();

  const [nodes, setNodes] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [pathStack, setPathStack] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal para crear carpeta
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Modal para subir archivo
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [fileDesc, setFileDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  // Estado para el modal de confirmación
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

  // Estado para controlar la eliminación
  const [deletingItem, setDeletingItem] = useState(null);

  // Cargar nodo raíz al montar
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
      setError("Error cargando la estructura de carpetas");
      console.error(err);
    }
  };

  const loadNodeChildren = async (nodeId) => {
    try {
      setLoading(true);
      const children = await nodeService.getNodesByParent(nodeId);
      setNodes(children);
      setError(null);
    } catch (err) {
      setError("Error cargando los elementos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navegar a una carpeta
  const handleFolderClick = async (folder) => {
    setCurrentNodeId(folder.idNode);
    setPathStack([...pathStack, { idNode: folder.idNode, name: folder.name }]);
    await loadNodeChildren(folder.idNode);
  };

  // Ir atrás
  const handleBack = async () => {
    if (pathStack.length > 1) {
      const newPath = pathStack.slice(0, -1);
      setPathStack(newPath);
      const parentNode = newPath[newPath.length - 1];
      setCurrentNodeId(parentNode.idNode);
      await loadNodeChildren(parentNode.idNode);
    }
  };

  // Ir a una posición específica del breadcrumb
  const goToPath = async (index) => {
    const newPath = pathStack.slice(0, index + 1);
    setPathStack(newPath);
    const targetNode = newPath[index];
    setCurrentNodeId(targetNode.idNode);
    await loadNodeChildren(targetNode.idNode);
  };

  // Crear carpeta
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      setCreatingFolder(true);
      await nodeService.createFolder({
        idParent: currentNodeId,
        folderName: folderName,
        description: folderDesc,
        idCompany: companyId
      });
      setFolderName("");
      setFolderDesc("");
      setShowCreateFolder(false);
      await loadNodeChildren(currentNodeId);
    } catch (err) {
      setError("Error creando la carpeta");
      console.error(err);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Subir archivo
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setUploading(true);
      await nodeService.uploadFile(
        currentNodeId,
        uploadFile,
        fileDesc,
        companyId
      );
      setUploadFile(null);
      setFileDesc("");
      setShowUpload(false);
      await loadNodeChildren(currentNodeId);
    } catch (err) {
      setError("Error subiendo el archivo");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Función para mostrar el diálogo de confirmación para eliminar
  const handleDeleteClick = (item) => {
    const isFolder = item.nodeType === "FOLDER";
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: isFolder ? "Delete Folder" : "Delete File",
      message: isFolder
        ? `Are you sure you want to delete the folder "${item.name}" and ALL its contents?`
        : `Are you sure you want to delete the file "${item.name}"?`,
      confirmText: isFolder ? "Delete Folder" : "Delete File",
      itemName: item.name,
      itemDescription: item.description || (isFolder ? "Folder will be permanently deleted" : "File will be permanently deleted"),
      onConfirm: () => handleConfirmDelete(item.idNode, isFolder),
      itemId: item.idNode,
    });
  };

  // Función para eliminar el nodo (archivo o carpeta)
  const handleConfirmDelete = async (idNode, isFolder) => {
    setDeletingItem(idNode);
    
    const toastId = toast.loading(isFolder ? "Deleting folder..." : "Deleting file...", { closeButton: true });
    
    try {
      await nodeService.deleteFile(idNode); // El mismo endpoint funciona para carpetas y archivos
      
      toast.success(isFolder ? "Folder deleted successfully" : "File deleted successfully", { 
        id: toastId, 
        closeButton: true 
      });
      
      // Actualizar la lista localmente (eliminación optimista)
      setNodes(prevNodes => prevNodes.filter(node => node.idNode !== idNode));
      
      // Cerrar el modal
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Delete error", err);
      toast.error(isFolder ? "Failed to delete folder" : "Failed to delete file", { 
        id: toastId, 
        closeButton: true 
      });
    } finally {
      setDeletingItem(null);
    }
  };

  // Función para cerrar el diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Filtrar items según búsqueda
  const filteredNodes = useMemo(() => {
    return nodes.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodes, searchTerm]);

  // Obtener extensión del archivo
  const getFileExt = (name) => {
    return name.split('.').pop().toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">

      {/* BARRA SUPERIOR */}
      <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            disabled={pathStack.length <= 1}
            className="p-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-20 transition-all text-[#001F3F]"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1">
            {pathStack.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <button
                  onClick={() => goToPath(idx)}
                  className={`text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${
                    idx === pathStack.length - 1 ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-[#001F3F]"
                  }`}
                >
                  {item.name}
                </button>
                {idx < pathStack.length - 1 && <ChevronRight size={14} className="text-gray-200 mx-1" />}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-all" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border-none rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-[#001F3F] outline-none w-64 focus:ring-2 ring-blue-500/10 transition-all"
            />
          </div>

          <button
            onClick={() => setShowCreateFolder(true)}
            className="bg-[#001F3F] text-white p-3 rounded-2xl hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-1">Nueva Carpeta</span>
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Upload size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-1">Subir Archivo</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-10 custom-scroll bg-[#FDFDFD]">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Cargando...</p>
          </div>
        ) : filteredNodes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {filteredNodes.map((item) => (
              <div
                key={item.idNode}
                className="group flex flex-col items-center gap-4 p-4 rounded-[2rem] hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 border border-transparent hover:border-gray-50"
              >
                <div
                  className={`relative w-24 h-24 flex items-center justify-center rounded-3xl transition-transform duration-500 group-hover:scale-110 ${
                    item.nodeType === "FOLDER" ? "bg-blue-50 text-blue-600 cursor-pointer" : "bg-gray-50 text-gray-400"
                  }`}
                  onDoubleClick={() => item.nodeType === "FOLDER" && handleFolderClick(item)}
                >
                  {item.nodeType === "FOLDER" ? (
                    <Folder size={44} fill="currentColor" fillOpacity={0.15} />
                  ) : (
                    <FileText size={40} strokeWidth={1.5} />
                  )}

                  {item.nodeType === "FILE" && (
                    <span className="absolute bottom-2 right-2 bg-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-gray-100 uppercase">
                      {getFileExt(item.name)}
                    </span>
                  )}
                </div>

                <div className="text-center w-full px-2">
                  <p className="text-[11px] font-black text-[#001F3F] uppercase italic truncate tracking-tight mb-1">
                    {item.name}
                  </p>
                  <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    {item.nodeType === "FOLDER" ? "Carpeta" : item.nodeType}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  {item.nodeType === "FILE" && (
                    <button
                      onClick={() => setSelectedFile(item)}
                      className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                      title="Ver archivo"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(item)}
                    disabled={deletingItem === item.idNode}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={item.nodeType === "FOLDER" ? "Eliminar carpeta" : "Eliminar archivo"}
                  >
                    {deletingItem === item.idNode ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <HardDrive size={64} strokeWidth={1} />
            <p className="text-xs font-black uppercase tracking-[0.3em] mt-6 italic">
              {searchTerm ? "Sin resultados" : "Carpeta vacía"}
            </p>
          </div>
        )}
      </div>

      {/* BARRA INFERIOR */}
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-6">
          <span>Elementos: {filteredNodes.length}</span>
          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
          <span>Estado: Sincronizado</span>
        </div>
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} className="text-blue-600" />
          <List size={14} className="opacity-30" />
        </div>
      </div>

      {/* MODAL - CREAR CARPETA */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">Nueva Carpeta</h3>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre de la carpeta"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F]"
                required
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={folderDesc}
                onChange={(e) => setFolderDesc(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F] resize-none h-24"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingFolder ? <Loader2 size={16} className="animate-spin" /> : null}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - SUBIR ARCHIVO */}
      {showUpload && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-[#001F3F] tracking-tight">Subir Archivo</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-all">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    {uploadFile ? uploadFile.name : "Selecciona un archivo"}
                  </p>
                </label>
              </div>

              <textarea
                placeholder="Descripción (opcional)"
                value={fileDesc}
                onChange={(e) => setFileDesc(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 ring-blue-500 outline-none font-bold text-[#001F3F] resize-none h-20"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE VIEWER */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* ConfirmDialog Reutilizable */}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #001F3F; }
      `}} />
    </div>
  );
};

export default CompanyExplorer;