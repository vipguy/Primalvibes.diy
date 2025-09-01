// theme.ts

// Only one theme: Neumorphic Dark
export type Theme = "neumorphic-dark";

// Theme definition
export const themes = {
  "neumorphic-dark": {
    button: {
      border: "border border-transparent",
      shadow:
        "shadow-[inset_-4px_-4px_8px_rgba(255,255,255,0.05),_inset_4px_4px_8px_rgba(0,0,0,0.7)]",
      radius: "rounded-xl",
      active:
        "active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),_inset_-4px_-4px_8px_rgba(255,255,255,0.05)]",
      normal: "bg-[#1e1e1e] text-gray-100 hover:bg-[#2a2a2a]",
      error: "bg-[#2a1e1e] text-red-400 hover:bg-[#3a2a2a]",
    },
    card: {
      base: "bg-[#1c1c1c] text-gray-200 rounded-2xl p-4",
      shadow:
        "shadow-[inset_-6px_-6px_12px_rgba(255,255,255,0.04),_inset_6px_6px_12px_rgba(0,0,0,0.8)]",
    },
    input: {
      base: "bg-[#1e1e1e] text-gray-100 rounded-lg px-3 py-2",
      shadow:
        "shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.05),_inset_2px_2px_4px_rgba(0,0,0,0.6)]",
      focus: "focus:ring-2 focus:ring-cyan-500",
    },
  },
};

// Helper for buttons
export function getButtonClasses(
  theme: Theme = "neumorphic-dark",
  variant: "normal" | "error" = "normal",
) {
  const themeConfig = themes["neumorphic-dark"].button;
  return {
    base: `inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${themeConfig.border} ${themeConfig.radius}`,
    shadow: themeConfig.shadow,
    active: themeConfig.active,
    variant: variant === "error" ? themeConfig.error : themeConfig.normal,
  };
}

// Helper for cards / panels
export function getCardClasses() {
  const themeConfig = themes["neumorphic-dark"].card;
  return `${themeConfig.base} ${themeConfig.shadow}`;
}

// Helper for inputs
export function getInputClasses() {
  const themeConfig = themes["neumorphic-dark"].input;
  return `${themeConfig.base} ${themeConfig.shadow} ${themeConfig.focus}`;
}

// Helper for icons
export function getIconClasses() {
  return "w-5 h-5";
}
