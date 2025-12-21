import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format value as percentage with +/- indicator
 */
export function formatPercentage(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Calculate percentage difference from base (100)
 */
export function calculatePercentageDiff(index: number): number {
  return index - 100;
}

/**
 * Get Tailwind color class based on COL index
 * Green for below average, yellow for average, red for above
 */
export function getColorForCOL(col: number): string {
  if (col < 95) return "text-green-500";
  if (col < 105) return "text-yellow-500";
  if (col < 110) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get background color class based on COL index
 */
export function getBgColorForCOL(col: number): string {
  if (col < 95) return "bg-green-500/10";
  if (col < 105) return "bg-yellow-500/10";
  if (col < 110) return "bg-orange-500/10";
  return "bg-red-500/10";
}

/**
 * Get map fill color based on COL index for gradient visualization
 */
export function getMapColorForCOL(col: number): string {
  // Green to Red gradient based on COL index
  // 85 (green) -> 100 (yellow) -> 115+ (red)
  if (col < 90) return "#22c55e"; // green-500
  if (col < 95) return "#84cc16"; // lime-500
  if (col < 100) return "#eab308"; // yellow-500
  if (col < 105) return "#f59e0b"; // amber-500
  if (col < 110) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

/**
 * Calculate housing affordability based on 30% rule
 * Returns true if rent is <= 30% of monthly income
 */
export function calculateAffordability(rent: number, monthlyIncome: number): boolean {
  return rent <= monthlyIncome * 0.3;
}

/**
 * Get affordability percentage (rent as % of income)
 */
export function getAffordabilityPercentage(rent: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 100;
  return (rent / monthlyIncome) * 100;
}

/**
 * Normalize location data to consistent format
 */
export function normalizeLocationData(location: string): string {
  return location.trim().toLowerCase();
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get state name from state code
 */
export function getStateName(code: string): string {
  const stateNames: Record<string, string> = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
  };

  return stateNames[code.toUpperCase()] || code;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}
