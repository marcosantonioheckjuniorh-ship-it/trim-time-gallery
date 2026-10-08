// Business hours (placeholder until owner confirms). 0 = Sunday.
export const HOURS: Record<number, [number, number] | null> = {
  0: null,
  1: [9, 19],
  2: [9, 19],
  3: [9, 19],
  4: [9, 19],
  5: [9, 19],
  6: [8, 17],
};

export const HOURS_LABEL = ["Seg a Sex · 9h às 19h", "Sábado · 8h às 17h", "Domingo · Fechado"];

export function slotsFor(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const h = HOURS[d.getDay()];
  if (!h) return [];
  const out: string[] = [];
  for (let m = h[0] * 60; m < h[1] * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const WHATSAPP = "5547991412316";
export const ADDRESS = "Rua São Pedro, 833 – Sala 4";
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
