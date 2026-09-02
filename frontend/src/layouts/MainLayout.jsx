import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Building2,
  FolderTree,
  LogOut,
  Menu,
  X,
  Users,
  Calendar,
  Settings,
  Bell,
  CheckSquare,
  AlertCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "../layouts/NotificationDropdown";
import CriticalAlertBanner from "../components/CriticalAlertBanner";
import clientLogo from "../assets/logo.png";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      icon: <CheckSquare size={16} strokeWidth={1.5} />,
      label: "Tasks",
      path: "/tasks",
      roles: ["ADMIN"],
      description: "work to do (me or team)",
    },
    {
      icon: <AlertCircle size={16} strokeWidth={1.5} />,
      label: "Pending",
      path: "/pending-items",
      roles: ["ADMIN", "ASSISTANT"],
      description: "assigned by me. awaiting completion.",
    },
    {
      icon: <Bell size={16} strokeWidth={1.5} />,
      label: "Reminders",
      path: "/reminders",
      roles: ["ADMIN", "ASSISTANT"],
      description: "private alarms. time only.",
    },
    {
      icon: <Building2 size={16} strokeWidth={1.5} />,
      label: "Companies",
      path: "/companies",
      roles: ["ADMIN"],
      description: "manage companies",
    },
    {
      icon: <FolderTree size={16} strokeWidth={1.5} />,
      label: "Projects",
      path: "/projects",
      roles: ["ADMIN"],
      description: "active projects",
    },
    {
      icon: <Users size={16} strokeWidth={1.5} />,
      label: "Users",
      path: "/users",
      roles: ["ADMIN"],
      description: "system users",
    },
    {
      icon: <Star size={16} strokeWidth={1.5} />,
      label: "My workspace",
      path: "/assistant",
      roles: ["ASSISTANT"],
      description: "my workspace",
    },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const currentRouteTitle = menuItems.find((item) => item.path === location.pathname)?.label || "Workspace";

  const NavContent = () => (
    <>
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#2C2C2E]/50">
        <div className="flex items-center gap-3">
          <img
            src={clientLogo}
            alt="Logo"
            className="max-h-8 w-auto object-contain"
          />
        </div>
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden text-[#AEAEB2] hover:text-white p-1"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center px-3 py-2.5 rounded-[10px] transition-all text-[13.5px] ${isActive
                  ? "bg-[#2C2C2E] text-white font-medium shadow-sm"
                  : "text-[#AEAEB2] hover:bg-[#2C2C2E]/50 hover:text-white"
                }`}
            >
              <span
                className={`mr-3 transition-colors ${isActive ? "text-white" : "text-[#8E8E93] group-hover:text-white"
                  }`}
              >
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium leading-tight">
                  {item.label}
                </span>
                <span className="text-[10.5px] text-[#8E8E93] block truncate lowercase leading-normal">
                  {item.description}
                </span>
              </div>
              <ChevronRight
                size={14}
                strokeWidth={1.5}
                className={`transition-opacity ${isActive ? "opacity-60 text-white" : "opacity-0 group-hover:opacity-40"
                  }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out Footer */}
      <div className="p-3 border-t border-[#2C2C2E]/50 bg-[#171717] space-y-2 shrink-0">
        <Link
          to={user?.role === "ASSISTANT" ? "/assistant/profile" : "#"}
          className="flex items-center p-2.5 rounded-[10px] bg-[#2C2C2E]/30 hover:bg-[#2C2C2E]/60 transition-colors cursor-pointer group"
        >
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white text-[12px] font-semibold"
            style={{ backgroundColor: user?.colorCode || "#2C2C2E" }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-2.5 flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate">
              {user?.username}
            </p>
            <p className="text-[11px] text-[#8E8E93] lowercase truncate">
              {user?.role?.toLowerCase()}
            </p>
          </div>
          {user?.role === "ASSISTANT" && (
            <Settings
              size={14}
              strokeWidth={1.5}
              className="text-[#8E8E93] group-hover:text-white transition-colors"
            />
          )}
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[rgba(255,105,97,0.12)] text-[#FF6961] hover:bg-[rgba(255,105,97,0.2)] rounded-[10px] transition-colors text-[12px] font-medium"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-[#171717] flex-col z-30 shrink-0">
        <NavContent />
      </aside>

      {/* SIDEBAR MOBILE */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-64 bg-[#171717] flex flex-col shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <NavContent />
        </aside>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER: DATE + BELL ICON TOP-RIGHT ON EVERY SINGLE PAGE */}
        <header className="h-16 bg-white border-b border-[#E5E5EA] flex items-center justify-between px-6 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[8px] border border-[#E5E5EA]"
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>
            <h1 className="text-[20px] font-semibold text-[#1C1C1E] tracking-tight">
              {currentRouteTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Standard Header Date Component */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA] text-[#6E6E73] text-[13px]">
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

            {/* Standard Header Bell Component */}
            <NotificationDropdown user={user} />
          </div>
        </header>

        {/* CRITICAL ALERT BANNER */}
        <CriticalAlertBanner />

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#FAFAFA]">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

