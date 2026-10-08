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

  const days = useMemo(() => {
    const arr: Date[] = [];
    const t = new Date();
    for (let i = 0; i < 14; i++) arr.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
    return arr;
  }, []);

  useEffect(() => {
    supabase.from("barbers").select("id,name").eq("active", true).order("created_at").then(({ data }) => setBarbers(data ?? []));
    supabase.from("services").select("id,name,price,duration_min").eq("active", true).order("sort").then(({ data }) => setServices((data as Service[]) ?? []));
  }, []);

  const loadBooked = async () => {
    if (!barber || !date) return setBooked([]);
    const { data } = await supabase.rpc("get_booked_slots", { _barber: barber, _date: date });
    setBooked(((data as string[]) ?? []).map((t) => t.slice(0, 5)));
  };
  useEffect(() => { loadBooked(); setTime(""); }, [barber, date]);

  const now = new Date();
  const slots = date ? slotsFor(date).filter((s) => date !== toISODate(now) || s > `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!barber || !service || !date || !time) return setMsg({ ok: false, text: "Escolha barbeiro, serviço, dia e horário." });
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
        <Step n={1} t="Barbeiro" />
        <div className="grid grid-cols-2 gap-3">
          {barbers.map((b) => (
            <button type="button" key={b.id} onClick={() => setBarber(b.id)}
              className={`rounded-lg border p-4 text-left font-display text-2xl transition ${barber === b.id ? "border-primary bg-accent text-primary" : "border-border hover:border-primary/50"}`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Step n={2} t="Serviço" />
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
        <Step n={3} t="Dia" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const iso = toISODate(d);
            const closed = slotsFor(iso).length === 0;
            return (
              <button type="button" key={iso} disabled={closed} onClick={() => setDate(iso)}
                className={`min-w-16 shrink-0 rounded-lg border px-3 py-2 text-center transition disabled:opacity-30 ${date === iso ? "border-primary bg-gold text-primary-foreground" : "border-border hover:border-primary/50"}`}>
                <div className="text-xs uppercase">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
                <div className="font-display text-2xl">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Step n={4} t="Horário" />
        {!barber || !date ? (
          <p className="text-sm text-muted-foreground">Escolha o barbeiro e o dia para ver os horários livres.</p>
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
        <Step n={5} t="Seus dados" />
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
