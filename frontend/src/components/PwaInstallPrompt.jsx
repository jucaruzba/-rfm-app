import { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
} from "lucide-react";

const checkIsStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const detectPlatform = () => {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
};

export const PwaInstallPrompt = ({ variant = "banner" }) => {
  const [isStandalone, setIsStandalone] = useState(checkIsStandalone);
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== "undefined" ? window.__deferredPwaPrompt : null) || null
  );
  const [showModal, setShowModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("rfm_pwa_banner_dismissed") === "1";
  });

  const platform = detectPlatform();
  const [activeGuideTab, setActiveGuideTab] = useState(
    platform === "ios" ? "ios" : "android"
  );

  useEffect(() => {
    const syncPrompt = () => {
      setDeferredPrompt(window.__deferredPwaPrompt || null);
    };
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowModal(false);
    };
    const handleOpenModal = () => {
      setShowModal(true);
    };

    window.addEventListener("pwa-prompt-available", syncPrompt);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    if (variant === "banner") {
      window.addEventListener("open-pwa-install-modal", handleOpenModal);
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e) => setIsStandalone(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    return () => {
      window.removeEventListener("pwa-prompt-available", syncPrompt);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (variant === "banner") {
        window.removeEventListener("open-pwa-install-modal", handleOpenModal);
      }
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };
  }, [variant]);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch (err) {
        console.error("PWA install prompt error:", err);
      }
    }
    // Open step-by-step modal for iPhone / Android
    if (variant === "banner") {
      setShowModal(true);
    } else {
      window.dispatchEvent(new CustomEvent("open-pwa-install-modal"));
    }
  };

  const dismissBanner = () => {
    sessionStorage.setItem("rfm_pwa_banner_dismissed", "1");
    setBannerDismissed(true);
  };

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#5B5FEF]/15 text-[#5B5FEF] hover:bg-[#5B5FEF]/25 border border-[#5B5FEF]/30 rounded-[10px] transition-colors text-[12px] font-medium cursor-pointer"
      >
        <Download size={14} strokeWidth={1.5} />
        Install app
      </button>
    );
  }

  if (variant === "login") {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] text-[12.5px] font-medium text-[#AEAEB2] hover:text-white bg-[#171717] border border-[#2C2C2E] hover:border-[#48484A] transition-all cursor-pointer"
      >
        <Smartphone size={15} strokeWidth={1.5} className="text-[#5B5FEF]" />
        <span>Install app on iPhone / Android</span>
      </button>
    );
  }

  // Default: "banner" + global modal
  const isMobile = platform === "ios" || platform === "android";
  const shouldShowFloatingBanner = !bannerDismissed && (isMobile || !!deferredPrompt);

  return (
    <>
      {shouldShowFloatingBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-[360px] bg-[#171717] text-white border border-[#2C2C2E] rounded-[14px] p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <img
            src="/apple-touch-icon.png"
            alt="RFM App"
            className="w-11 h-11 rounded-[10px] border border-[#2C2C2E] shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-white leading-tight">
              Install RFM app
            </p>
            <p className="text-[11.5px] text-[#AEAEB2] truncate mt-0.5">
              {platform === "ios"
                ? "Add to your iPhone home screen"
                : "Download icon for quick access"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-[#5B5FEF] hover:bg-[#4B4FDF] text-white text-[12.5px] font-medium rounded-[8px] transition-colors shrink-0 cursor-pointer"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Close install banner"
            className="p-1 text-[#8E8E93] hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E5EA] rounded-[14px] max-w-[400px] w-full p-6 shadow-2xl relative text-[#1C1C1E]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  alt="RFM"
                  className="w-11 h-11 rounded-[10px] border border-[#E5E5EA] shadow-xs"
                />
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1C1C1E] leading-tight">
                    Install app
                  </h3>
                  <span className="text-[12px] text-[#6E6E73] lowercase">
                    rfm management platform
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA] rounded-[8px] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Platform Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAFAFA] border border-[#E5E5EA] rounded-[10px] mb-4">
              <button
                type="button"
                onClick={() => setActiveGuideTab("ios")}
                className={`py-1.5 px-3 rounded-[8px] text-[12.5px] font-medium transition-all cursor-pointer ${
                  activeGuideTab === "ios"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab("android")}
                className={`py-1.5 px-3 rounded-[8px] text-[12.5px] font-medium transition-all cursor-pointer ${
                  activeGuideTab === "android"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                Android
              </button>
            </div>

            {activeGuideTab === "ios" ? (
              <div className="space-y-3 text-[13px]">
                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <Share size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      1. Tap the Share button
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      In Safari, tap the{" "}
                      <span className="font-medium text-[#1C1C1E]">Share</span>{" "}
                      icon at the bottom (or top) of your screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      2. Tap "Add to Home Screen"
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Scroll down the menu and select{" "}
                      <span className="font-medium text-[#1C1C1E]">
                        Add to Home Screen
                      </span>{" "}
                      (Agregar a pantalla de inicio).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      3. Tap "Add" in the top corner
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      The RFM icon will appear on your iPhone and open in full screen.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-[13px]">
                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <MoreVertical size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      1. Open the browser menu
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      In Chrome, tap the{" "}
                      <span className="font-medium text-[#1C1C1E]">⋮</span> icon
                      in the top-right corner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <Download size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      2. Tap "Install app" or "Add to Home screen"
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Select{" "}
                      <span className="font-medium text-[#1C1C1E]">
                        Add to Home screen
                      </span>{" "}
                      (Agregar a la pantalla principal / Instalar aplicación).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      3. Confirm installation
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      The RFM icon will be added directly to your Android home screen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 px-4 bg-[#5B5FEF] hover:bg-[#4B4FDF] text-white text-[13px] font-medium rounded-[10px] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
