import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { LogIn, Loader2, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { toast } from "sonner";
import clientLogo from "../assets/logo.png";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
      const { token } = await authService.login(credentials);
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const session = await authService.validateSession();

      if (session.status) {
        setUser(session.user);
        toast.success(`Welcome back, ${session.user.username}`);
        navigate("/");
      } else {
        localStorage.removeItem("token");
        api.defaults.headers.common["Authorization"] = "";
        throw new Error("Invalid session after token validation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Invalid credentials. Please verify your username and password.");
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
      const message = await userService.forgotPassword({ email: forgotPasswordEmail });
      toast.success(message || "Temporary password sent to your email.");
      setIsForgotPasswordMode(false);
      setForgotPasswordEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send temporary password. Please verify the email address.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] p-4 sm:p-6 select-none">
      <div className="max-w-[420px] w-full bg-[#1C1C1E] border border-[#2C2C2E] shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-[14px] p-8 sm:p-9 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo Section with identical #171717 container */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-full bg-[#171717] border border-[#2C2C2E] rounded-[12px] py-4 px-6 flex items-center justify-center mb-5">
            <img
              src={clientLogo}
              alt="RFM Logo"
              className="max-h-16 w-auto object-contain"
            />
          </div>
          
          <h1 className="text-[20px] font-semibold text-white tracking-tight">
            Management platform
          </h1>
          <p className="text-[#8E8E93] text-[13px] mt-1">
            Sign in to access your workspace
          </p>
        </div>

        {!isForgotPasswordMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8E8E93] lowercase">
                username
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-[#333336] hover:border-[#48484A] rounded-[10px] text-[13.5px] text-white placeholder-[#636366] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all disabled:opacity-50"
                placeholder="enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-[#8E8E93] lowercase">
                  password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordMode(true)}
                  className="text-[12px] text-[#AEAEB2] hover:text-white transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  className="w-full pr-10 px-3.5 py-2.5 bg-[#171717] border border-[#333336] hover:border-[#48484A] rounded-[10px] text-[13.5px] text-white placeholder-[#636366] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all disabled:opacity-50"
                  placeholder="enter your password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#636366] hover:text-white focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-[10px] text-[13.5px] font-semibold text-[#171717] bg-white hover:bg-[#F2F2F7] active:bg-[#E5E5EA] focus:outline-none transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 animate-spin text-[#171717]" size={16} strokeWidth={2} />
                ) : (
                  <LogIn className="mr-2 text-[#171717]" size={16} strokeWidth={2} />
                )}
                {isSubmitting ? "Authenticating..." : "Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-[16px] font-semibold text-white">
                Reset password
              </h3>
              <p className="text-[12.5px] text-[#8E8E93] mt-1">
                Enter your email address and we'll send you a temporary password.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8E8E93] lowercase">
                email address
              </label>
              <input
                type="email"
                required
                disabled={isSendingEmail}
                value={forgotPasswordEmail}
                className="w-full px-3.5 py-2.5 bg-[#171717] border border-[#333336] hover:border-[#48484A] rounded-[10px] text-[13.5px] text-white placeholder-[#636366] focus:outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all disabled:opacity-50"
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSendingEmail || !forgotPasswordEmail}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-[10px] text-[13.5px] font-semibold text-[#171717] bg-white hover:bg-[#F2F2F7] active:bg-[#E5E5EA] focus:outline-none transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 animate-spin text-[#171717]" size={16} strokeWidth={2} />
                ) : (
                  <Mail className="mr-2 text-[#171717]" size={16} strokeWidth={2} />
                )}
                {isSendingEmail ? "Sending..." : "Send temporary password"}
              </button>
              
              <button
                type="button"
                onClick={() => setIsForgotPasswordMode(false)}
                className="w-full flex justify-center items-center gap-1.5 py-2 px-4 rounded-[10px] text-[12.5px] font-medium text-[#AEAEB2] hover:text-white bg-[#171717] border border-[#333336] hover:border-[#48484A] hover:bg-[#242426] transition-colors focus:outline-none cursor-pointer"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                <span>Back to sign in</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#2C2C2E] text-center">
          <p className="text-[11px] text-[#636366]">
            © 2026 RFM Industrial Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;


