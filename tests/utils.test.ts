import { describe, expect, it } from "vitest";
import { safeHref, telHref } from "@/lib/utils";

describe("safeHref", () => {
  it("allows site paths, anchors, http(s), mailto and tel", () => {
    for (const ok of ["/about", "#main", "https://example.com", "mailto:a@b.co", "tel:+251971190140"]) {
      expect(safeHref(ok)).toBe(ok);
    }
  });

  it("blocks script and protocol-relative URLs", () => {
    for (const bad of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "//evil.example"]) {
      expect(safeHref(bad)).toBeNull();
    }
  });
});

describe("telHref", () => {
  it("strips formatting", () => {
    expect(telHref("+251 971 190 140")).toBe("tel:+251971190140");
  });
});
