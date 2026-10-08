import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scissors, MapPin, Clock, MessageCircle, Instagram, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/real-fachada.jpg";
import g1 from "@/assets/real-corte.jpg";
import g2 from "@/assets/real3.jpg";
import g3 from "@/assets/real5.jpg";
import g4 from "@/assets/real2.jpg";
import g5 from "@/assets/real6.jpg";
import g6 from "@/assets/real7.jpg";
import g7 from "@/assets/real1.jpg";
import g8 from "@/assets/real4.jpg";
import logo from "@/assets/logo.png";
import { Booking } from "@/components/Booking";
import { ADDRESS, HOURS_LABEL, WHATSAPP } from "@/lib/schedule";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Staudt — Corte, Barba, Luzes e Platinado" },
      { name: "description", content: "Agende seu horário online na Barbearia Staudt. Cortes, barba, luzes, pigmentação, platinado e sobrancelha." },
      { property: "og:title", content: "Barbearia Staudt — Agende seu horário" },
      { property: "og:description", content: "Cortes, barba, luzes, pigmentação, platinado e sobrancelha. Agende online." },
    ],
  }),
  component: Index,
});

const services = [
  { t: "Corte degradê", d: "Degradê, social, tesoura — do clássico ao moderno.", img: g1 },
  { t: "Barba completa", d: "Toalha quente, navalha e acabamento impecável.", img: g2 },
  { t: "Corte e Platinado", d: "Descoloração completa com cuidado profissional.", img: g3 },
  { t: "Corte e Luzes", d: "Mechas e reflexos para dar estilo ao visual.", img: g4 },
  { t: "Sobrancelha", d: "Design na navalha, natural e alinhado.", img: g5 },
  { t: "Pigmentação", d: "Preenchimento de falhas em barba e cabelo.", img: g7 },
];

const gallery = [g1, g2, g3, g4, g5, g6, g7, g8, hero];

type PriceRow = { id: string; name: string; price: number };

function Index() {
  const [prices, setPrices] = useState<PriceRow[]>([]);
  useEffect(() => {
    supabase.from("services").select("id,name,price").eq("active", true).order("sort").then(({ data }) => setPrices((data as PriceRow[]) ?? []));
  }, []);
  return (
    <div className="overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#" className="flex items-center gap-2 font-display text-2xl tracking-wider">
            <img src={logo} alt="Logo Barbearia Staudt" className="h-9 w-9 rounded-full object-cover" /> STAUDT
          </a>
          <nav className="hidden gap-6 text-sm font-semibold uppercase tracking-widest md:flex">
            <a href="#servicos" className="hover:text-primary">Serviços</a>
            <a href="#precos" className="hover:text-primary">Preços</a>
            <a href="#galeria" className="hover:text-primary">Galeria</a>
            <a href="#contato" className="hover:text-primary">Contato</a>
          </nav>
          <a href="#agendar" className="btn-gold !px-4 !py-2 text-xs">Agendar</a>
        </div>
      </header>

      <section className="relative flex min-h-[100svh] items-end">
        <img src={hero} alt="Barbeiro cortando cabelo na Barbearia Staudt" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3 w-3" /> Barbearia
          </p>
          <h1 className="text-7xl leading-[0.85] md:text-[10rem]">
            Barbearia <span className="text-gold">Staudt</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Estilo, precisão e atitude. Corte, barba, luzes e platinado com quem entende do assunto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#agendar" className="btn-gold">Agendar horário</a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="btn-outline">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="border-y border-border bg-gold py-3 text-primary-foreground">
        <div className="flex w-max animate-marquee gap-10 font-display text-2xl tracking-widest">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Corte", "Barba", "Luzes", "Pigmentação", "Platinado", "Sobrancelha"].map((s) => (
              <span key={s + k} className="flex items-center gap-10">{s} <Star className="h-4 w-4 fill-current" /></span>
            )),
          )}
        </div>
      </div>

      <section id="servicos" className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">O que fazemos</p>
        <h2 className="mt-2 text-6xl md:text-7xl">Serviços</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.t} className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border">
              <img src={s.img} alt={s.t} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-fade" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-4xl">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="precos" className="border-y border-border bg-card py-24">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Valores</p>
          <h2 className="mt-2 text-6xl md:text-7xl">Tabela de <span className="text-gold">preços</span></h2>
          <div className="mt-12 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
            {prices.map((p) => (
              <div key={p.id} className="group flex items-baseline justify-between gap-4 px-6 py-5 transition hover:bg-card">
                <span className="font-display text-2xl tracking-wide md:text-3xl">{p.name}</span>
                <span className="mx-2 flex-1 border-b border-dotted border-border group-hover:border-primary/50" />
                <span className="font-display text-2xl text-gold md:text-3xl">
                  R$ {Number(p.price).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">Valores sujeitos a alteração. Agende online e garanta seu horário.</p>
        </div>
      </section>

      <section id="galeria" className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Nosso trabalho</p>
          <h2 className="mt-2 text-6xl md:text-7xl">Galeria</h2>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((g, i) => (
              <div key={i} className={`overflow-hidden rounded-lg ${i % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <img src={g} alt="Trabalho da Barbearia Staudt" loading="lazy" width={1024} height={1024} className="aspect-square h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
            ))}
          </div>
          <a href="https://www.instagram.com/barbearia.staudt" target="_blank" rel="noreferrer" className="btn-outline mt-10">
            <Instagram className="h-4 w-4" /> @barbearia.staudt
          </a>
        </div>
      </section>

      <section id="agendar" className="mx-auto max-w-4xl px-5 py-24">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-primary">Rápido e fácil</p>
        <h2 className="mt-2 text-center text-6xl md:text-7xl">Agende seu <span className="text-gold">horário</span></h2>
        <div className="mt-12"><Booking /></div>
      </section>

      <section id="contato" className="relative">
        <img src={g6} alt="Interior da Barbearia Staudt" loading="lazy" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-5 py-24 md:grid-cols-3">
          {[
            { i: MapPin, t: "Endereço", c: <p>{ADDRESS}</p> },
            { i: Clock, t: "Horários", c: HOURS_LABEL.map((h) => <p key={h}>{h}</p>) },
            { i: MessageCircle, t: "WhatsApp", c: <a className="text-primary underline" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">(47) 99141-2316</a> },
          ].map(({ i: Icon, t, c }) => (
            <div key={t} className="rounded-xl border border-border bg-background/80 p-6 backdrop-blur">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 text-3xl">{t}</h3>
              <div className="mt-2 text-muted-foreground">{c}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Barbearia Staudt · <Link to="/admin" className="hover:text-primary">Área do dono</Link>
      </footer>

      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground shadow-glow">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
