import React from "react";
import { MinidiscIcon } from "../HeaderContent/SvgIcons.js";
import { cn } from "../../lib/utils.js";

type ButtonColor =
  | "defaultBlue"
  | "electricYellow"
  | "hotPink"
  | "cyberLime"
  | "retroOrange"
  | "coolCyan"
  | "violetDream"
  | "dangerRed";

interface SaveButtonProps {
  onClick: () => void;
  hasChanges: boolean;
  syntaxErrorCount?: number;
  color?: ButtonColor;
}

const colorMap: Record<ButtonColor, string> = {
  defaultBlue: "bg-blue-500 hover:bg-blue-600 text-white",
  electricYellow: "bg-yellow-300 hover:bg-yellow-400 text-black",
  hotPink: "bg-pink-400 hover:bg-pink-500 text-white",
  cyberLime: "bg-lime-400 hover:bg-lime-500 text-white",
  retroOrange: "bg-orange-400 hover:bg-orange-500 text-white",
  coolCyan: "bg-cyan-400 hover:bg-cyan-500 text-white",
  violetDream: "bg-violet-400 hover:bg-violet-500 text-white",
  dangerRed: "bg-red-400 hover:bg-red-500 text-white",
};

export function SaveButton({
  onClick,
  hasChanges,
  syntaxErrorCount = 0,
  color = "defaultBlue",
}: SaveButtonProps) {
  if (!hasChanges) return null;

  const hasErrors = syntaxErrorCount > 0;

  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-[5px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-black";

  const shadowClasses = "shadow-[4px_4px_0px_0px_black]";
  const activeClasses =
    "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";

  // If any error always show red
  const variantClasses = hasErrors
    ? "bg-red-500 text-white hover:bg-red-600 cursor-not-allowed opacity-75"
    : colorMap[color];

  const buttonText = hasErrors
    ? `${syntaxErrorCount} Error${syntaxErrorCount !== 1 ? "s" : ""}`
    : "Save";

  return (
    <>
      <button
        onClick={onClick}
        disabled={hasErrors}
        className={cn(
          baseClasses,
          shadowClasses,
          activeClasses,
          variantClasses,
          "hidden gap-2 px-4 py-2 sm:flex",
        )}
      >
        <MinidiscIcon className="h-4 w-4" />
        {buttonText}
      </button>

      <button
        onClick={onClick}
        disabled={hasErrors}
        className={cn(
          baseClasses,
          shadowClasses,
          activeClasses,
          variantClasses,
          "flex h-10 w-10 sm:hidden",
        )}
        title={
          hasErrors
            ? `${syntaxErrorCount} syntax error${syntaxErrorCount !== 1 ? "s" : ""}`
            : "Save changes"
        }
      >
        <MinidiscIcon className="h-4 w-4" />
      </button>
    </>
  );
}
