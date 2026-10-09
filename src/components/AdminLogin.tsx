import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recover, setRecover] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (recover) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setMessage(error ? "Não foi possível enviar o e-mail. Tente novamente mais tarde." : "Se esse e-mail possui uma conta, você receberá um link para definir a senha. Confira também o spam.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setMessage(error.code === "email_not_confirmed" ? "Confirme seu e-mail pelo link recebido antes de entrar." : "E-mail ou senha incorretos. Confira os dados ou defina uma nova senha.");
      }
    } catch {
      setMessage("Não foi possível conectar. Verifique sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 text-left">
      <div className="space-y-1">
        <label htmlFor="admin-email" className="text-sm">E-mail</label>
        <input id="admin-email" className="field" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} />
      </div>
      {!recover && <div className="space-y-1">
        <label htmlFor="admin-password" className="text-sm">Senha</label>
        <div className="relative">
          <input id="admin-password" className="field pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button>
        </div>
      </div>}
      {message && <p role="status" className="text-sm text-foreground">{message}</p>}
      <Button type="submit" className="btn-gold h-auto w-full" disabled={busy}>{busy ? "Aguarde..." : recover ? "Enviar link para definir senha" : "Entrar"}</Button>
      <Button type="button" variant="link" className="h-auto w-full whitespace-normal" disabled={busy} onClick={() => { setRecover(!recover); setMessage(""); setPassword(""); }}>{recover ? "Voltar ao login" : "Esqueci ou ainda não tenho senha"}</Button>
    </form>
  );
}