import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { brl, toISODate } from "@/lib/schedule";
import { LogOut, Scissors, Calendar, Tag, Users, MessageCircle, Image as ImageIcon } from "lucide-react";
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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setMsg("E-mail ou senha incorretos (ou e-mail ainda não confirmado).");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setMsg(error ? error.message : "Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.");
    }
  };
  return (
    <Center>
      <Scissors className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-3 text-5xl">Área do dono</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 text-left">
        <input className="field" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Senha (mín. 6)" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button className="btn-gold w-full">{mode === "in" ? "Entrar" : "Criar conta"}</button>
      </form>
      <button className="mt-4 text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
      </button>
      <p className="mt-6"><Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar ao site</Link></p>
    </Center>
  );
}

type Appt = { id: string; client_name: string; client_phone: string; appt_date: string; appt_time: string; status: string; barber_id: string; service_id: string | null };
type Barber = { id: string; name: string; active: boolean };
type Service = { id: string; name: string; price: number; duration_min: number; active: boolean; sort: number };

function Panel({ email }: { email: string }) {
  const [tab, setTab] = useState<"agenda" | "servicos" | "fotos" | "barbeiros">("agenda");
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
