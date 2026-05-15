import { useParams, useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Clock,
  Award,
  Tag,
  FileText,
  Star,
  ChevronRight,
  Briefcase,
  Phone,
  Mail,
  Loader2,
  Shield,
} from "lucide-react";

export default function CandidateProfile() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data: candidate, isLoading } = trpc.candidate.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  );

  const { data: evaluations } = trpc.evaluation.getByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  const startNewEvaluation = trpc.evaluation.create.useMutation({
    onSuccess: (data) => {
      navigate(`/evaluation/${data.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-[#CBD5E1]" />
          </div>
          <h1 className="text-[24px] font-semibold text-[#0F172A]">Candidato No Encontrado</h1>
          <p className="text-[14px] text-[#64748B] mt-2">
            El token de evaluación no coincide con ningún candidato.
          </p>
          <Link
            to="/evaluate"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 gradient-blue text-white rounded-xl text-[14px] font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    chef: "Chef Ejecutivo",
    sous_chef: "Sous Chef",
    manager: "Gerente de Restaurante",
    waiter: "Camarero Senior",
    bartender: "Jefe de Bar",
    host: "Maître d'Hôtel",
  };

  const tags = (candidate.tags as string[]) || [];
  const evalsList = evaluations || [];
  const latestEval = evalsList[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card overflow-hidden mb-5">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#E2E8F0] ring-offset-2">
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt={candidate.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full gradient-blue flex items-center justify-center">
                    <span className="text-white text-[20px] font-bold">
                      {candidate.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-[22px] md:text-[26px] font-semibold text-[#0F172A] tracking-tight">
                    {candidate.fullName}
                  </h1>
                  {latestEval?.recommendation && (
                    <RecommendationBadge recommendation={latestEval.recommendation} />
                  )}
                </div>
                <p className="text-[14px] text-[#2F80ED] font-medium">
                  {roleLabels[candidate.role] || candidate.role}
                </p>

                <div className="flex flex-wrap gap-4 mt-4">
                  {candidate.experienceYears && (
                    <span className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <Clock className="w-3.5 h-3.5" />
                      {candidate.experienceYears} años exp.
                    </span>
                  )}
                  {candidate.email && (
                    <span className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <Mail className="w-3.5 h-3.5" />
                      {candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <Phone className="w-3.5 h-3.5" />
                      {candidate.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  startNewEvaluation.mutate({
                    candidateId: candidate.id,
                  })
                }
                disabled={startNewEvaluation.isPending}
                className="flex-shrink-0 px-5 py-2.5 gradient-blue text-white rounded-xl text-[13px] font-semibold hover:shadow-lg hover:shadow-[#2F80ED]/20 transition-all disabled:opacity-50"
              >
                {startNewEvaluation.isPending ? "Creando..." : "Nueva Evaluación"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Skills */}
            {tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A] mb-4">
                  <Tag className="w-4 h-4 text-[#2F80ED]" />
                  Habilidades y Experiencia
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-[12px] font-medium bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#E2E8F0]/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation History */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
              <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A] mb-4">
                <FileText className="w-4 h-4 text-[#2F80ED]" />
                Historial de Evaluaciones
              </h3>
              {evalsList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-5 h-5 text-[#CBD5E1]" />
                  </div>
                  <p className="text-[13px] text-[#94A3B8]">
                    Sin evaluaciones aún. Inicia la primera.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {evalsList.map((ev: any) => (
                    <Link
                      key={ev.id}
                      to={`/evaluation/${ev.id}/summary`}
                      className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl hover:bg-[#F1F5F9] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-[#2F80ED]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0F172A]">
                          {ev.restaurantName || "Evaluación"}
                        </p>
                        <p className="text-[12px] text-[#94A3B8]">
                          {ev.interviewerName || "Anónimo"} ·{" "}
                          {new Date(ev.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      {ev.overallScore && (
                        <span className="text-[14px] font-semibold text-[#C8A96B]">
                          {ev.overallScore}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Score */}
            {latestEval?.overallScore && (
              <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white">
                <span className="text-[11px] font-semibold text-[#64748B] tracking-[0.1em] uppercase">
                  Puntaje Reciente
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[48px] font-bold text-[#C8A96B] tracking-tight">
                    {latestEval.overallScore}
                  </span>
                  <span className="text-[16px] text-[#64748B]">/10</span>
                </div>
                {latestEval?.recommendation && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                    <Shield className="w-3 h-3 text-[#22C55E]" />
                    <span className="text-[11px] font-medium text-[#22C55E] capitalize">
                      Ajuste Cultural
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* AI Summary Preview */}
            {latestEval?.aiSummaryId && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A] mb-3">
                  <Award className="w-4 h-4 text-[#C8A96B]" />
                  Resumen con IA
                </h3>
                <p className="text-[13px] text-[#64748B] leading-relaxed line-clamp-4">
                  Resumen generado automaticamente basado en la evaluacion.
                </p>
                <Link
                  to={`/evaluation/${latestEval!.id}/summary`}
                  className="inline-flex items-center gap-1 mt-4 text-[12px] font-semibold text-[#2F80ED] hover:underline"
                >
                  Ver resumen completo
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* CV Link */}
            {candidate.cvUrl && (
              <a
                href={candidate.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#0F172A]">Ver CV</p>
                  <p className="text-[11px] text-[#94A3B8]">Currículum completo</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#CBD5E1]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    strong_hire: { bg: "bg-[#DCFCE7]", text: "text-[#166534]", label: "Contratar Fuerte" },
    hire: { bg: "bg-[#EAF2FF]", text: "text-[#1E40AF]", label: "Contratar" },
    consider: { bg: "bg-[#FEF9C3]", text: "text-[#854D0E]", label: "Considerar" },
    pass: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "Rechazar" },
  };
  const style = styles[recommendation] || styles.consider;
  return (
    <span className={`px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.text} rounded-full uppercase tracking-wider`}>
      {style.label}
    </span>
  );
}
