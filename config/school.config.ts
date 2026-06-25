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
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  schoolColors: SchoolColors;
}

export const schoolConfig: SchoolConfig = {
  schoolName: "SUCCESS GATE GROUP OF SCHOOLS",
  schoolMotto: "Excellence in Character and Learning",
  schoolAddress: "Location 1: Road 1, House 13, Olowu Estate, Akobo, Ibadan, Oyo State, Nigeria. | Location 2: Highland Estate, Festac/Feesi Area, Ibadan, Oyo State, Nigeria",
  schoolPhone: "+234 805 526 5122, +234 813 833 7994, +234 805 915 6235, +234 903 466 6833",
  schoolEmail: "successgates001@gmail.com",
  schoolLogo: "SGGS<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230f172a'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23d97706' stroke-width='6'/><path d='M35 50 L45 60 L65 40' fill='none' stroke='%23d97706' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/></svg>",
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
