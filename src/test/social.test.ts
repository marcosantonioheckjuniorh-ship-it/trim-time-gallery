import { describe, expect, it, vi } from "vitest";
import { reserveWhatsAppTab, whatsappUrl } from "../lib/social";

describe("WhatsApp handoff", () => {
  it("preserves appointment details and the destination number", () => {
    const message = "Olá! Agendei Corte degradê no dia 09/10/2026 às 10:00. Nome: João";
    const url = new URL(whatsappUrl(message));
    expect(url.origin).toBe("https://api.whatsapp.com");
    expect(url.searchParams.get("phone")).toBe("554791412316");
    expect(url.searchParams.get("text")).toBe(message);
  });

  it("reserves a tab synchronously and disconnects its opener", () => {
    const tab = { opener: {} };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    expect(reserveWhatsAppTab()).toBe(tab);
    expect(open).toHaveBeenCalledWith("about:blank", "_blank");
    expect(tab.opener).toBeNull();
    open.mockRestore();
  });

  it("returns null when the browser blocks the tab", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    expect(reserveWhatsAppTab()).toBeNull();
    open.mockRestore();
  });
});