import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ButtonWithIcon = React.forwardRef(
  (
    {
      children = "Join Our Community",
      className,
      size = "default",
      icon: Icon = ArrowUpRight,
      iconSize,
      circleClassName,
      ...props
    },
    ref
  ) => {
    const sizeConfig = {
      sm: {
        btn: "h-9 pl-3.5 pr-1.5 text-xs font-bold gap-1.5",
        circle: "w-6 h-6",
        icon: 13,
      },
      default: {
        btn: "h-10 pl-4 pr-1.5 text-[13px] font-bold gap-2",
        circle: "w-7 h-7",
        icon: 15,
      },
      lg: {
        btn: "h-12 pl-5 pr-2 text-sm font-extrabold gap-2.5",
        circle: "w-8 h-8",
        icon: 16,
      },
    }[size] || {
      btn: "h-10 pl-4 pr-1.5 text-[13px] font-bold gap-2",
      circle: "w-7 h-7",
      icon: 15,
    };

    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center rounded-full cursor-pointer shadow-md transition-all duration-300 whitespace-nowrap select-none",
          "bg-gradient-to-r from-[#F7941D] to-[#E67E00] text-white hover:from-[#FB923C] hover:to-[#F7941D] hover:shadow-[0_6px_20px_rgba(247,148,29,0.45)] hover:-translate-y-0.5 active:translate-y-0",
          sizeConfig.btn,
          className
        )}
        {...props}
      >
        <span className="relative z-10 tracking-wide font-extrabold flex items-center">
          {children}
        </span>
        <div
          className={cn(
            "bg-white text-[#F7941D] rounded-full flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:rotate-45 shrink-0 pointer-events-none",
            sizeConfig.circle,
            circleClassName
          )}
        >
          <Icon
            size={iconSize || sizeConfig.icon}
            strokeWidth={2.5}
            className="shrink-0 transition-transform duration-300"
          />
        </div>
      </button>
    );
  }
);
ButtonWithIcon.displayName = "ButtonWithIcon";

export default function ButtonWithIconDemo(props) {
  return <ButtonWithIcon {...props} />;
}
