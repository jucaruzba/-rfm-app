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
  Activity,
  Settings,
  Building2,
  Menu,
  X,
  Briefcase,
  Users,
  Handshake,
  User,
} from "lucide-react";
import { companyService } from "../../services/companyService";
import { fileService } from "../../services/fileService";

// Company type config for badges
const COMPANY_TYPES_CONFIG = {
  MY_BUSINESS: { label: "My Business", icon: Briefcase, color: "blue" },
  CLIENT: { label: "Client", icon: Users, color: "green" },
  PARTNERSHIP: { label: "Partnership", icon: Handshake, color: "purple" },
  PERSONAL: { label: "Personal", icon: User, color: "orange" },
};

// Get company type badge color
const getTypeColor = (type) => {
  const config = COMPANY_TYPES_CONFIG[type];
  if (!config) return "bg-gray-500";

  switch (config.color) {
    case "blue":
      return "bg-blue-400";
    case "green":
      return "bg-green-400";
    case "purple":
      return "bg-purple-400";
    case "orange":
      return "bg-orange-400";
    default:
      return "bg-gray-500";
  }
};

const CompanyWorkspaceLayout = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for company data
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
      icon: <LayoutDashboard size={18} />,
      label: "Overview",
      path: `/companies/${companyId}`,
    },
    {
      icon: <ClipboardList size={18} />,
      label: "Tasks",
      path: `/companies/${companyId}/tasks`,
    },
    {
      icon: <FolderTree size={18} />,
      label: "Explorer",
      path: `/companies/${companyId}/files`,
    },
  ];

  // Get type label and icon
  const getTypeInfo = (type) => {
    return (
      COMPANY_TYPES_CONFIG[type] || {
        label: type || "Unknown",
        icon: Building2,
        color: "gray",
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* NAVBAR SUPERIOR INDUSTRIAL */}
      <nav className="h-20 bg-[#001F3F] text-white shadow-xl px-8 flex items-center justify-between sticky top-0 z-50">
        {/* Left Side: Brand & Return */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/companies")}
            className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors group"
          >
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
              <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">
              Exit Workspace
            </span>
          </button>

          <div className="h-10 w-[1px] bg-white/10"></div>

          {/* COMPANY NAME & TYPE - SIN LOGO */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none max-w-[250px] md:max-w-[350px] truncate">
                {company?.name || "Loading Node..."}
              </h2>

              {/* COMPANY TYPE BADGE - MÁS GRANDE */}
              {company?.type && (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-white/90">
                    {getTypeInfo(company.type).label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${getTypeColor(company.type)}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Side: Navigation Items */}
        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-300">
            <Settings size={20} />
          </button>
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-blue-400"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY & SIDEBAR */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Background Overlay */}
        <div
          className="absolute inset-0 bg-[#001F3F]/90 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Sidebar Panel */}
        <aside
          className={`absolute right-0 top-0 bottom-0 w-72 bg-[#001F3F] border-l border-white/5 p-8 flex flex-col gap-6 shadow-2xl transition-transform duration-500 transform ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Workspace Menu
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile: Company info with type - SIN LOGO */}
          {company && (
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-sm font-black uppercase tracking-tight truncate">
                {company.name}
              </p>
              {company.type && (
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">
                  {getTypeInfo(company.type).label}
                </span>
              )}
            </div>
          )}

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-widest ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-8 lg:p-12 max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
        <Outlet />
      </main>
    </div>
  );
};

export default CompanyWorkspaceLayout;
