import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Star,
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";

export default function FeedbackPage() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [serviceRating, setServiceRating] = useState(0);
  const [responsivenessRating, setResponsivenessRating] = useState(0);
  const [candidateQualityRating, setCandidateQualityRating] = useState(0);
  const [comments, setComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitFeedback = trpc.feedback.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clientName.trim()) { setError("Ingresa tu nombre"); return; }
    if (serviceRating === 0) { setError("Califica nuestro servicio"); return; }

    submitFeedback.mutate({
      clientName,
      clientEmail: clientEmail || undefined,
      restaurantName: restaurantName || undefined,
      serviceRating,
      responsivenessRating: responsivenessRating || undefined,
      candidateQualityRating: candidateQualityRating || undefined,
      comments: comments || undefined,
      wouldRecommend: wouldRecommend ?? undefined,
    });
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="block text-[12px] font-medium text-[#64748B] mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5 transition-transform hover:scale-110">
            <Star className={`w-6 h-6 ${n <= value ? "fill-[#C8A96B] text-[#C8A96B]" : "text-[#E2E8F0]"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Gracias</h1>
          <p className="text-[14px] text-[#64748B] mt-2">
            Tu feedback nos ayuda a mejorar para toda la comunidad de hostelería.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 px-6 py-3 gradient-blue text-white rounded-xl text-[13px] font-semibold">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF9C3] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-[#D97706]" />
            </div>
            <h1 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
              Feedback del Cliente
            </h1>
            <p className="text-[13px] text-[#64748B] mt-1">
              Ayúdanos a mejorar nuestro servicio de reclutamiento
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Tu nombre *" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email (opcional)" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
              <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurante / Local" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
            </div>

            <div className="p-5 bg-[#F8FAFC] rounded-xl space-y-4">
              <StarRating value={serviceRating} onChange={setServiceRating} label="Servicio General *" />
              <StarRating value={responsivenessRating} onChange={setResponsivenessRating} label="Tiempo de Respuesta" />
              <StarRating value={candidateQualityRating} onChange={setCandidateQualityRating} label="Calidad del Candidato" />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-2">
                ¿Recomendarías Gastronom a otros restaurantes?
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setWouldRecommend(true)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold border transition-all ${wouldRecommend === true ? "bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]" : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"}`}>
                  <ThumbsUp className="w-3.5 h-3.5" /> Sí
                </button>
                <button type="button" onClick={() => setWouldRecommend(false)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold border transition-all ${wouldRecommend === false ? "bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]" : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"}`}>
                  <ThumbsDown className="w-3.5 h-3.5" /> No
                </button>
              </div>
            </div>

            <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comentarios adicionales..." rows={3} className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] resize-none" />

            {error && <div className="flex items-center gap-2 text-[#EF4444] text-[13px]"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}

            <button type="submit" disabled={submitFeedback.isPending} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 gradient-blue text-white rounded-xl text-[14px] font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {submitFeedback.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando</> : <><Send className="w-4 h-4" /> Enviar Feedback</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
