import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "sonner";

// Layouts
import MainLayout from "./layouts/MainLayout";
import CompanyWorkspaceLayout from "./pages/company/CompanyWorkspaceLayout";
import ProjectWorkspaceLayout from "./pages/projects/ProjectWorkspaceLayout";

// Public Pages
import Login from "./pages/Login";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompaniesPage from "./pages/admin/components/company/CompaniesPage";
import ProjectsPage from "./pages/admin/components/projects/ProjectsPage";

// Assistant Pages
import AssistantDashboard from "./pages/assistant/AssistantDashboard";
import UserProfile from "./pages/assistant/UserProfile";

// Company Workspace Pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyActivities from "./pages/company/components/CompanyActivities";
import CompanyTasks from "./pages/company/components/CompanyTasks";
import CompanyExplorer from "./pages/company/components/CompanyExplorer";

// Project Workspace Pages
import ProjectDashboard from "./pages/projects/ProjectDashboard";
import ProjectObjectExplorer from "./pages/projects/components/ProjectObjectExplorer";

import TasksPage from "./pages/admin/components/task/TaskPage";
import UserPage from "./pages/admin/components/users/UserPage";
import PendingItem from "./pages/admin/components/pending/PendingItem";
import ReminderUser from "./pages/ReminderUser";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-black uppercase tracking-[0.3em] text-[#001F3F]">
        Cargando Sistema...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
};

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/reminders" replace />;
  if (user?.role === "ASSISTANT") return <Navigate to="/reminders" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      {/* Toaster con closeButton activado globalmente */}
      <Toaster
        position="top-right"
        richColors
        closeButton={true}
        duration={4000}
        expand={true}
        theme="light"
        toastOptions={{
          style: {
            padding: "16px 20px",
            borderRadius: "12px",
            minWidth: "320px",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* 1. GRUPO PANEL GENERAL (TU DASHBOARD Y COMPANIES) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Rutas de ADMIN: Estas vuelven a estar visibles dentro de MainLayout */}
            <Route
              path="/activities"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pending-items"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "ASSISTANT"]}>
                  <PendingItem />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reminders"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "ASSISTANT"]}>
                  <ReminderUser />
                </ProtectedRoute>
              }
            />

            {/* Rutas de ASSISTANT */}
            <Route
              path="/assistant"
              element={
                <ProtectedRoute allowedRoles={["ASSISTANT"]}>
                  <AssistantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/profile"
              element={
                <ProtectedRoute allowedRoles={["ASSISTANT"]}>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Rutas Compartidas */}
            <Route
              path="/tasks"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 2. GRUPO WORKSPACE INDEPENDIENTE (AQUÍ ES DONDE CAMBIAMOS EL LAYOUT) */}
          <Route
            path="/companies/:companyId"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <CompanyWorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CompanyDashboard />} />
            <Route path="activities" element={<CompanyActivities />} />
            <Route path="tasks" element={<CompanyTasks />} />
            <Route path="files" element={<CompanyExplorer />} />
          </Route>

          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <ProjectWorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProjectDashboard />} />
            <Route path="objects" element={<ProjectObjectExplorer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
