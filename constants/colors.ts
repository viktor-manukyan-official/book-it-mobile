export const Colors = {
  primary: "#FF6B6B",
  // Coral -> peach signature gradient (design brief §2). Use sparingly on
  // primary CTAs and success heroes so every screen reads as one product.
  gradientStart: "#FF6B6B",
  gradientEnd: "#FFA07A",
  background: "#F5F5F7",
  // Warm off-white canvas used on welcome / auth heroes.
  canvasWarm: "#FFF8F5",
  card: "#FFFFFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  star: "#F59E0B",
  success: "#22C55E",
  error: "#EF4444",
  white: "#FFFFFF",
};

// The signature gradient as an ordered stop list for expo-linear-gradient.
export const PrimaryGradient = [Colors.gradientStart, Colors.gradientEnd] as const;

// Armenian flag stripes for the +374 country pill (top -> bottom).
export const ArmeniaFlag = ["#D90012", "#0033A0", "#F2A800"] as const;
