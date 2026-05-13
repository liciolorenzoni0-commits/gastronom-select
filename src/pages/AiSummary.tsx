import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

export default function AiSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const evaluationId = parseInt(id || "0");

  const { data: evaluation, isLoading } = trpc.evaluation.getById.useQuery(
    { id: evaluationId },
    { enabled: evaluationId > 0 }
  );

  const { data: existingSummary } = trpc.aiSummary.getByEvaluation.useQuery(
    { evaluationId },
    { enabled: evaluationId > 0 }
  );

  const generateSummary = trpc.aiSummary.generate.useMutation();

  const { data: candidate } = trpc.candidate.getById.useQuery(
    { id: evaluation?.candidateId || 0 },
    { enabled: !!evaluation?.candidateId }
  );

  useEffect(() => {
    if (evaluation && !existingSummary && !generateSummary.isPending && evaluation.scores && evaluation.scores.length > 0) {
      handleGenerate();
    }
  }, [evaluation, existingSummary]);

  const handleGenerate = () => {
    if (!evaluation || !candidate) return;
    const scores = (evaluation.scores || []).map((s) => ({
      metricName: s.metricName,
      score: parseFloat(s.score),
      category: s.category || "technical",
    }));
    generateSummary.mutate({
      evaluationId,
      notes: evaluation.generalNotes || "",
      scores,
      candidateName: candidate.fullName,
      role: candidate.role,
    });
  };

  const openKimiChat = () => {
    // Open Kimi web chat in a new tab
    window.open("https://chat.kimi.ai", "_blank", "noopener,noreferrer");
  };

  const summary = generateSummary.data || existingSummary;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Evaluación No Encontrada</h1>
          <Link to="/evaluate" className="text-[#2F80ED] text-[14px] mt-2 inline-block">
            Volver a Búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const recData: Record<string, { label: string; bg: string; text: string; border: string }> = {
    strong_hire: { label: "Contratar Fuerte", bg: "bg-[#DCFCE7]", text: "text-[#166534]", border: "border-[#BBF7D0]" },
    hire: { label: "Contratar", bg: "bg-[#EAF2FF]", text: "text-[#1E40AF]", border: "border-[#BFDBFE]" },
    consider: { label: "Considerar", bg: "bg-[#FEF9C3]", text: "text-[#854D0E]", border: "border-[#FDE68A]" },
    pass: { label: "Rechazar", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#FECACA]" },
  };
  const rec = recData[evaluation.recommendation || "consider"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#2F80ED]" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
              Resumen Ejecutivo con IA
            </h1>
            {candidate && (
              <p className="text-[12px] text-[#64748B]">
                {candidate.fullName} · Evaluación #{evaluationId}
              </p>
            )}
          </div>
        </div>

        {generateSummary.isPending && !summary && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2FF] flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" />
            </div>
            <p className="text-[14px] text-[#64748B]">Analizando datos de evaluación...</p>
            <p className="text-[12px] text-[#94A3B8] mt-1">Esto toma unos segundos</p>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            {/* Score + Recommendation Card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[56px] font-bold text-[#0F172A] tracking-tight leading-none">
                    {summary.recommendationScore}
                  </span>
                  <span className="text-[16px] text-[#94A3B8] font-medium">/10</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold ${rec.bg} ${rec.text} border ${rec.border}`}>
                    {rec.label}
                  </span>
                  {summary.culturalFit && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                      <Shield className="w-3 h-3" />
                      Ajuste {summary.culturalFit}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
              <h2 className="text-[14px] font-semibold text-[#0F172A] mb-3">Resumen</h2>
              <p className="text-[14px] text-[#475569] leading-[1.7]">{summary.executiveSummary}</p>
            </div>

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(summary.strengths as string[])?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
                  <h3 className="flex items-center gap-2 text-[12px] font-semibold text-[#166534] uppercase tracking-wider mb-4">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Fortalezas
                  </h3>
                  <ul className="space-y-3">
                    {(summary.strengths as string[]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#475569]">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(summary.concerns as string[])?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
                  <h3 className="flex items-center gap-2 text-[12px] font-semibold text-[#991B1B] uppercase tracking-wider mb-4">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Consideraciones
                  </h3>
                  <ul className="space-y-3">
                    {(summary.concerns as string[]).map((c, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#475569]">
                        <ThumbsDown className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            {evaluation.scores && evaluation.scores.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
                <h2 className="text-[14px] font-semibold text-[#0F172A] mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2F80ED]" />
                  Desglose de Puntajes
                </h2>
                <div className="space-y-3.5">
                  {evaluation.scores.map((s) => {
                    const pct = parseFloat(s.score) * 10;
                    return (
                      <div key={s.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-medium text-[#475569]">{s.metricName}</span>
                          <span className="text-[13px] font-bold text-[#0F172A]">{s.score}</span>
                        </div>
                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 80 ? "linear-gradient(90deg, #22C55E, #4ADE80)" : pct >= 60 ? "linear-gradient(90deg, #F59E0B, #FBBF24)" : "linear-gradient(90deg, #EF4444, #F87171)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 pb-4">
              <Link to="/feedback" className="flex items-center gap-2 px-5 py-2.5 gradient-blue text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all">
                <MessageSquare className="w-3.5 h-3.5" />
                Feedback a Gastronom
              </Link>
              <button onClick={handleGenerate} disabled={generateSummary.isPending} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#475569] rounded-xl text-[13px] font-medium border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all disabled:opacity-50">
                {generateSummary.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Regenerar
              </button>
              <button
                onClick={openKimiChat}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#F0FDF4] text-[#166534] rounded-xl text-[13px] font-medium border border-[#BBF7D0] hover:border-[#86EFAC] transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Analizar con Kimi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
