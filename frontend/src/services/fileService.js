import api from "./api";

const apiBase =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const fileService = {
  getFileUrl: (filePath) => {
    if (!filePath) return null;

    let cleanPath = filePath.replace(/\\/g, "/");
    if (cleanPath.includes("/NAS/")) {
      cleanPath = cleanPath.split("/NAS/")[1];
    }

    return `${apiBase}/files/${cleanPath}`;
  },

  fetchFileBlob: async (fileIdNode) => {
    const response = await api.get(`/files/view/${fileIdNode}`, {
      responseType: "blob",
    });
    return response;
  },
};
