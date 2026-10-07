import { format, parseISO, isValid } from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Standardized Date Formatter
 * Formats dates into: "MM/dd/yyyy" (MES/DIA/AÑO)
 */
export const formatUsDate = (dateVal, options = {}) => {
  if (!dateVal) return options.fallback || "--/--/----";

  try {
    let dateObj;
    if (Array.isArray(dateVal)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateVal;
      dateObj = new Date(year, month - 1, day, hour, minute, second);
    } else if (typeof dateVal === "string") {
      const cleanStr = dateVal.includes(" ") && !dateVal.includes("T")
        ? dateVal.replace(" ", "T")
        : dateVal;
      dateObj = cleanStr.includes("T")
        ? parseISO(cleanStr)
        : parseISO(`${cleanStr}T00:00:00`);
    } else if (dateVal instanceof Date) {
      dateObj = dateVal;
    }

    if (!dateObj || !isValid(dateObj)) {
      return String(dateVal);
    }

    // Default: MES/DIA/AÑO -> MM/dd/yyyy
    return format(dateObj, "MM/dd/yyyy", { locale: enUS });
  } catch {
    return String(dateVal);
  }
};

/**
 * Formats time in 12-hour format with AM/PM (e.g. "1:30 PM", "10:00 PM")
 * Never displays 24-hour military time (13, 14, 18, etc.)
 */
export const formatUsTime = (dateOrTimeVal) => {
  if (!dateOrTimeVal) return "";
  try {
    let dateObj;
    if (Array.isArray(dateOrTimeVal)) {
      if (dateOrTimeVal.length < 4) return "";
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateOrTimeVal;
      dateObj = new Date(year, month - 1, day, hour, minute, second);
    } else if (
      typeof dateOrTimeVal === "string" &&
      dateOrTimeVal.length === 5 &&
      dateOrTimeVal.includes(":")
    ) {
      const [hours, minutes] = dateOrTimeVal.split(":").map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return format(d, "h:mm a", { locale: enUS });
    } else if (typeof dateOrTimeVal === "string") {
      if (!dateOrTimeVal.includes("T") && !dateOrTimeVal.includes(":") && !dateOrTimeVal.includes(" ")) {
        return "";
      }
      const cleanStr = dateOrTimeVal.includes(" ") && !dateOrTimeVal.includes("T")
        ? dateOrTimeVal.replace(" ", "T")
        : dateOrTimeVal;
      dateObj = parseISO(cleanStr);
    } else if (dateOrTimeVal instanceof Date) {
      dateObj = dateOrTimeVal;
    }
    if (dateObj && isValid(dateObj)) {
      return format(dateObj, "h:mm a", { locale: enUS });
    }
    return String(dateOrTimeVal);
  } catch {
    return String(dateOrTimeVal);
  }
};

/**
 * Formats date and time: e.g. "MM/dd/yyyy: h:mm a" (e.g. "10/07/2026: 2:30 PM")
 * Formato requerido: MES/DIA/AÑO: HORA (en formato 12 horas, ej. 1:00 PM, 2:30 PM, no 14, 13, 18)
 */
export const formatUsDateTime = (dateVal) => {
  if (!dateVal) return "--/--/----";
  const dateStr = formatUsDate(dateVal);
  const timeStr = formatUsTime(dateVal);
  if (!timeStr) return dateStr;
  return `${dateStr}: ${timeStr}`;
};

/**
 * Converts frontend HTML input date string (YYYY-MM-DD) to Backend format (DD/MM/YYYY)
 */
export const formatDateToBackend = (dateString) => {
  if (!dateString) return null;
  if (dateString.includes("/")) return dateString;
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

/**
 * Formats backend date (array [y,m,d] or string) to HTML input value (YYYY-MM-DD)
 */
export const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (Array.isArray(dateVal)) {
    const [y, m, d] = dateVal;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof dateVal === "string") {
    if (dateVal.includes("T")) return dateVal.split("T")[0];
    if (dateVal.includes("/")) {
      const [d, m, y] = dateVal.split("/");
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateVal;
  }
  return "";
};
