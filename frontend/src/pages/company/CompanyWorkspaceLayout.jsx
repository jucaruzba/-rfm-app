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
  ClipboardList,
  FolderTree,
  Menu,
  X,
  Calendar,
  Briefcase,
  Users,
  Handshake,
  User,
} from "lucide-react";
import { companyService } from "../../services/companyService";
import { useAuth } from "../../context/AuthContext";
import NotificationDropdown from "../../layouts/NotificationDropdown";

const COMPANY_TYPES_CONFIG = {
  MY_BUSINESS: { label: "my business", icon: Briefcase, color: "text-[#1C1C1E] bg-[#FAFAFA] border-[#E5E5EA]" },
  CLIENT: { label: "client", icon: Users, color: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20" },
  PARTNERSHIP: { label: "partnership", icon: Handshake, color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  PERSONAL: { label: "personal", icon: User, color: "text-[#6E6E73] bg-[#6E6E73]/10 border-[#6E6E73]/20" },
};

const CompanyWorkspaceLayout = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchNavbarData = async () => {
      try {
        const data = await companyService.getCompany(companyId);
        setCompany(data);
      } catch (err) {
        console.error("Error loading company data", err);
      }
    };
    if (companyId) fetchNavbarData();
  }, [companyId]);

  const menuItems = [
    {
      icon: <LayoutDashboard size={15} strokeWidth={1.5} />,
      label: "Overview",
      path: `/companies/${companyId}`,
    },
    {
      icon: <ClipboardList size={15} strokeWidth={1.5} />,
      label: "Tasks",
      path: `/companies/${companyId}/tasks`,
    },
    {
      icon: <FolderTree size={15} strokeWidth={1.5} />,
      label: "Files",
      path: `/companies/${companyId}/files`,
    },
  ];

  const typeConfig = company?.type && COMPANY_TYPES_CONFIG[company.type] ? COMPANY_TYPES_CONFIG[company.type] : null;

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-[#E5E5EA] sticky top-0 z-50 safe-top">
        <div className="h-14 sm:h-16 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          {/* Left: Exit button & Company Info */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/companies")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FAFAFA] hover:bg-[#F2F2F7] text-[#6E6E73] hover:text-[#1C1C1E] border border-[#E5E5EA] rounded-[8px] transition-colors text-[12.5px] sm:text-[13px] font-medium shrink-0"
            >
              <ArrowLeft size={15} strokeWidth={1.5} />
              <span className="hidden xs:inline sm:inline">Companies</span>
            </button>

            <div className="h-5 w-[1px] bg-[#E5E5EA] hidden sm:block shrink-0"></div>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h2 className="text-[15px] sm:text-[17px] font-semibold text-[#1C1C1E] tracking-tight max-w-[140px] sm:max-w-[240px] md:max-w-[340px] truncate">
                {company?.name || "Loading..."}
              </h2>

              {typeConfig && (
                <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium lowercase border shrink-0 ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
            </div>
          </div>

          {/* Center: Workspace tabs */}
          <div className="hidden md:flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-[10px] border border-[#E5E5EA]">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-[8px] transition-colors text-[13px] font-medium ${
                    isActive
                      ? "bg-white text-[#1C1C1E] shadow-sm border border-[#E5E5EA]"
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E5EA] p-3.5 space-y-1">
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
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 safe-pb max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default CompanyWorkspaceLayout;
