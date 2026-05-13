import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Sparkles,
  User,
} from "lucide-react";

const roleMetrics: Record<string, { name: string; category: string }[]> = {
  chef: [
    { name: "Habilidad con Cuchillos", category: "Técnica" },
    { name: "Salsas", category: "Técnica" },
    { name: "Desarrollo de Menú", category: "Creativa" },
    { name: "Gestión de Cocina", category: "Liderazgo" },
    { name: "Seguridad Alimentaria", category: "Cumplimiento" },
    { name: "Velocidad Bajo Presión", category: "Operativa" },
    { name: "Liderazgo de Equipo", category: "Liderazgo" },
    { name: "Creatividad", category: "Creativa" },
  ],
  sous_chef: [
    { name: "Habilidad con Cuchillos", category: "Técnica" },
    { name: "Salsas", category: "Técnica" },
    { name: "Emplatado", category: "Creativa" },
    { name: "Higiene de Cocina", category: "Cumplimiento" },
    { name: "Velocidad", category: "Operativa" },
    { name: "Liderazgo", category: "Liderazgo" },
    { name: "Ajuste Cultural", category: "Blandas" },
  ],
  manager: [
    { name: "Relación con Clientes", category: "Blandas" },
    { name: "Gestión de Equipo", category: "Liderazgo" },
    { name: "Operaciones", category: "Operativa" },
    { name: "Resolución de Problemas", category: "Blandas" },
    { name: "Comunicación", category: "Blandas" },
    { name: "Atención al Detalle", category: "Operativa" },
  ],
  waiter: [
    { name: "Técnica de Servicio", category: "Técnica" },
    { name: "Conocimiento de Vinos", category: "Técnica" },
    { name: "Relación con Clientes", category: "Blandas" },
    { name: "Atención al Detalle", category: "Operativa" },
    { name: "Velocidad", category: "Operativa" },
    { name: "Trabajo en Equipo", category: "Blandas" },
  ],
  bartender: [
    { name: "Mixología", category: "Técnica" },
    { name: "Conocimiento de Productos", category: "Técnica" },
    { name: "Relación con Clientes", category: "Blandas" },
    { name: "Velocidad", category: "Operativa" },
    { name: "Creatividad", category: "Creativa" },
    { name: "Limpieza", category: "Cumplimiento" },
  ],
  host: [
    { name: "Relación con Clientes", category: "Blandas" },
    { name: "Comunicación", category: "Blandas" },
    { name: "Resolución de Problemas", category: "Blandas" },
    { name: "Atención al Detalle", category: "Operativa" },
    { name: "Temple Bajo Presión", category: "Blandas" },
  ],
};

const quickTags = [
  "Excelente comunicador",
  "Fuerte liderazgo",
  "Aprende rápido",
  "Gran emplatado",
  "Tranquilo bajo presión",
  "Resuelve problemas creativamente",
  "Jugador de equipo",
  "Atención al detalle",
  "Puntual y confiable",
  "Apasionado por la comida",
  "Buenas prácticas de higiene",
  "Necesita más experiencia",
];

const categoryColors: Record<string, string> = {
  Técnica: "#2F80ED",
  Creativa: "#8B5CF6",
  Liderazgo: "#0F172A",
  Cumplimiento: "#22C55E",
  Operativa: "#F59E0B",
  Blandas: "#EC4899",
};

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const evaluationId = parseInt(id || "0");

  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { data: evaluation } = trpc.evaluation.getById.useQuery(
    { id: evaluationId },
    { enabled: evaluationId > 0 }
  );

  const { data: candidate } = trpc.candidate.getById.useQuery(
    { id: evaluation?.candidateId || 0 },
    { enabled: !!evaluation?.candidateId }
  );

  const submitEval = trpc.evaluation.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => navigate(`/evaluation/${evaluationId}/summary`), 1200);
    },
    onError: (err) => setError(err.message),
  });

  const voiceTranscribe = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      setNotes((prev) => prev + (prev ? "\n\n" : "") + data.summary);
      setIsRecording(false);
    },
  });

  const metrics = candidate ? roleMetrics[candidate.role] || roleMetrics.chef : [];
  const scoredCount = Object.values(scores).filter((v) => v > 0).length;

  const handleScoreChange = (metric: string, value: number) => {
    setScores((prev) => ({ ...prev, [metric]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    setError("");
    if (!interviewerName.trim()) { setError("Ingresa tu nombre"); return; }
    if (!restaurantName.trim()) { setError("Ingresa el nombre del restaurante"); return; }
    if (scoredCount < metrics.length) { setError(`Puntúa todas las competencias (${scoredCount}/${metrics.length})`); return; }

    const allScores = Object.values(scores);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    let recommendation: "strong_hire" | "hire" | "consider" | "pass" = "consider";
    if (avgScore >= 9) recommendation = "strong_hire";
    else if (avgScore >= 7.5) recommendation = "hire";
    else if (avgScore >= 6) recommendation = "consider";
    else recommendation = "pass";

    const fullNotes = [notes, selectedTags.length > 0 ? `Etiquetas: ${selectedTags.join(", ")}` : ""].filter(Boolean).join("\n\n");

    submitEval.mutate({
      id: evaluationId,
      interviewerName,
      interviewerEmail,
      restaurantName,
      overallScore: parseFloat(avgScore.toFixed(1)),
      recommendation,
      generalNotes: fullNotes,
      scores: metrics.map((m) => ({
        metricName: m.name,
        score: scores[m.name] || 0,
        category: m.category.toLowerCase().replace(" ", "_") as "technical" | "soft_skills" | "leadership" | "hygiene",
      })),
    });
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      voiceTranscribe.mutate({ evaluationId, audioBase64: "mock", duration: 30 });
    } else {
      setIsRecording(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Evaluación Enviada</h1>
          <p className="text-[14px] text-[#64748B] mt-2">Generando resumen con IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-28 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
              Evaluación de Entrevista
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#C8A96B]/10 text-[#C8A96B] text-[10px] font-semibold tracking-wider uppercase">
              {candidate?.fullName || "Candidato"}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2F80ED] to-[#C8A96B] rounded-full transition-all duration-500"
              style={{ width: `${metrics.length > 0 ? (scoredCount / metrics.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-[#64748B] tabular-nums">
            {scoredCount}/{metrics.length}
          </span>
        </div>

        <div className="space-y-4">
          {/* Your Details */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
            <h2 className="text-[14px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#2F80ED]" />
              Tus Datos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} placeholder="Tu nombre *" className="px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
              <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurante / Local *" className="px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
              <input type="email" value={interviewerEmail} onChange={(e) => setInterviewerEmail(e.target.value)} placeholder="Email (opcional)" className="md:col-span-2 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" />
            </div>
          </div>

          {/* Competency Sliders */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
            <h2 className="text-[14px] font-semibold text-[#0F172A] mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C8A96B]" />
              Puntuación por Competencias
            </h2>
            <div className="space-y-5">
              {metrics.map((metric) => {
                const score = scores[metric.name] || 0;
                const color = categoryColors[metric.category] || "#2F80ED";
                return (
                  <div key={metric.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#0F172A]">{metric.name}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}12`, color }}>{metric.category}</span>
                      </div>
                      <span className="text-[16px] font-bold tabular-nums min-w-[28px] text-right" style={{ color: score >= 8 ? "#22C55E" : score >= 6 ? "#F59E0B" : "#64748B" }}>{score > 0 ? score : "—"}</span>
                    </div>
                    <input type="range" min={0} max={10} step={1} value={score} onChange={(e) => handleScoreChange(metric.name, parseInt(e.target.value))} className="w-full" style={{ background: score > 0 ? `linear-gradient(to right, ${color} 0%, ${color} ${score * 10}%, #E2E8F0 ${score * 10}%, #E2E8F0 100%)` : "#E2E8F0" }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tags */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
            <h2 className="text-[14px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2F80ED]" />
              Etiquetas Rápidas
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-2 text-[12px] font-medium rounded-xl border transition-all ${selectedTags.includes(tag) ? "bg-[#EAF2FF] border-[#2F80ED]/30 text-[#2F80ED] shadow-[0_0_0_2px_rgba(47,128,237,0.1)]" : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"}`}>
                  {selectedTags.includes(tag) && "✓ "}{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-[#0F172A]">Notas de la Entrevista</h2>
              <button onClick={handleVoiceToggle} disabled={voiceTranscribe.isPending} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isRecording ? "bg-[#FEE2E2] text-[#EF4444] animate-pulse" : voiceTranscribe.isPending ? "bg-[#F1F5F9] text-[#64748B]" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"}`}>
                {isRecording ? <><MicOff className="w-3 h-3" /> Detener</> : voiceTranscribe.isPending ? <><Loader2 className="w-3 h-3 animate-spin" /> Transcribiendo</> : <><Mic className="w-3 h-3" /> Voz</>}
              </button>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones rápidas sobre el candidato..." rows={4} className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] resize-none" />
          </div>

          {error && <div className="flex items-center gap-2 text-[#EF4444] text-[13px] px-1"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
        </div>
      </div>

      {/* Floating Submit */}
      <div className="fixed bottom-6 left-0 right-0 z-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/80 rounded-2xl shadow-elevated px-5 py-4 flex items-center justify-between">
            <div className="text-[12px] text-[#64748B]">
              <span className="font-semibold text-[#0F172A]">{scoredCount}</span> de <span className="font-semibold text-[#0F172A]">{metrics.length}</span> puntuados
              {selectedTags.length > 0 && <span className="ml-2 text-[#2F80ED]">· {selectedTags.length} etiquetas</span>}
            </div>
            <button onClick={handleSubmit} disabled={submitEval.isPending} className="flex items-center gap-2 px-6 py-2.5 gradient-blue text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {submitEval.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando</> : <><Send className="w-3.5 h-3.5" /> Enviar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
