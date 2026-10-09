import { WHATSAPP } from "@/lib/schedule";

export const INSTAGRAM = "https://www.instagram.com/barbearia.staudt/";

export function whatsappUrl(message: string, phone = WHATSAPP) {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${phone.replace(/\D/g, "")}?${params.toString()}`;
}

// Reserve the tab during the click, before saving the appointment asynchronously.
export function reserveWhatsAppTab(): Window | null {
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  return tab;
}