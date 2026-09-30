import { describe, expect, it } from "vitest";
import { contrastRatio, DEFAULT_THEME, themeSchema, themeToCss } from "@/lib/theme";

describe("theme", () => {
  it("accepts the default MPA theme", () => {
    expect(themeSchema.safeParse(DEFAULT_THEME).success).toBe(true);
  });

  it("rejects anything that is not a 6-digit hex colour", () => {
    for (const bad of ["red", "#fff", "#0f6b4f;}body{display:none", "url(javascript:x)"]) {
      expect(themeSchema.safeParse({ ...DEFAULT_THEME, colorPrimary: bad }).success).toBe(false);
    }
  });

  it("falls back to defaults instead of emitting injected CSS", () => {
    const css = themeToCss({ colorPrimary: "#000;}</style><script>alert(1)</script>" });
    expect(css).not.toContain("<");
    expect(css).toContain(`--color-primary:${DEFAULT_THEME.colorPrimary}`);
  });

  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio(DEFAULT_THEME.colorText, DEFAULT_THEME.colorBackground)).toBeGreaterThan(4.5);
  });
});
