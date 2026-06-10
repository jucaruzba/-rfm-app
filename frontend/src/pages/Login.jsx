import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importante para la redirección
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { userService } from "../services/userService"; // Import userService for forgot password
import { LogIn, Loader2, Eye, EyeOff, Mail } from "lucide-react"; // Loader y iconos de visibilidad para el feedback visual
import api from "../services/api"; // Import the api instance
import { toast } from "sonner"; // Utilería de mensajes

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para la visibilidad de la contraseña
  
  // Forgot Password States
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Autenticación inicial
      const { token } = await authService.login(credentials);

      // 2. Persistencia del token y validación de sesión
      localStorage.setItem("token", token);
      // FIX: Ensure the API instance uses the new token immediately
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const session = await authService.validateSession();

      if (session.status) {
        setUser(session.user);
        toast.success(`Welcome back, ${session.user.username}`);

        // 4. Redirección automática basada en el rol
        // El "/" gatilla el RoleBasedRedirect que pusimos en App.jsx
        navigate("/"); // This will trigger AuthContext's useEffect to re-validate and set user
      } else {
        // If session.status is false, it means validation failed even with the new token.
        // This might indicate a problem with the token itself or the validateSession endpoint.
        localStorage.removeItem("token"); // Clear invalid token
        api.defaults.headers.common["Authorization"] = ""; // Clear header as well
        throw new Error("Invalid session after token validation");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        "Invalid credentials. Please verify your username and password.",
      );
      // Ensure token is removed if login or validation fails
      localStorage.removeItem("token");
      api.defaults.headers.common["Authorization"] = "";
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) return;
    setIsSendingEmail(true);
    try {
      // Usamos el servicio de usuario para la recuperación de contraseña
      const message = await userService.forgotPassword({ email: forgotPasswordEmail });
      toast.success(message || "Temporary password sent to your email.");
      setIsForgotPasswordMode(false);
      setForgotPasswordEmail("");
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to send temporary password. Please verify the email address.",
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-white">
      <div className="max-w-md w-full p-8 border border-gray-100 shadow-sm rounded-lg bg-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-brand-navy tracking-tight">
            RFM SYSTEM
          </h2>
          <p className="text-brand-dark-gray mt-2 font-light">
            Professional Industrial Management
          </p>
        </div>

        {!isForgotPasswordMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-brand-dark-gray mb-1">
                Username
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-navy focus:border-brand-navy outline-none transition-all disabled:bg-gray-50"
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-brand-dark-gray mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // Cambia el tipo de input
                  required
                  disabled={isSubmitting}
                  className="mt-1 block w-full pr-10 px-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-navy focus:border-brand-navy outline-none transition-all disabled:bg-gray-50"
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="text-xs text-brand-navy hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:bg-opacity-90 focus:outline-none transition-all disabled:bg-slate-400"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 animate-spin" size={18} />
              ) : (
                <LogIn className="mr-2" size={18} />
              )}
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-brand-navy">
                Reset Password
              </h3>
              <p className="text-sm text-brand-dark-gray mt-1">
                Enter your email address and we'll send you a temporary password.
              </p>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-brand-dark-gray mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isSendingEmail}
                value={forgotPasswordEmail}
                className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-navy focus:border-brand-navy outline-none transition-all disabled:bg-gray-50"
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingEmail || !forgotPasswordEmail}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:bg-opacity-90 focus:outline-none transition-all disabled:bg-slate-400"
            >
              {isSendingEmail ? (
                <Loader2 className="mr-2 animate-spin" size={18} />
              ) : (
                <Mail className="mr-2" size={18} />
              )}
              {isSendingEmail ? "Sending..." : "Send Temporary Password"}
            </button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsForgotPasswordMode(false)}
                className="text-sm text-brand-dark-gray hover:text-brand-navy hover:underline focus:outline-none"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400">
            © 2026 RFM Industrial Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
