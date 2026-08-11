export interface BrandDefaults {
  tone: string;
  objective: string;
  audience: string;
}

const STORAGE_KEY = "brand_defaults";

export const DEFAULT_BRAND_DEFAULTS: BrandDefaults = {
  tone: "Professional & Authoritative",
  objective: "Engagement & Comments",
  audience: "SaaS Founders, Tech Leaders, Product Managers",
};

export function getBrandDefaults(): BrandDefaults {
  if (typeof window === "undefined") return DEFAULT_BRAND_DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRAND_DEFAULTS;
    return { ...DEFAULT_BRAND_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRAND_DEFAULTS;
  }
}

export function setBrandDefaults(
  defaults: BrandDefaults
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}