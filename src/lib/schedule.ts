// Opening hours. 0 = Sunday. Times "HH:MM". null = closed.
export type WeekHours = Record<number, [string, string] | null>;
export type SpecialDay = { open: string | null; close: string | null; reason: string };
export type ScheduleConfig = { hours: WeekHours; special: Record<string, SpecialDay> };

// Fallback used only until the owner's saved hours load from the database.
export const DEFAULT_HOURS: WeekHours = {
  0: null,
  1: ["13:30", "20:00"],
  2: ["09:00", "20:00"],
  3: ["09:00", "20:00"],
  4: ["09:00", "20:00"],
  5: ["09:00", "20:00"],
  6: ["08:00", "15:00"],
};
export const DEFAULT_SCHEDULE: ScheduleConfig = { hours: DEFAULT_HOURS, special: {} };

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Returns opening window for a date, honoring holidays / special days first. */
export function dayWindow(dateStr: string, cfg: ScheduleConfig = DEFAULT_SCHEDULE): { open: string; close: string } | null {
  const sp = cfg.special[dateStr];
  if (sp) return sp.open && sp.close ? { open: sp.open, close: sp.close } : null;
  const d = new Date(dateStr + "T12:00:00");
  const h = cfg.hours[d.getDay()];
  return h ? { open: h[0], close: h[1] } : null;
}

export function slotsFor(dateStr: string, cfg: ScheduleConfig = DEFAULT_SCHEDULE): string[] {
  const w = dayWindow(dateStr, cfg);
  if (!w) return [];
  const out: string[] = [];
  for (let m = toMin(w.open); m < toMin(w.close); m += 30) out.push(fmt(m));
  return out;
}

const pretty = (t: string) => { const [h, m] = t.split(":"); return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`; };

export function hoursLabel(hours: WeekHours): string[] {
  const order: number[] = [1, 2, 3, 4, 5, 6, 0];
  const at = (k: number) => order[k] as number;
  const lines: string[] = [];
  let i = 0;
  while (i < order.length) {
    const h = hours[at(i)];
    let j = i;
    while (j + 1 < order.length && JSON.stringify(hours[at(j + 1)]) === JSON.stringify(h)) j++;
    const name = i === j ? WEEKDAYS[at(i)] : `${WEEKDAYS[at(i)].slice(0, 3)} a ${WEEKDAYS[at(j)].slice(0, 3)}`;
    lines.push(`${name} · ${h ? `${pretty(h[0])} às ${pretty(h[1])}` : "Fechado"}`);
    i = j + 1;
  }
  return lines;
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const WHATSAPP = "554791412316";
export const ADDRESS = "Rua São Pedro, 833 – Sala 4";
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
