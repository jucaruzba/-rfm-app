import { useState, useEffect } from "react";
import {
  Download,
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
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost"
    ) {
      const targetHost = window.location.hostname.startsWith("192.168.4.87")
        ? "192-168-4-87.pvault88.direct.quickconnect.to:8081"
        : "pvault88.direct.quickconnect.to:8081";
      window.location.href = `https://${targetHost}${window.location.pathname}${window.location.search}`;
      return;
    }

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
        Descargar App
      </button>
    );
  }

  if (variant === "login") {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] text-[12.5px] font-medium text-white bg-[#5B5FEF] hover:bg-[#4B4FDF] transition-all shadow-sm cursor-pointer"
      >
        <Download size={15} strokeWidth={1.75} />
        <span>Descargar App (Android / iPhone)</span>
      </button>
    );
  }

  const isMobile = platform === "ios" || platform === "android";
  const shouldShowFloatingBanner = !bannerDismissed && (isMobile || !!deferredPrompt);

  return (
    <>
      {shouldShowFloatingBanner && (
        <div className="fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))] left-3.5 right-3.5 z-50 sm:left-auto sm:right-6 sm:max-w-[360px] bg-[#171717] text-white border border-[#2C2C2E] rounded-[14px] p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <img
            src="/apple-touch-icon.png"
            alt="RFM App"
            className="w-11 h-11 rounded-[10px] border border-[#2C2C2E] shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-white leading-tight">
              Instalar RFM App
            </p>
            <p className="text-[11.5px] text-[#AEAEB2] truncate mt-0.5">
              {deferredPrompt
                ? "Descarga directa en tu teléfono"
                : platform === "ios"
                  ? "Agregar a pantalla de inicio en iPhone"
                  : "Descargar ícono en pantalla principal"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-[#5B5FEF] hover:bg-[#4B4FDF] text-white text-[12.5px] font-medium rounded-[8px] transition-colors shrink-0 cursor-pointer"
          >
            Descargar
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Cerrar banner"
            className="p-1 text-[#8E8E93] hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E5EA] rounded-[14px] max-w-[400px] w-full p-5 sm:p-6 shadow-2xl relative text-[#1C1C1E]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/apple-touch-icon.png"
                  alt="RFM"
                  className="w-11 h-11 rounded-[10px] border border-[#E5E5EA] shadow-xs"
                />
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#1C1C1E] leading-tight">
                    Instalar aplicación RFM
                  </h3>
                  <span className="text-[12px] text-[#6E6E73]">
                    Sigue estos pasos en tu navegador:
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
                onClick={() => setActiveGuideTab("android")}
                className={`py-1.5 px-3 rounded-[8px] text-[12.5px] font-medium transition-all cursor-pointer ${
                  activeGuideTab === "android"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                Android (Chrome)
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab("ios")}
                className={`py-1.5 px-3 rounded-[8px] text-[12.5px] font-medium transition-all cursor-pointer ${
                  activeGuideTab === "ios"
                    ? "bg-white text-[#1C1C1E] shadow-xs border border-[#E5E5EA]"
                    : "text-[#6E6E73] hover:text-[#1C1C1E]"
                }`}
              >
                iPhone / iPad (Safari)
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
                      1. Toca el botón "Compartir" de Safari
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      En la barra inferior de Safari, toca el ícono del cuadro con flecha hacia arriba.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      2. Elige "Agregar a pantalla de inicio"
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Desliza el menú hacia abajo y selecciona{" "}
                      <span className="font-medium text-[#1C1C1E]">
                        Agregar a pantalla de inicio
                      </span>{" "}
                      (Add to Home Screen).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      3. Toca "Agregar" arriba a la derecha
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      El ícono de RFM aparecerá junto a tus apps y abrirá a pantalla completa.
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
                      1. Toca los 3 puntos (⋮) arriba a la derecha
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      En la esquina superior derecha de Chrome, abre el menú de opciones{" "}
                      <span className="font-medium text-[#1C1C1E]">⋮</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#5B5FEF]/10 text-[#5B5FEF] flex items-center justify-center shrink-0 mt-0.5">
                    <Download size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      2. Toca "Instalar aplicación" o "Agregar a la pantalla principal"
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Selecciona{" "}
                      <span className="font-medium text-[#1C1C1E]">
                        Instalar aplicación
                      </span>{" "}
                      o{" "}
                      <span className="font-medium text-[#1C1C1E]">
                        Agregar a la pantalla principal
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5EA]">
                  <div className="w-7 h-7 rounded-[8px] bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1C1E]">
                      3. Confirma en "Instalar"
                    </p>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">
                      Android descargará e instalará el ícono de RFM en tu teléfono.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 px-4 bg-[#171717] hover:bg-[#2C2C2E] text-white text-[13px] font-medium rounded-[10px] transition-colors cursor-pointer"
            >
              Cerrar guía
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
