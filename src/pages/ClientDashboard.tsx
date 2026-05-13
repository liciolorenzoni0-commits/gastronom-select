import { useState } from "react";
import { Link, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Users,
  Star,
  ArrowRight,
  Shield,
  Loader2,
  Copy,
  Check,
  BarChart3,
  ChefHat,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Fetch candidates for this client via portal token
  const { data: clientCandidates, isLoading } = trpc.portal.getCandidates.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const candidates = clientCandidates || [];

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const evalUrl = (cToken: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/#/candidate/${cToken}`;
  };

  const roleLabels: Record<string, string> = {
    chef: "Chef Ejecutivo",
    sous_chef: "Sous Chef",
    manager: "Gerente",
    waiter: "Camarero",
    bartender: "Bartender",
    host: "Maître d'Hôtel",
  };

  // Calculate stats
  const allEvaluations = candidates.flatMap(
    (c: { evaluations?: Array<{ overallScore?: string | null; recommendation?: string | null }> }) =>
      c.evaluations || []
  );
  const totalEvals = allEvaluations.length;
  const avgScore =
    totalEvals > 0
      ? (
          allEvaluations.reduce(
            (sum: number, e: { overallScore?: string | null }) =>
              sum + parseFloat(e.overallScore || "0"),
            0
          ) / totalEvals
        ).toFixed(1)
      : "0";
  const strongHires = allEvaluations.filter(
    (e: { recommendation?: string | null }) =>
      e.recommendation === "strong_hire" || e.recommendation === "hire"
  ).length;

  // Score distribution for chart
  const scoreRanges = [
    {
      range: "9-10",
      count: allEvaluations.filter(
        (e: { overallScore?: string | null }) =>
          parseFloat(e.overallScore || "0") >= 9
      ).length,
    },
    {
      range: "8-9",
      count: allEvaluations.filter((e: { overallScore?: string | null }) => {
        const s = parseFloat(e.overallScore || "0");
        return s >= 8 && s < 9;
      }).length,
    },
    {
      range: "7-8",
      count: allEvaluations.filter((e: { overallScore?: string | null }) => {
        const s = parseFloat(e.overallScore || "0");
        return s >= 7 && s < 8;
      }).length,
    },
    {
      range: "6-7",
      count: allEvaluations.filter((e: { overallScore?: string | null }) => {
        const s = parseFloat(e.overallScore || "0");
        return s >= 6 && s < 7;
      }).length,
    },
    {
      range: "<6",
      count: allEvaluations.filter(
        (e: { overallScore?: string | null }) =>
          parseFloat(e.overallScore || "0") < 6
      ).length,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="gradient-navy pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <span className="text-[11px] font-semibold text-[#C8A96B] tracking-[0.15em] uppercase">
            Portal del Cliente
          </span>
          <h1 className="text-[28px] md:text-[36px] font-semibold text-white mt-2 tracking-tight">
            Tus <span className="text-[#C8A96B]">Candidatos</span>
          </h1>
          <p className="text-[14px] text-[#94A3B8] mt-2 max-w-md">
            Panel exclusivo para ver los candidatos que Gastronom Select ha
            preparado para tu restaurante.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6 pb-16">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<Users className="w-5 h-5" />}
            label="Candidatos"
            value={String(candidates.length)}
            color="#2F80ED"
            sub="En tu pipeline"
          />
          <KpiCard
            icon={<Star className="w-5 h-5" />}
            label="Puntaje Prom."
            value={avgScore}
            color="#C8A96B"
            sub="Sobre 10"
          />
          <KpiCard
            icon={<Shield className="w-5 h-5" />}
            label="Recomendados"
            value={String(strongHires)}
            color="#22C55E"
            sub="Para contratar"
          />
          <KpiCard
            icon={<FileText className="w-5 h-5" />}
            label="Evaluaciones"
            value={String(totalEvals)}
            color="#F59E0B"
            sub="Completadas"
          />
        </div>

        {/* Chart */}
        {totalEvals > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6 mb-8">
            <h3 className="text-[14px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2F80ED]" />
              Distribución de Puntajes
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreRanges} barSize={40}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0F172A",
                    border: "none",
                    borderRadius: "10px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#2F80ED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Candidates List */}
        {candidates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-[#CBD5E1]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
              Sin candidatos aún
            </h3>
            <p className="text-[14px] text-[#64748B] max-w-sm mx-auto">
              Pronto recibirás candidatos de Gastronom Select. Te enviaremos un
              enlace por WhatsApp o email.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#2F80ED]" />
              Tus Candidatos ({candidates.length})
            </h3>
            {candidates.map(
              (candidate: {
                id?: number;
                fullName: string;
                role: string;
                experienceYears?: number | null;
                avatarUrl?: string | null;
                token: string;
                tags?: string[] | null;
                evaluations?: Array<{
                  overallScore?: string | null;
                  recommendation?: string | null;
                  createdAt?: Date | null;
                }>;
              }) => {
                const lastEval = candidate.evaluations?.[0];
                const recColors: Record<string, string> = {
                  strong_hire: "bg-[#DCFCE7] text-[#166534]",
                  hire: "bg-[#EAF2FF] text-[#1E40AF]",
                  consider: "bg-[#FEF9C3] text-[#854D0E]",
                  pass: "bg-[#FEE2E2] text-[#991B1B]",
                };
                const recLabels: Record<string, string> = {
                  strong_hire: "Contratar Fuerte",
                  hire: "Contratar",
                  consider: "Considerar",
                  pass: "Rechazar",
                };
                return (
                  <div
                    key={candidate.token}
                    className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-[#E2E8F0] ring-offset-2">
                          {candidate.avatarUrl ? (
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full gradient-blue flex items-center justify-center">
                              <span className="text-white text-[18px] font-bold">
                                {candidate.fullName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-[16px] font-semibold text-[#0F172A]">
                              {candidate.fullName}
                            </h4>
                            {lastEval?.recommendation && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  recColors[lastEval.recommendation] ||
                                  recColors.consider
                                }`}
                              >
                                {recLabels[lastEval.recommendation] ||
                                  "Considerar"}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#2F80ED] font-medium">
                            {roleLabels[candidate.role] || candidate.role}
                          </p>
                          {candidate.experienceYears && (
                            <p className="text-[12px] text-[#94A3B8] mt-0.5">
                              {candidate.experienceYears} años de experiencia
                            </p>
                          )}
                          {candidate.tags && candidate.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(candidate.tags as string[])
                                .slice(0, 4)
                                .map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-lg text-[11px]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          )}
                          {lastEval?.overallScore && (
                            <div className="flex items-center gap-2 mt-3">
                              <Star className="w-3.5 h-3.5 text-[#C8A96B]" />
                              <span className="text-[14px] font-bold text-[#0F172A]">
                                {lastEval.overallScore}
                              </span>
                              <span className="text-[12px] text-[#94A3B8]">
                                /10
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/candidate/${candidate.token}`}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 gradient-blue text-white rounded-xl text-[12px] font-semibold hover:shadow-lg transition-all"
                          >
                            Evaluar
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => copyLink(evalUrl(candidate.token))}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] rounded-xl text-[12px] font-medium hover:border-[#CBD5E1] transition-all"
                          >
                            {copiedLink === evalUrl(candidate.token) ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#22C55E]" />{" "}
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copiar enlace
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}10` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-[28px] font-bold text-[#0F172A] tracking-tight">
        {value}
      </div>
      <div className="text-[11px] font-medium text-[#94A3B8] mt-0.5">
        {label}
      </div>
      <div className="text-[10px] text-[#CBD5E1] mt-1">{sub}</div>
    </div>
  );
}
