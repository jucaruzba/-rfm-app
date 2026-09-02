import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { setMonth, setYear, getMonth, getYear } from "date-fns";

const MONTHS = [
  { value: 0, name: "January", short: "Jan", es: "Enero" },
  { value: 1, name: "February", short: "Feb", es: "Febrero" },
  { value: 2, name: "March", short: "Mar", es: "Marzo" },
  { value: 3, name: "April", short: "Apr", es: "Abril" },
  { value: 4, name: "May", short: "May", es: "Mayo" },
  { value: 5, name: "June", short: "Jun", es: "Junio" },
  { value: 6, name: "July", short: "Jul", es: "Julio" },
  { value: 7, name: "August", short: "Aug", es: "Agosto" },
  { value: 8, name: "September", short: "Sep", es: "Septiembre" },
  { value: 9, name: "October", short: "Oct", es: "Octubre" },
  { value: 10, name: "November", short: "Nov", es: "Noviembre" },
  { value: 11, name: "December", short: "Dec", es: "Diciembre" },
];

const MonthYearPicker = ({ isOpen, onClose, currentDate, onSelect, lang = "en" }) => {
  const popupRef = useRef(null);
  const activeDate = currentDate instanceof Date && !isNaN(currentDate) ? currentDate : new Date();
  
  const [selectedYear, setSelectedYear] = useState(getYear(activeDate));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(activeDate));

  useEffect(() => {
    if (isOpen) {
      const d = currentDate instanceof Date && !isNaN(currentDate) ? currentDate : new Date();
      setSelectedYear(getYear(d));
      setSelectedMonth(getMonth(d));
    }
  }, [isOpen, currentDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMonthClick = (monthIndex) => {
    setSelectedMonth(monthIndex);
    const newDate = setMonth(setYear(activeDate, selectedYear), monthIndex);
    onSelect(newDate);
    onClose();
  };

  const handleTodayClick = () => {
    const today = new Date();
    onSelect(today);
    onClose();
  };

  const activeCurrentMonth = getMonth(activeDate);
  const activeCurrentYear = getYear(activeDate);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={popupRef}
        className="w-full max-w-sm bg-white rounded-[14px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E5E5EA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5EA] mb-4">
          <div className="flex items-center gap-2 text-[#1C1C1E]">
            <Calendar size={16} strokeWidth={1.5} className="text-[#1C1C1E]" />
            <h3 className="text-[14px] font-semibold">
              {lang === "es" ? "Seleccionar mes y año" : "Select month and year"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#AEAEB2] hover:text-[#1C1C1E] transition-colors cursor-pointer"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between bg-[#FAFAFA] rounded-[10px] p-2 mb-4 border border-[#E5E5EA]">
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 hover:bg-white rounded-[8px] text-[#6E6E73] hover:text-[#1C1C1E] transition-all cursor-pointer"
            title="Previous Year"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          <span className="text-[15px] font-semibold text-[#1C1C1E]">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 hover:bg-white rounded-[8px] text-[#6E6E73] hover:text-[#1C1C1E] transition-all cursor-pointer"
            title="Next Year"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {MONTHS.map((m) => {
            const isSelected =
              selectedMonth === m.value && selectedYear === activeCurrentYear;
            const isCurrentYearMonth =
              getMonth(new Date()) === m.value &&
              getYear(new Date()) === selectedYear;

            return (
              <button
                type="button"
                key={`month-picker-${m.value}`}
                onClick={() => handleMonthClick(m.value)}
                className={`py-2 px-2.5 rounded-[8px] text-[12px] font-medium transition-colors text-center cursor-pointer ${
                  isSelected
                    ? "bg-[#171717] text-white shadow-xs"
                    : isCurrentYearMonth
                    ? "bg-[#FAFAFA] text-[#1C1C1E] border border-[#171717]/40 font-semibold"
                    : "bg-[#FAFAFA] text-[#1C1C1E] hover:bg-[#F2F2F7] border border-[#E5E5EA]"
                }`}
              >
                <span>{lang === "es" ? m.es : m.short}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA]">
          <button
            type="button"
            onClick={handleTodayClick}
            className="px-3 py-1.5 text-[12px] font-medium text-[#171717] hover:underline rounded-[8px] transition-colors cursor-pointer"
          >
            {lang === "es" ? "Mes actual" : "Current month"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-[12px] font-medium text-[#6E6E73] hover:text-[#1C1C1E] bg-white border border-[#E5E5EA] hover:bg-[#FAFAFA] rounded-[8px] transition-colors cursor-pointer"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthYearPicker;

