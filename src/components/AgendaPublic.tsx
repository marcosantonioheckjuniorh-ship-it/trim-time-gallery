import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slotsFor, toISODate } from "@/lib/schedule";

export function AgendaPublic() {
  const [barber, setBarber] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [booked, setBooked] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 20000); return () => clearInterval(id); }, []);

  useEffect(() => {
    supabase.from("barbers").select("id").eq("active", true).order("created_at").limit(1).then(({ data }) => {
      const first = data?.[0];
      if (first) setBarber(first.id);
    });
  }, []);

  useEffect(() => {
    if (!barber || !date) return;
    supabase.rpc("get_booked_slots", { _barber: barber, _date: date }).then(({ data }) => {
      setBooked(((data as string[]) ?? []).map((t) => t.slice(0, 5)));
    });
  }, [barber, date, tick]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const slots = slotsFor(date).filter((s) => date !== toISODate(now) || s > nowHM);

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {days.map((d) => {
          const iso = toISODate(d);
          const closed = slotsFor(iso).length === 0;
          return (
            <button key={iso} type="button" disabled={closed} onClick={() => setDate(iso)}
              className={`rounded-lg border px-4 py-2 text-center transition disabled:opacity-25 ${date === iso ? "border-primary bg-gold text-primary-foreground" : "border-border hover:border-primary/50"}`}>
              <span className="block text-[10px] font-semibold uppercase tracking-widest">
                {d.toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
              <span className="font-display text-xl">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem atendimento nesse dia.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {slots.map((s) => {
            const taken = booked.includes(s);
            return (
              <div key={s}
                className={`rounded-md border py-2 text-center text-sm font-semibold ${taken ? "border-destructive/60 bg-destructive/15 text-destructive" : "border-success/60 bg-success/15 text-success"}`}>
                {s}
                <span className="block text-[10px] uppercase tracking-widest">{taken ? "Ocupado" : "Livre"}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Atualizado automaticamente. Verde = livre · Vermelho = agendado.</p>
    </div>
  );
}
