export interface SchoolColors {
  primary: string;      // Slate/Navy e.g. "#0f172a"
  primaryLight: string; // Slate light e.g. "#1e293b"
  secondary: string;    // Accent gold/amber e.g. "#d97706"
  accent: string;       // Secondary highlight blue/indigo e.g. "#2563eb"
  accentLight: string;  // Light blue e.g. "#3b82f6"
  success: string;      // Success color e.g. "#16a34a"
  warning: string;      // Warning color e.g. "#ca8a04"
  danger: string;       // Danger color e.g. "#dc2626"
}

export interface SchoolConfig {
  schoolName: string;
  schoolMotto: string;
  schoolAddress1: string;
  schoolAddress2: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  logoUrl?: string;
  schoolColors: SchoolColors;
}

export const schoolConfig: SchoolConfig = {
  schoolName: "SUCCESS GATE GROUP OF SCHOOLS",
  schoolMotto: "Excellence in Character and Learning",
  schoolAddress1: "Primary School Address: Road 1, House 13, Olowu Estate, Akobo, Ibadan, Oyo State, Nigeria.",
  schoolAddress2: "College School Address: Highland Estate, Festac/Feesi Area, Ibadan, Oyo State, Nigeria",
  schoolPhone: "+234 805 526 5122, +234 813 833 7994, +234 805 915 6235, +234 903 466 6833",
  schoolEmail: "successgates001@gmail.com",
  schoolLogo: `<img src="/images/logo.png" alt="Success Gate College" class="w-full h-full object-contain" />`,
  logoUrl: "/images/logo.png",
  schoolColors: {
    primary: "#0f172a",      // Deep slate dark blue
    primaryLight: "#1e293b", // Slate secondary dark
    secondary: "#d97706",    // Gold/Amber accent
    accent: "#2563eb",       // Royal blue accent
    accentLight: "#3b82f6",  // Blue accent
    success: "#16a34a",      // Green
    warning: "#ca8a04",      // Amber
    danger: "#dc2626",       // Red
  }
};
