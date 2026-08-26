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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={popupRef}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2 text-[#001F3F]">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              {lang === "es" ? "Saltar a Mes / Año" : "Jump to Month / Year"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 mb-4 border border-gray-100">
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-2 hover:bg-white rounded-xl text-gray-700 hover:text-[#001F3F] transition-all hover:shadow-xs cursor-pointer"
            title="Previous Year"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-[#001F3F] tracking-tight">
              {selectedYear}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-2 hover:bg-white rounded-xl text-gray-700 hover:text-[#001F3F] transition-all hover:shadow-xs cursor-pointer"
            title="Next Year"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 12 Months Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
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
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all text-center flex flex-col items-center justify-center relative cursor-pointer ${
                  isSelected
                    ? "bg-[#001F3F] text-white shadow-md shadow-blue-900/20"
                    : isCurrentYearMonth
                    ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    : "bg-gray-50/80 text-gray-700 hover:bg-gray-100 hover:text-black border border-gray-100"
                }`}
              >
                <span>{lang === "es" ? m.es : m.name}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
          <button
            type="button"
            onClick={handleTodayClick}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
          >
            {lang === "es" ? "Mes Actual" : "Current Month"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthYearPicker;
