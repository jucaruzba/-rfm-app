import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FolderTree,
  LogOut,
  Menu,
  X,
  Users,
  Calendar,
  Settings,
  Bell,
  CheckSquare,
  Briefcase,
  AlertCircle,
  UserCircle,
  Home,
  Star,
  Clock,
  FileText,
  PlusCircle,
  Filter,
  Search,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "../layouts/NotificationDropdown";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      icon: <Bell size={20} />,
      label: "Reminders",
      path: "/reminders",
      roles: ["ADMIN", "ASSISTANT"],
      description: "Recordatorios y alertas",
    },
    {
      icon: <CheckSquare size={20} />,
      label: "Activities",
      path: "/activities",
      roles: ["ADMIN"],
      description: "Gestión de actividades",
    },
    {
      icon: <Star size={20} />,
      label: "My Workspace",
      path: "/assistant",
      roles: ["ASSISTANT"],
      description: "Mi espacio de trabajo",
    },
    {
      icon: <Building2 size={20} />,
      label: "Companies",
      path: "/companies",
      roles: ["ADMIN"],
      description: "Gestión de empresas",
    },
    {
      icon: <AlertCircle size={20} />,
      label: "Pending Items",
      path: "/pending-items",
      roles: ["ADMIN", "ASSISTANT"],
      description: "Elementos pendientes",
    },
    {
      icon: <ClipboardList size={20} />,
      label: "Tasks",
      path: "/tasks",
      roles: ["ADMIN"],
      description: "Tareas asignadas",
    },
    {
      icon: <FolderTree size={20} />,
      label: "Projects",
      path: "/projects",
      roles: ["ADMIN"],
      description: "Proyectos activos",
    },
    {
      icon: <Users size={20} />,
      label: "Users",
      path: "/users",
      roles: ["ADMIN"],
      description: "Usuarios del sistema",
    },
    // Ítems adicionales que puedes habilitar según necesidades
    // {
    //   icon: <Home size={20} />,
    //   label: "Dashboard",
    //   path: "/dashboard",
    //   roles: ["ADMIN", "ASSISTANT"],
    //   description: "Panel principal"
    // },
    // {
    //   icon: <Clock size={20} />,
    //   label: "Time Tracking",
    //   path: "/time-tracking",
    //   roles: ["ADMIN", "ASSISTANT"],
    //   description: "Seguimiento de tiempo"
    // },
    // {
    //   icon: <FileText size={20} />,
    //   label: "Reports",
    //   path: "/reports",
    //   roles: ["ADMIN"],
    //   description: "Reportes y estadísticas"
    // }
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const NavContent = () => (
    <>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-black">RFM</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tighter italic">
            RFM<span className="text-blue-400">.</span>
          </h1>
        </div>
        <button onClick={toggleMobileMenu} className="lg:hidden text-white">
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`group flex items-center px-4 py-3 rounded-2xl transition-all duration-300 ${
              location.pathname === item.path
                ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-white shadow-lg shadow-black/20 translate-x-2 border-l-4 border-blue-400"
                : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
            }`}
          >
            <span
              className={`mr-3 transition-all duration-300 ${
                location.pathname === item.path
                  ? "text-blue-400"
                  : "group-hover:text-blue-300"
              }`}
            >
              {item.icon}
            </span>
            <div className="flex-1">
              <span className="text-xs font-black uppercase tracking-widest block">
                {item.label}
              </span>
              {location.pathname === item.path && (
                <span className="text-[8px] text-blue-300/70 uppercase tracking-wider">
                  {item.description}
                </span>
              )}
            </div>
            <ChevronRight
              size={14}
              className={`transition-all duration-300 ${
                location.pathname === item.path
                  ? "opacity-100 translate-x-0 text-blue-400"
                  : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
              }`}
            />
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/10">
        <Link
          to={user?.role === "ASSISTANT" ? "/assistant/profile" : "#"}
          className="flex items-center p-3 mb-6 bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/5 hover:from-white/10 transition-all cursor-pointer group"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundColor: user?.colorCode || "#3B82F6" }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-white text-xs font-bold uppercase truncate">
              {user?.username}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-blue-400 text-[8px] font-bold uppercase tracking-[0.2em]">
                {user?.role}
              </p>
              {user?.role === "ASSISTANT" && (
                <span className="text-[6px] text-gray-400 uppercase">
                  • click to edit
                </span>
              )}
            </div>
          </div>
          {user?.role === "ASSISTANT" && (
            <Settings
              size={14}
              className="text-blue-400 group-hover:text-blue-300 group-hover:rotate-90 transition-all duration-300"
            />
          )}
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em] group"
        >
          <LogOut
            size={16}
            className="group-hover:rotate-180 transition-transform duration-300"
          />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-80 bg-[#001F3F] flex-col shadow-2xl z-30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <NavContent />
      </aside>

      {/* SIDEBAR MÓVIL */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={toggleMobileMenu}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-[#001F3F] to-[#002a5a] flex flex-col shadow-2xl transition-transform duration-500 transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <NavContent />
        </aside>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER RESPONSIVO */}
        <header className="relative z-40 h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 lg:px-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2.5 bg-gray-100 text-[#001F3F] rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              <Menu size={22} />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
              <Calendar size={18} className="text-blue-500" />
              <span className="text-sm lg:text-base font-bold text-[#001F3F]">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <NotificationDropdown user={user} />
          </div>
        </header>

        {/* ÁREA DE SCROLL */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scroll::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
            * {
              scrollbar-width: thin;
              scrollbar-color: #3B82F6 #E2E8F0;
            }
          `,
        }}
      />
    </div>
  );
};

export default MainLayout;
