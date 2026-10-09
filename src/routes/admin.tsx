import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { brl, toISODate, WEEKDAYS } from "@/lib/schedule";
import { LogOut, Scissors, Calendar, Tag, Users, MessageCircle, Image as ImageIcon, Clock, CalendarOff } from "lucide-react";
import { loadSitePhotos, type SitePhoto } from "@/lib/photos";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do Dono — Barbearia Staudt" },
      { name: "description", content: "Painel administrativo da Barbearia Staudt." },
      { property: "og:title", content: "Painel do Dono — Barbearia Staudt" },
      { property: "og:description", content: "Gerencie agendamentos, serviços e barbeiros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return null;
  if (!session) return <Login />;
  if (isAdmin === null) return null;
  if (!isAdmin) return (
    <Center>
      <p>Esta conta não tem acesso ao painel.</p>
      <button className="btn-outline mt-4" onClick={() => supabase.auth.signOut()}>Sair</button>
    </Center>
  );
  return <Panel email={session.user.email ?? ""} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-sm text-center">{children}</div></div>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) setMsg(error.message);
    else setSent(true);
  };
  return (
    <Center>
      <Scissors className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-3 text-5xl">Área do dono</h1>
      {sent ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Link enviado para <span className="text-foreground">{email}</span>. Abra seu e-mail e clique no link para entrar — sem senha.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <input className="field" type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <button className="btn-gold w-full">Enviar link de acesso</button>
          <p className="text-center text-xs text-muted-foreground">Você recebe um link no e-mail e entra sem senha.</p>
        </form>
      )}
      <p className="mt-6"><Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar ao site</Link></p>
    </Center>
  );
}

type Appt = { id: string; client_name: string; client_phone: string; appt_date: string; appt_time: string; status: string; barber_id: string; service_id: string | null };
type Barber = { id: string; name: string; active: boolean };
type Service = { id: string; name: string; price: number; duration_min: number; active: boolean; sort: number };

function Panel({ email }: { email: string }) {
  const [tab, setTab] = useState<"agenda" | "horarios" | "folgas" | "servicos" | "fotos" | "barbeiros">("agenda");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const loadBase = async () => {
    const [b, s] = await Promise.all([
      supabase.from("barbers").select("*").order("created_at"),
      supabase.from("services").select("*").order("sort"),
    ]);
    setBarbers((b.data as Barber[]) ?? []); setServices((s.data as Service[]) ?? []);
  };
  useEffect(() => { loadBase(); }, []);

  const tabs = [
    { k: "agenda", l: "Agenda", i: Calendar },
    { k: "horarios", l: "Horários", i: Clock },
    { k: "folgas", l: "Feriados e folgas", i: CalendarOff },
    { k: "servicos", l: "Preços", i: Tag },
    { k: "fotos", l: "Fotos", i: ImageIcon },
    { k: "barbeiros", l: "Barbeiros", i: Users },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-display text-2xl"><Scissors className="h-5 w-5 text-primary" /> Painel Staudt</div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{email}</span>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 hover:text-primary"><LogOut className="h-4 w-4" /> Sair</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">
          {tabs.map(({ k, l, i: Icon }) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wider ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <Icon className="h-4 w-4" />{l}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "agenda" && <Agenda barbers={barbers} services={services} />}
        {tab === "horarios" && <WeekHoursEditor />}
        {tab === "folgas" && <SpecialDays />}
        {tab === "servicos" && <Services services={services} reload={loadBase} />}
        {tab === "fotos" && <Photos />}
        {tab === "barbeiros" && <Barbers barbers={barbers} reload={loadBase} />}
      </main>
    </div>
  );
}

function Agenda({ barbers, services }: { barbers: Barber[]; services: Service[] }) {
  const [date, setDate] = useState(toISODate(new Date()));
  const [barber, setBarber] = useState("all");
  const [appts, setAppts] = useState<Appt[]>([]);
  const load = async () => {
    let q = supabase.from("appointments").select("*").eq("appt_date", date).order("appt_time");
    if (barber !== "all") q = q.eq("barber_id", barber);
    const { data } = await q; setAppts((data as Appt[]) ?? []);
  };
  useEffect(() => { load(); }, [date, barber]);
  useEffect(() => {
    const ch = supabase.channel("appts").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [date, barber]);

  const setStatus = async (id: string, status: string) => { await supabase.from("appointments").update({ status }).eq("id", id); load(); };
  const del = async (id: string) => { if (confirm("Excluir este agendamento?")) { await supabase.from("appointments").delete().eq("id", id); load(); } };

  const active = appts.filter((a) => a.status !== "cancelado");
  const revenue = appts.filter((a) => a.status === "concluido").reduce((s, a) => s + Number(services.find((x) => x.id === a.service_id)?.price ?? 0), 0);
  const expected = active.reduce((s, a) => s + Number(services.find((x) => x.id === a.service_id)?.price ?? 0), 0);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input type="date" className="field !w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="field !w-auto" value={barber} onChange={(e) => setBarber(e.target.value)}>
          <option value="all">Todos os barbeiros</option>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[["Agendamentos", String(active.length)], ["Previsto", brl(expected)], ["Recebido", brl(revenue)]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl text-primary">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {appts.length === 0 && <p className="text-muted-foreground">Nenhum agendamento neste dia.</p>}
        {appts.map((a) => {
          const s = services.find((x) => x.id === a.service_id);
          const b = barbers.find((x) => x.id === a.barber_id);
          const phone = a.client_phone.replace(/\D/g, "");
          return (
            <div key={a.id} className={`flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 ${a.status === "cancelado" ? "opacity-50" : ""}`}>
              <div className="font-display text-4xl text-primary">{a.appt_time.slice(0, 5)}</div>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{a.client_name}</p>
                <p className="text-sm text-muted-foreground">{s?.name ?? "—"} · {b?.name} · {s ? brl(Number(s.price)) : ""}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${a.status === "concluido" ? "bg-success text-primary-foreground" : a.status === "cancelado" ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}`}>{a.status}</span>
              <div className="flex flex-wrap gap-2 text-sm">
                <a href={`https://wa.me/${phone.length <= 11 ? "55" + phone : phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 hover:border-primary"><MessageCircle className="h-4 w-4" /> Chamar</a>
                {a.status !== "concluido" && <button onClick={() => setStatus(a.id, "concluido")} className="rounded-md border border-border px-3 py-1.5 hover:border-success">Concluir</button>}
                {a.status !== "cancelado" && <button onClick={() => setStatus(a.id, "cancelado")} className="rounded-md border border-border px-3 py-1.5 hover:border-destructive">Cancelar</button>}
                <button onClick={() => del(a.id)} className="rounded-md px-3 py-1.5 text-destructive">Excluir</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Services({ services, reload }: { services: Service[]; reload: () => void }) {
  const save = async (s: Service) => {
    await supabase.from("services").update({ name: s.name, price: s.price, duration_min: s.duration_min, active: s.active }).eq("id", s.id); reload();
  };
  const add = async () => { await supabase.from("services").insert({ name: "Novo serviço", price: 0, sort: services.length + 1 }); reload(); };
  const del = async (id: string) => { if (confirm("Excluir serviço?")) { await supabase.from("services").delete().eq("id", id); reload(); } };
  return (
    <div className="space-y-3">
      {services.map((s) => <ServiceRow key={s.id} s={s} onSave={save} onDel={del} />)}
      <button onClick={add} className="btn-outline">+ Adicionar serviço</button>
    </div>
  );
}

function ServiceRow({ s, onSave, onDel }: { s: Service; onSave: (s: Service) => void; onDel: (id: string) => void }) {
  const [v, setV] = useState(s);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <input className="field min-w-40 flex-1" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">R$ <input type="number" className="field !w-24" value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Ativo</label>
      <button onClick={() => onSave(v)} className="btn-gold !px-4 !py-2 text-xs">Salvar</button>
      <button onClick={() => onDel(s.id)} className="text-sm text-destructive">Excluir</button>
    </div>
  );
}

function Barbers({ barbers, reload }: { barbers: Barber[]; reload: () => void }) {
  const add = async () => { await supabase.from("barbers").insert({ name: "Novo barbeiro" }); reload(); };
  return (
    <div className="space-y-3">
      {barbers.map((b) => <BarberRow key={b.id} b={b} reload={reload} />)}
      <button onClick={add} className="btn-outline">+ Adicionar barbeiro</button>
    </div>
  );
}

function BarberRow({ b, reload }: { b: Barber; reload: () => void }) {
  const [v, setV] = useState(b);
  const save = async () => { await supabase.from("barbers").update({ name: v.name, active: v.active }).eq("id", b.id); reload(); };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <input className="field min-w-40 flex-1" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Atendendo</label>
      <button onClick={save} className="btn-gold !px-4 !py-2 text-xs">Salvar</button>
    </div>
  );
}

function Photos() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [busy, setBusy] = useState("");
  const load = () => loadSitePhotos().then(setPhotos);
  useEffect(() => { load(); }, []);
  const upload = async (files: FileList | null, kind: string) => {
    if (!files?.length) return;
    setBusy("Enviando...");
    for (const f of Array.from(files)) {
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2)}.${f.name.split(".").pop() || "jpg"}`;
      const { error } = await supabase.storage.from("photos").upload(path, f, { contentType: f.type });
      if (error) { setBusy("Erro ao enviar: " + error.message); return; }
      if (kind === "hero") {
        const old = photos.filter((p) => p.kind === "hero");
        if (old.length) { await supabase.storage.from("photos").remove(old.map((p) => p.path)); await supabase.from("site_photos").delete().in("id", old.map((p) => p.id)); }
      }
      await supabase.from("site_photos").insert({ path, kind });
    }
    setBusy(""); load();
  };
  const del = async (p: SitePhoto) => {
    if (!confirm("Excluir esta foto?")) return;
    await supabase.storage.from("photos").remove([p.path]);
    await supabase.from("site_photos").delete().eq("id", p.id); load();
  };
  const hero = photos.find((p) => p.kind === "hero");
  const gallery = photos.filter((p) => p.kind === "gallery");
  return (
    <div className="space-y-10">
      {busy && <p className="text-primary">{busy}</p>}
      <section>
        <h2 className="text-4xl">Foto principal (topo do site)</h2>
        <p className="text-sm text-muted-foreground">Substitui a foto grande do início. Excluindo, volta a foto original.</p>
        {hero && <div className="relative mt-4 max-w-md"><img src={hero.url} alt="" className="aspect-video w-full rounded-lg object-cover" /><button onClick={() => del(hero)} className="absolute right-2 top-2 rounded-md bg-destructive px-3 py-1 text-xs text-destructive-foreground">Excluir</button></div>}
        <label className="btn-gold mt-4 inline-flex cursor-pointer">Trocar foto principal<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files, "hero")} /></label>
      </section>
      <section>
        <h2 className="text-4xl">Galeria</h2>
        <p className="text-sm text-muted-foreground">Fotos novas aparecem primeiro na galeria do site.</p>
        <label className="btn-gold mt-4 inline-flex cursor-pointer">+ Adicionar fotos<input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files, "gallery")} /></label>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery.map((p) => (
            <div key={p.id} className="relative"><img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <button onClick={() => del(p)} className="absolute right-2 top-2 rounded-md bg-destructive px-3 py-1 text-xs text-destructive-foreground">Excluir</button></div>
          ))}
          {!gallery.length && <p className="col-span-full text-muted-foreground">Nenhuma foto enviada ainda.</p>}
        </div>
      </section>
    </div>
  );
}

function Notice({ msg }: { msg: { ok: boolean; t: string } | null }) {
  if (!msg) return null;
  return <p className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-success text-success" : "border-destructive text-destructive"}`}>{msg.t}</p>;
}

type HourRow = { weekday: number; open: string; close: string; closed: boolean };

function WeekHoursEditor() {
  const [rows, setRows] = useState<HourRow[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase.from("business_hours").select("*").then(({ data }) => {
      const byDay = new Map((data ?? []).map((r) => [r.weekday, r]));
      setRows([1, 2, 3, 4, 5, 6, 0].map((d) => {
        const r = byDay.get(d);
        return { weekday: d, open: r?.open_time?.slice(0, 5) ?? "09:00", close: r?.close_time?.slice(0, 5) ?? "20:00", closed: !r?.open_time || !r?.close_time };
      }));
    });
  }, []);
  const upd = (d: number, p: Partial<HourRow>) => setRows((rs) => rs.map((r) => (r.weekday === d ? { ...r, ...p } : r)));
  const save = async () => {
    setMsg(null);
    const bad = rows.find((r) => !r.closed && r.open >= r.close);
    if (bad) return setMsg({ ok: false, t: `${WEEKDAYS[bad.weekday]}: o horário de fechar precisa ser depois do de abrir.` });
    setSaving(true);
    const { error } = await supabase.from("business_hours").upsert(rows.map((r) => ({ weekday: r.weekday, open_time: r.closed ? null : r.open, close_time: r.closed ? null : r.close })));
    setSaving(false);
    setMsg(error ? { ok: false, t: "Não foi possível salvar: " + error.message } : { ok: true, t: "Horários salvos! O site já mostra os novos horários." });
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-4xl">Horário de funcionamento</h2>
        <p className="text-sm text-muted-foreground">Vale para todas as semanas. Para um dia específico (feriado, folga), use a aba "Feriados e folgas".</p>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="w-28 font-semibold">{WEEKDAYS[r.weekday]}</span>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!r.closed} onChange={(e) => upd(r.weekday, { closed: !e.target.checked })} /> Abre</label>
            {r.closed ? <span className="text-sm text-destructive">Fechado</span> : (
              <>
                <label className="flex items-center gap-2 text-sm">das <input type="time" step={1800} className="field !w-32" value={r.open} onChange={(e) => upd(r.weekday, { open: e.target.value })} /></label>
                <label className="flex items-center gap-2 text-sm">até <input type="time" step={1800} className="field !w-32" value={r.close} onChange={(e) => upd(r.weekday, { close: e.target.value })} /></label>
              </>
            )}
          </div>
        ))}
      </div>
      <Notice msg={msg} />
      <button onClick={save} disabled={saving || !rows.length} className="btn-gold">{saving ? "Salvando..." : "Salvar horários"}</button>
    </div>
  );
}

type Special = { day: string; open_time: string | null; close_time: string | null; reason: string };

function SpecialDays() {
  const [list, setList] = useState<Special[]>([]);
  const [day, setDay] = useState("");
  const [closed, setClosed] = useState(true);
  const [open, setOpen] = useState("09:00");
  const [close, setClose] = useState("12:00");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const today = toISODate(new Date());
  const load = () => supabase.from("special_days").select("*").gte("day", today).order("day").then(({ data }) => setList((data as Special[]) ?? []));
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!day) return setMsg({ ok: false, t: "Escolha a data." });
    if (day < today) return setMsg({ ok: false, t: "Escolha uma data de hoje em diante." });
    if (!closed && open >= close) return setMsg({ ok: false, t: "O horário de fechar precisa ser depois do de abrir." });
    const { error } = await supabase.from("special_days").upsert({ day, open_time: closed ? null : open, close_time: closed ? null : close, reason: reason.trim() || (closed ? "Fechado" : "Horário especial") });
    if (error) return setMsg({ ok: false, t: "Não foi possível salvar: " + error.message });
    const { count } = await supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appt_date", day).neq("status", "cancelado");
    setMsg({ ok: true, t: `Salvo! ${count ? `Atenção: já existem ${count} agendamento(s) nesse dia — veja na aba Agenda e avise os clientes.` : "Os clientes já não conseguem agendar fora desse horário."}` });
    setDay(""); setReason(""); load();
  };
  const del = async (d: string) => { if (confirm("Voltar ao horário normal nesse dia?")) { await supabase.from("special_days").delete().eq("day", d); load(); } };
  const fmtDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl">Feriados, folgas e horários especiais</h2>
        <p className="text-sm text-muted-foreground">Feche um dia (feriado, folga, viagem) ou mude o horário só daquele dia. No site, o dia fica bloqueado para agendamento.</p>
      </div>
      <form onSubmit={add} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">Data <input type="date" min={today} className="field !w-auto" value={day} onChange={(e) => setDay(e.target.value)} required /></label>
          <input className="field min-w-48 flex-1" placeholder="Motivo (ex.: Feriado de Natal)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={60} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" checked={closed} onChange={() => setClosed(true)} /> Fechado o dia todo</label>
          <label className="flex items-center gap-2"><input type="radio" checked={!closed} onChange={() => setClosed(false)} /> Horário diferente</label>
          {!closed && (
            <>
              <label className="flex items-center gap-2">das <input type="time" step={1800} className="field !w-32" value={open} onChange={(e) => setOpen(e.target.value)} /></label>
              <label className="flex items-center gap-2">até <input type="time" step={1800} className="field !w-32" value={close} onChange={(e) => setClose(e.target.value)} /></label>
            </>
          )}
        </div>
        <Notice msg={msg} />
        <button className="btn-gold">Salvar dia</button>
      </form>
      <div className="space-y-2">
        <h3 className="text-2xl">Próximos dias marcados</h3>
        {!list.length && <p className="text-muted-foreground">Nenhum feriado ou folga marcado.</p>}
        {list.map((s) => (
          <div key={s.day} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="min-w-56 flex-1 font-semibold capitalize">{fmtDay(s.day)}</span>
            <span className="text-sm text-muted-foreground">{s.reason}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${s.open_time ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"}`}>
              {s.open_time && s.close_time ? `${s.open_time.slice(0, 5)} às ${s.close_time.slice(0, 5)}` : "Fechado"}
            </span>
            <button onClick={() => del(s.day)} className="text-sm text-destructive">Remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}
