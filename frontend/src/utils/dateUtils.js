import { format, parseISO, isValid } from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Standardized US Date Formatter
 * Formats dates into US format: e.g. "Aug 27, 2026" or "MM/dd/yyyy"
 */
export const formatUsDate = (dateVal, options = {}) => {
  if (!dateVal) return options.fallback || "--/--/----";

  try {
    let dateObj;
    if (Array.isArray(dateVal)) {
      const [year, month, day] = dateVal;
      dateObj = new Date(year, month - 1, day);
    } else if (typeof dateVal === "string") {
      dateObj = dateVal.includes("T")
        ? parseISO(dateVal)
        : parseISO(`${dateVal}T00:00:00`);
    } else if (dateVal instanceof Date) {
      dateObj = dateVal;
    }

    if (!dateObj || !isValid(dateObj)) {
      return String(dateVal);
    }

    if (options.compact) {
      return format(dateObj, "MM/dd/yyyy", { locale: enUS });
    }

    // Default US date format: e.g. "Aug 27, 2026"
    return format(dateObj, "MMM d, yyyy", { locale: enUS });
  } catch {
    return String(dateVal);
  }
};

/**
 * Formats time in 12-hour format with AM/PM (e.g. "10:00 PM")
 */
export const formatUsTime = (dateOrTimeVal) => {
  if (!dateOrTimeVal) return "";
  try {
    if (
      typeof dateOrTimeVal === "string" &&
      dateOrTimeVal.length === 5 &&
      dateOrTimeVal.includes(":")
    ) {
      const [hours, minutes] = dateOrTimeVal.split(":").map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return format(d, "h:mm a", { locale: enUS });
    }

    let dateObj =
      typeof dateOrTimeVal === "string"
        ? parseISO(dateOrTimeVal)
        : dateOrTimeVal;
    if (isValid(dateObj)) {
      return format(dateObj, "h:mm a", { locale: enUS });
    }
    return String(dateOrTimeVal);
  } catch {
    return String(dateOrTimeVal);
  }
};

/**
 * Formats date and time: e.g. "Aug 27, 2026, 10:00 PM"
 */
export const formatUsDateTime = (dateVal) => {
  if (!dateVal) return "--/--/----";
  return `${formatUsDate(dateVal)} at ${formatUsTime(dateVal)}`;
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
