import { useEffect, useState } from "react";
import { Star, Send, MessageSquareQuote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PublicReview = { id: string; name: string; rating: number; comment: string; response: string | null; created_at: string };

export function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadReviews = async () => {
    const { data, error } = await supabase.from("reviews")
      .select("id,name,rating,comment,response,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12);
    if (!error) setReviews((data as PublicReview[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void loadReviews(); }, []);

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const cleanName = name.trim();
    const cleanComment = comment.trim();
    if (cleanName.length < 2) return setMessage({ ok: false, text: "Informe seu nome (pelo menos 2 caracteres)." });
    if (cleanComment.length < 8) return setMessage({ ok: false, text: "Conte um pouco mais sobre sua experiência (mínimo de 8 caracteres)." });
    setSending(true);
    const { error } = await supabase.from("reviews").insert({
      name: cleanName,
      rating,
      comment: cleanComment,
      status: "pending",
    });
    setSending(false);
    if (error) {
      console.error("[Avaliações] Falha ao enviar:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      const missingTable = error.code === "42P01" || error.code === "PGRST205" || /relation .*reviews.* does not exist|could not find the table .*reviews/i.test(error.message);
      setMessage({
        ok: false,
        text: missingTable
          ? "A tabela de avaliações ainda não existe no banco. O administrador precisa aplicar a migração SQL do repositório no Supabase."
          : error.code === "42501"
            ? "O banco bloqueou o envio por uma regra de permissão. Confira as políticas RLS da tabela reviews no Supabase."
            : "Não foi possível enviar a avaliação. Confira o erro no console do navegador (F12) ou verifique a configuração da tabela reviews no Supabase.",
      });
      return;
    }
    setName("");
    setComment("");
    setRating(5);
    setMessage({ ok: true, text: "Obrigado pela avaliação! Ela será exibida no site depois da aprovação da equipe." });
  };

  return (
    <section id="avaliacoes" className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Quem já passou por aqui</p>
          <h2 className="mt-2 text-6xl md:text-7xl">Avaliações <span className="text-gold">reais</span></h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Sua experiência ajuda outras pessoas a escolherem a Barbearia Staudt. Todas as avaliações passam por aprovação antes de aparecerem publicamente.</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-background px-5 py-3">
            <div className="flex items-center gap-1 text-primary" aria-label={average.toFixed(1) + " de 5 estrelas"}>
              {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-5 w-5 ${i < Math.round(average) ? "fill-current" : "opacity-30"}`} />)}
            </div>
            <span className="font-semibold">{reviews.length ? average.toFixed(1).replace(".", ",") : "—"}</span>
            <span className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? "avaliação publicada" : "avaliações publicadas"}</span>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h3 className="text-3xl">O que nossos clientes dizem</h3>
            {loading ? <p className="mt-5 text-muted-foreground">Carregando avaliações...</p> : reviews.length === 0 ? (
              <div className="mt-5 rounded-xl border border-border bg-background p-6">
                <MessageSquareQuote className="h-8 w-8 text-primary" />
                <p className="mt-3 font-semibold">Seja o primeiro a avaliar</p>
                <p className="mt-1 text-sm text-muted-foreground">Ainda não há avaliações publicadas. Conte como foi sua experiência!</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-border bg-background p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center gap-1 text-primary" aria-label={review.rating + " de 5 estrelas"}>
                        {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "opacity-25"}`} />)}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{review.comment}</p>
                    {review.response && <div className="mt-4 rounded-lg border-l-2 border-primary bg-card p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Resposta da barbearia</p><p className="mt-2 text-sm">{review.response}</p></div>}
                  </article>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="h-fit space-y-5 rounded-xl border border-border bg-background p-6 md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Sua opinião importa</p>
              <h3 className="mt-2 text-3xl">Deixe sua avaliação</h3>
              <p className="mt-2 text-sm text-muted-foreground">Leva menos de um minuto.</p>
            </div>
            <label className="block text-sm font-medium">Seu nome
              <input className="field mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} autoComplete="name" placeholder="Como podemos te chamar?" required />
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Sua nota</legend>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const value = i + 1;
                  return <button key={value} type="button" onClick={() => setRating(value)} aria-label={value + (value === 1 ? " estrela" : " estrelas")} aria-pressed={rating === value} className="rounded-md p-1 text-primary transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Star className={`h-8 w-8 ${value <= rating ? "fill-current" : "opacity-25"}`} /></button>;
                })}
                <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
              </div>
            </fieldset>
            <label className="block text-sm font-medium">Conte como foi sua experiência
              <textarea className="field mt-2 min-h-32 w-full" value={comment} onChange={(e) => setComment(e.target.value)} minLength={8} maxLength={1200} placeholder="O atendimento, o corte, o ambiente..." required />
              <span className="mt-1 block text-right text-xs text-muted-foreground">{comment.length}/1200</span>
            </label>
            {message && <p role="status" className={`rounded-lg border p-3 text-sm ${message.ok ? "border-success text-success" : "border-destructive text-destructive"}`}>{message.text}</p>}
            <button type="submit" disabled={sending} className="btn-gold w-full disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Enviando..." : <><Send className="mr-2 inline h-4 w-4" />Enviar avaliação</>}</button>
            <p className="text-xs leading-5 text-muted-foreground">Ao enviar, você concorda que sua avaliação poderá ser publicada após análise da equipe. Não inclua informações pessoais sensíveis.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
