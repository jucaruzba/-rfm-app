import React from "react";
import { cn } from "../../utils/cn";

/**
 * Button component supporting variants based on system design.
 * - primary: system dark background (#171717 / #2C2C2E)
 * - secondary: white card with #E5E5EA border
 * - danger: red background for destructive actions (#EF4444)
 * - ghost: subtle hover background
 */
export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseClasses =
    "flex items-center justify-center px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const variants = {
    primary: "bg-[#171717] text-white hover:bg-[#2C2C2E] active:bg-[#000000] shadow-xs",
    secondary:
      "bg-white border border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#FAFAFA] active:bg-[#F2F2F7]",
    danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C]",
    ghost: "bg-transparent text-[#6E6E73] hover:text-[#1C1C1E] hover:bg-[#FAFAFA]",
  };
  return (
    <button
      className={cn(baseClasses, variants[variant] ?? variants.primary, className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;


