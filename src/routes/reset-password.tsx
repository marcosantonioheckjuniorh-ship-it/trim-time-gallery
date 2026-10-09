import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Definir senha — Barbearia Staudt" },
    { name: "description", content: "Defina uma nova senha de acesso ao painel da Barbearia Staudt." },
    { property: "og:title", content: "Definir senha — Barbearia Staudt" },
    { property: "og:description", content: "Recuperação segura do acesso do proprietário." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [valid, setValid] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") { setValid(true); setReady(true); }
    });
    supabase.auth.getUser().then(({ data: user }) => {
      if (!active) return;
      if (recovery && user.user) setValid(true);
      setReady(true);
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    if (password !== confirmation) { setMessage("As senhas precisam ser iguais."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage("Não foi possível definir a senha. Use pelo menos 8 caracteres e tente novamente.");
      else { setDone(true); setPassword(""); setConfirmation(""); }
    } catch { setMessage("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen place-items-center px-5">
    <div className="w-full max-w-sm">
      <h1 className="text-4xl">Definir senha</h1>
      {!ready ? <p className="mt-4">Verificando link...</p> : done ? <p role="status" className="mt-4">Senha salva! Você já pode acessar o painel.</p> : !valid ? <p role="status" className="mt-4">Link inválido ou expirado. Solicite um novo link na entrada do painel.</p> : <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block space-y-1"><span>Nova senha</span><input className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="block space-y-1"><span>Confirmar senha</span><input className="field" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        {message && <p role="status" className="text-sm text-destructive">{message}</p>}
        <Button className="btn-gold h-auto w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar senha"}</Button>
      </form>}
      <Link to="/admin" className="mt-6 inline-block text-sm text-primary">Voltar ao painel</Link>
    </div>
  </main>;
}