import { z } from "zod";

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #0f6b4f");

export const themeSchema = z.object({
  colorPrimary: hex,
  colorSecondary: hex,
  colorAccent: hex,
  colorBackground: hex,
  colorSurface: hex,
  colorText: hex,
  colorMuted: hex,
  colorBorder: hex,
  radius: z.enum(["NONE", "SMALL", "MEDIUM", "LARGE"]),
  buttonStyle: z.enum(["SQUARE", "ROUNDED", "PILL"]),
});

export type ThemeValues = z.infer<typeof themeSchema>;

/** MPA brand palette derived from the school logo (teal ring, gold sun, cream field). Seed + fallback. */
export const DEFAULT_THEME: ThemeValues = {
  colorPrimary: "#125a68",
  colorSecondary: "#0b3d47",
  colorAccent: "#e9a23b",
  colorBackground: "#fbfaf3",
  colorSurface: "#ffffff",
  colorText: "#102326",
  colorMuted: "#55666a",
  colorBorder: "#dde5e3",
  radius: "SMALL",
  buttonStyle: "ROUNDED",
};

const RADIUS: Record<ThemeValues["radius"], string> = {
  NONE: "0px",
  SMALL: "4px",
  MEDIUM: "8px",
  LARGE: "14px",
};

const BUTTON_RADIUS: Record<ThemeValues["buttonStyle"], string> = {
  SQUARE: "0px",
  ROUNDED: "6px",
  PILL: "999px",
};

/**
 * Builds the :root declaration block. Every value has already passed the hex/enum
 * schema, so nothing an admin types can escape into arbitrary CSS.
 */
export function themeToCss(input: Partial<ThemeValues> | null | undefined): string {
  const parsed = themeSchema.safeParse({ ...DEFAULT_THEME, ...stripNulls(input) });
  const t = parsed.success ? parsed.data : DEFAULT_THEME;
  return `:root{--color-primary:${t.colorPrimary};--color-secondary:${t.colorSecondary};--color-accent:${t.colorAccent};--color-background:${t.colorBackground};--color-surface:${t.colorSurface};--color-text:${t.colorText};--color-muted:${t.colorMuted};--color-border:${t.colorBorder};--color-on-primary:${readableOn(t.colorPrimary)};--color-on-secondary:${readableOn(t.colorSecondary)};--color-on-accent:${readableOn(t.colorAccent)};--radius:${RADIUS[t.radius]};--radius-button:${BUTTON_RADIUS[t.buttonStyle]};}`;
}

function stripNulls<T extends object>(input: T | null | undefined): Partial<T> {
  if (!input) return {};
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v != null)) as Partial<T>;
}

// ─── Contrast helpers (WCAG 2.x relative luminance) ────────────────────────────

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks white or near-black text for a given background. */
export function readableOn(background: string): string {
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#111111") ? "#ffffff" : "#111111";
}

/** Pairs the admin theme editor warns about when they fall below WCAG AA (4.5:1). */
export function contrastWarnings(t: ThemeValues): string[] {
  const checks: [string, string, string][] = [
    ["Text on background", t.colorText, t.colorBackground],
    ["Text on surface", t.colorText, t.colorSurface],
    ["Muted text on background", t.colorMuted, t.colorBackground],
    ["Primary on background (links)", t.colorPrimary, t.colorBackground],
  ];
  return checks
    .filter(([, fg, bg]) => contrastRatio(fg, bg) < 4.5)
    .map(([label, fg, bg]) => `${label} has a contrast ratio of ${contrastRatio(fg, bg).toFixed(2)}:1 (aim for 4.5:1).`);
}
