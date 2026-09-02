import { useState, useEffect } from "react";
import {
  Outlet,
  useParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  FolderTree,
  Menu,
  X,
  Calendar,
  Briefcase,
} from "lucide-react";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";
import NotificationDropdown from "../../layouts/NotificationDropdown";

const ProjectWorkspaceLayout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchNavbarData = async () => {
      try {
        const data = await projectService.getProject(projectId);
        setProject(data);
      } catch (err) {
        console.error("Error loading project data", err);
      }
    };
    if (projectId) fetchNavbarData();
  }, [projectId]);

  const menuItems = [
    {
      icon: <LayoutDashboard size={15} strokeWidth={1.5} />,
      label: "Overview",
      path: `/projects/${projectId}`,
    },
    {
      icon: <FolderTree size={15} strokeWidth={1.5} />,
      label: "Objects",
      path: `/projects/${projectId}/objects`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-[#E5E5EA] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Exit & Project Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F7] text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] transition-colors text-[13px] font-medium"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            <span>Projects</span>
          </button>

          <div className="h-5 w-[1px] bg-[#E5E5EA] hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#FAFAFA] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E]">
              <Briefcase size={15} strokeWidth={1.5} />
            </div>
            <h2 className="text-[17px] font-semibold text-[#1C1C1E] tracking-tight max-w-[200px] md:max-w-[320px] truncate">
              {project?.title || "Loading..."}
            </h2>
          </div>
        </div>

        {/* Center: Workspace Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-[8px] transition-colors text-[13px] font-medium ${
                  isActive
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-white/50"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Date + Bell (Mandatory on every single page) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] text-[13px]">
            <Calendar size={15} strokeWidth={1.5} className="text-[#6E6E73]" />
            <span className="font-medium text-[#1C1C1E]">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <NotificationDropdown user={user} />

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[8px] border border-[#E5E5EA]"
          >
            {isMobileMenuOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E5EA] p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-[8px] text-[13px] font-medium ${
                  isActive
                    ? "bg-[#171717] text-white"
                    : "text-[#6E6E73] hover:bg-[#FAFAFA]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjectWorkspaceLayout;

