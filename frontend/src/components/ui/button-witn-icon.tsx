import React from "react";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonWithIconProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
  icon?: LucideIcon;
  iconSize?: number;
  circleClassName?: string;
}

export const ButtonWithIcon = React.forwardRef<
  HTMLButtonElement,
  ButtonWithIconProps
>(
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
        btn: "h-9 pl-5 pr-11 hover:pl-11 hover:pr-5 text-xs font-bold",
        circle: "right-1 top-1/2 -translate-y-1/2 w-7 h-7 group-hover:right-[calc(100%-32px)]",
        icon: 15,
      },
      default: {
        btn: "h-10 pl-6 pr-12 hover:pl-12 hover:pr-6 text-[13px] font-bold",
        circle: "right-1 top-1/2 -translate-y-1/2 w-8 h-8 group-hover:right-[calc(100%-36px)]",
        icon: 16,
      },
      lg: {
        btn: "h-12 pl-7 pr-14 hover:pl-14 hover:pr-7 text-sm font-extrabold",
        circle: "right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 group-hover:right-[calc(100%-42px)]",
        icon: 18,
      },
    }[size] || {
      btn: "h-10 pl-6 pr-12 hover:pl-12 hover:pr-6 text-[13px] font-bold",
      circle: "right-1 top-1/2 -translate-y-1/2 w-8 h-8 group-hover:right-[calc(100%-36px)]",
      icon: 16,
    };

    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center rounded-full overflow-hidden cursor-pointer shadow-md transition-all duration-500 whitespace-nowrap select-none",
          "bg-gradient-to-r from-[#F7941D] to-[#E67E00] text-white hover:from-[#FB923C] hover:to-[#F7941D] hover:shadow-[0_6px_20px_rgba(247,148,29,0.45)]",
          sizeConfig.btn,
          className
        )}
        {...props}
      >
        <span className="relative z-10 transition-all duration-500 tracking-wide font-extrabold flex items-center">
          {children}
        </span>
        <div
          className={cn(
            "absolute bg-white text-[#F7941D] rounded-full flex items-center justify-center shadow-md transition-all duration-500 group-hover:rotate-45 shrink-0 pointer-events-none",
            sizeConfig.circle,
            circleClassName
          )}
        >
          <Icon
            size={iconSize || sizeConfig.icon}
            strokeWidth={2.5}
            className="transition-transform duration-500 shrink-0"
          />
        </div>
      </button>
    );
  }
);
ButtonWithIcon.displayName = "ButtonWithIcon";

export default function ButtonWithIconDemo(props: ButtonWithIconProps) {
  return <ButtonWithIcon {...props} />;
}
