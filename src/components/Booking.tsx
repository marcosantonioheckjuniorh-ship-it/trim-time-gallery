import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slotsFor, toISODate, brl, WHATSAPP } from "@/lib/schedule";

type Barber = { id: string; name: string };
type Service = { id: string; name: string; price: number; duration_min: number };

export function Booking() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barber, setBarber] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [booked, setBooked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [monthOffset, setMonthOffset] = useState(0);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 20000); return () => clearInterval(id); }, []);
  const todayISO = toISODate(new Date());
  const monthStart = useMemo(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth() + monthOffset, 1); }, [monthOffset, todayISO]);
  const calendar = useMemo(() => {
    const arr: (Date | null)[] = Array(monthStart.getDay()).fill(null);
    const last = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i++) arr.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), i));
    return arr;
  }, [monthStart]);

  useEffect(() => {
    supabase.from("barbers").select("id,name").eq("active", true).order("created_at").then(({ data }) => {
      setBarbers(data ?? []);
      const first = data?.[0];
      if (first) setBarber(first.id);
    });
    supabase.from("services").select("id,name,price,duration_min").eq("active", true).order("sort").then(({ data }) => setServices((data as Service[]) ?? []));
  }, []);

  const loadBooked = async () => {
    if (!barber || !date) return setBooked([]);
    const { data } = await supabase.rpc("get_booked_slots", { _barber: barber, _date: date });
    setBooked(((data as string[]) ?? []).map((t) => t.slice(0, 5)));
  };
  useEffect(() => { loadBooked(); setTime(""); }, [barber, date]);
  useEffect(() => { if (tick) loadBooked(); }, [tick]);
  useEffect(() => { if (time && booked.includes(time)) setTime(""); }, [booked]);

  const now = new Date();
  const slots = date ? slotsFor(date).filter((s) => date !== toISODate(now) || s > `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!barber || !service || !date || !time) return setMsg({ ok: false, text: "Escolha serviço, dia e horário." });
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 10) return setMsg({ ok: false, text: "Informe seu nome e WhatsApp com DDD." });
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      client_name: name.trim(), client_phone: phone.trim(), barber_id: barber, service_id: service, appt_date: date, appt_time: time,
    });
    setLoading(false);
    if (error) {
      setMsg({ ok: false, text: error.code === "23505" ? "Esse horário acabou de ser reservado. Escolha outro." : "Não foi possível agendar. Tente novamente." });
      loadBooked();
      return;
    }
    const b = barbers.find((x) => x.id === barber)?.name;
    const s = services.find((x) => x.id === service)?.name;
    const [y, m, d] = date.split("-");
    const text = encodeURIComponent(`Olá! Agendei ${s} com ${b} no dia ${d}/${m}/${y} às ${time}. Nome: ${name}`);
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
    setMsg({ ok: true, text: `Agendado! ${s} com ${b} em ${d}/${m} às ${time}.|https://wa.me/${WHATSAPP}?text=${text}` });
    setTime(""); loadBooked();
  };

  const Step = ({ n, t }: { n: number; t: string }) => (
    <p className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-primary-foreground">{n}</span>{t}
    </p>
  );

  return (
    <form onSubmit={submit} className="space-y-8 rounded-xl border border-border bg-card p-5 md:p-8">
      <div>
        <Step n={1} t="Serviço" />
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <button type="button" key={s.id} onClick={() => setService(s.id)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${service === s.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}>
              <span className="font-semibold">{s.name}</span>
              <span className="text-primary">{brl(Number(s.price))}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Step n={2} t="Dia" />
        <div className="rounded-lg border border-border p-3">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" disabled={monthOffset === 0} onClick={() => setMonthOffset((m) => m - 1)} className="rounded-md border border-border px-3 py-1 text-lg disabled:opacity-30">‹</button>
            <span className="font-display text-2xl capitalize">{monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
            <button type="button" disabled={monthOffset >= 2} onClick={() => setMonthOffset((m) => m + 1)} className="rounded-md border border-border px-3 py-1 text-lg disabled:opacity-30">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => <div key={i} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendar.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISODate(d);
              const closed = slotsFor(iso).length === 0 || iso < todayISO;
              return (
                <button type="button" key={iso} disabled={closed} onClick={() => setDate(iso)}
                  className={`aspect-square rounded-md border font-display text-xl transition disabled:border-transparent disabled:opacity-25 ${date === iso ? "border-primary bg-gold text-primary-foreground" : iso === todayISO ? "border-primary/60" : "border-border hover:border-primary/50"}`}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <Step n={3} t="Horário" />
        {date && <p className="mb-2 text-xs text-muted-foreground">Horários atualizados automaticamente em tempo real.</p>}
        {!date ? (
          <p className="text-sm text-muted-foreground">Escolha o dia para ver os horários livres.</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem horários disponíveis nesse dia.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => {
              const taken = booked.includes(s);
              return (
                <button type="button" key={s} disabled={taken} onClick={() => setTime(s)}
                  className={`rounded-md border py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-30 ${time === s ? "border-primary bg-gold text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <Step n={4} t="Seus dados" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="field" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input className="field" placeholder="WhatsApp com DDD" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} inputMode="tel" />
        </div>
      </div>
      {msg && (
        <div className={`rounded-lg border p-4 ${msg.ok ? "border-success text-success" : "border-destructive text-destructive"}`}>
          {msg.text.split("|")[0]}
          {msg.ok && <a href={msg.text.split("|")[1]} target="_blank" rel="noreferrer" className="ml-2 underline">Confirmar no WhatsApp</a>}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-gold w-full">{loading ? "Agendando..." : "Confirmar agendamento"}</button>
    </form>
  );
}
