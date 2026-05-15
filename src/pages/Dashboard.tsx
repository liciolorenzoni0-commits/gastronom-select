import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useNavigate, Link } from "react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Star,
  Clock,
  TrendingUp,
  Loader2,
  Award,
  BarChart3,
  PieChart as PieIcon,
  MessageSquare,
  Shield,
  Plus,
  Copy,
  Check,
  X,
  Link2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#2F80ED", "#C8A96B", "#22C55E", "#8B5CF6", "#F59E0B", "#EC4899"];

const ROLE_OPTIONS = [
  { value: "chef", label: "Chef Ejecutivo" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "manager", label: "Gerente de Restaurante" },
  { value: "waiter", label: "Camarero Senior" },
  { value: "bartender", label: "Jefe de Bar" },
  { value: "host", label: "Maître d'Hôtel" },
];

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("chef");
  const [expYears, setExpYears] = useState(5);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const [createdClientToken, setCreatedClientToken] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const { data: overview, isLoading } = trpc.dashboard.overview.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: roleDist } = trpc.dashboard.roleDistribution.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: scoreDist } = trpc.dashboard.scoreDistribution.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: pipeline } = trpc.dashboard.candidatePipeline.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: feedbackStats } = trpc.dashboard.clientFeedback.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: candidates } = trpc.candidate.list.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );

  const createCandidate = trpc.candidate.create.useMutation();
  const createEvaluation = trpc.evaluation.create.useMutation();

  const generateToken = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return `${role}-${slug}-${Date.now().toString(36).slice(-4)}`;
  };

  const clientTokenFromRestaurant = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!fullName.trim()) { setCreateError("El nombre es obligatorio"); return; }
    const token = generateToken(fullName);
    const clientToken = restaurantName.trim() ? clientTokenFromRestaurant(restaurantName) : "";

    createCandidate.mutate(
      {
        token, fullName: fullName.trim(), email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role: role as "chef" | "sous_chef" | "manager" | "waiter" | "bartender" | "host",
        experienceYears: expYears, tags: skills.length > 0 ? skills : undefined,
      },
      {
        onSuccess: (data) => {
          utils.candidate.list.invalidate();
          utils.dashboard.overview.invalidate();
          utils.dashboard.roleDistribution.invalidate();

          // Auto-create evaluation with restaurant if provided
          if (restaurantName.trim() && data.id) {
            createEvaluation.mutate(
              {
                candidateId: data.id,
                restaurantName: restaurantName.trim(),
              },
              {
                onSuccess: () => {
                  utils.dashboard.overview.invalidate();
                },
              }
            );
          }

          setCreatedToken(token);
          setCreatedClientToken(clientToken);
          setFullName(""); setEmail(""); setPhone(""); setSkills([]); setSkillInput(""); setRestaurantName("");
        },
        onError: (err) => setCreateError(err.message),
      }
    );
  };

  const addSkill = () => { const s = skillInput.trim(); if (s && !skills.includes(s)) { setSkills([...skills, s]); setSkillInput(""); } };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); setCopiedToken(text); setTimeout(() => setCopiedToken(null), 2000); };
  const evaluationUrl = (token: string) => { const origin = typeof window !== "undefined" ? window.location.origin : ""; return `${origin}/#/candidate/${token}`; };
  const clientPortalUrl = (token: string) => { const origin = typeof window !== "undefined" ? window.location.origin : ""; return `${origin}/#/client/${token}`; };

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#2F80ED] animate-spin" /></div>;
  }
  if (!isAuthenticated || user?.role !== "admin") return null;

  const nps = feedbackStats?.totalCount && feedbackStats.totalCount > 0
    ? Math.round(((feedbackStats.recommendCount || 0) / feedbackStats.totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="gradient-navy pt-24 pb-10 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <span className="text-[11px] font-semibold text-[#C8A96B] tracking-[0.15em] uppercase">Panel Interno</span>
          <h1 className="text-[28px] md:text-[36px] font-semibold text-white mt-2 tracking-tight">Panel de <span className="text-[#C8A96B]">Control</span></h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={<Users className="w-5 h-5" />} label="Candidatos" value={overview?.totalCandidates?.toString() || "0"} color="#2F80ED" sub="Total en pipeline" />
          <KpiCard icon={<Star className="w-5 h-5" />} label="Puntaje Prom." value={overview?.averageScore?.toString() || "0"} color="#C8A96B" sub="Sobre 10" />
          <KpiCard icon={<BarChart3 className="w-5 h-5" />} label="Evaluaciones" value={overview?.totalEvaluations?.toString() || "0"} color="#22C55E" sub="Histórico" />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="Pendientes" value={overview?.pendingEvaluations?.toString() || "0"} color="#F59E0B" sub="Borradores" />
        </div>

        <div className="mb-8">
          <button onClick={() => { setShowCreate(!showCreate); setCreatedToken(""); setCreateError(""); }} className="flex items-center gap-2 px-5 py-3 gradient-blue text-white rounded-xl text-[13px] font-semibold hover:shadow-lg transition-all">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cerrar" : "Crear Nuevo Candidato"}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6 md:p-8 mb-8">
            {createdToken ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-[#22C55E]" /></div>
                <h3 className="text-[18px] font-semibold text-[#0F172A] mb-1">Candidato Creado</h3>
                <p className="text-[13px] text-[#64748B] mb-4">Comparte estos enlaces con tu cliente</p>
                <div className="max-w-lg mx-auto space-y-3">
                  {/* Evaluation Link */}
                  <div>
                    <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1.5 text-left">Enlace de Evaluacion</p>
                    <div className="flex items-center gap-2 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <Link2 className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                      <code className="flex-1 text-[12px] text-[#0F172A] font-mono truncate">{evaluationUrl(createdToken)}</code>
                      <button onClick={() => copyToClipboard(evaluationUrl(createdToken))} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F80ED] text-white rounded-lg text-[11px] font-semibold flex-shrink-0">
                        {copiedToken === evaluationUrl(createdToken) ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                      </button>
                    </div>
                  </div>
                  {/* Client Portal Link */}
                  {createdClientToken && (
                    <div>
                      <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1.5 text-left">Portal del Cliente <span className="normal-case text-[#C8A96B]">(todos sus candidatos)</span></p>
                      <div className="flex items-center gap-2 p-4 bg-[#EAF2FF] rounded-xl border border-[#BFDBFE]">
                        <Link2 className="w-4 h-4 text-[#2F80ED] flex-shrink-0" />
                        <code className="flex-1 text-[12px] text-[#0F172A] font-mono truncate">{clientPortalUrl(createdClientToken)}</code>
                        <button onClick={() => copyToClipboard(clientPortalUrl(createdClientToken))} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8A96B] text-white rounded-lg text-[11px] font-semibold flex-shrink-0">
                          {copiedToken === clientPortalUrl(createdClientToken) ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => { setCreatedToken(""); setCreatedClientToken(""); setShowCreate(false); }} className="mt-4 text-[13px] font-medium text-[#2F80ED] hover:underline">Crear otro candidato</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate}>
                <h2 className="text-[18px] font-semibold text-[#0F172A] mb-6">Nuevo Candidato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Nombre Completo *</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ej. María González" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /></div>
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Rol *</label><select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]">{ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                  <div className="md:col-span-2"><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Restaurante Cliente * <span className="text-[#94A3B8] font-normal">(genera el portal del cliente)</span></label><input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="ej. El Celler de Can Roca" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /></div>
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@email.com" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /></div>
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Teléfono</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 612 345 678" className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /></div>
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Experiencia (años)</label><input type="number" min={0} max={50} value={expYears} onChange={(e) => setExpYears(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /></div>
                  <div><label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Habilidades</label><div className="flex gap-2"><input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Agrega + Enter" className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED]" /><button type="button" onClick={addSkill} className="px-4 py-3 bg-[#F1F5F9] text-[#475569] rounded-xl text-[13px] font-semibold">Agregar</button></div></div>
                </div>
                {skills.length > 0 && (<div className="flex flex-wrap gap-2 mb-4">{skills.map((s) => (<span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF2FF] text-[#2F80ED] rounded-lg text-[12px] font-medium">{s}<button type="button" onClick={() => removeSkill(s)} className="hover:text-[#1E40AF]"><X className="w-3 h-3" /></button></span>))}</div>)}
                {createError && <p className="text-[13px] text-[#EF4444] mb-4">{createError}</p>}
                <button type="submit" disabled={createCandidate.isPending} className="flex items-center gap-2 px-6 py-3 gradient-blue text-white rounded-xl text-[13px] font-semibold disabled:opacity-50">{createCandidate.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : <><Plus className="w-4 h-4" /> Generar Token y Crear</>}</button>
              </form>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Distribución por Rol" icon={<PieIcon className="w-4 h-4" />}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(roleDist || []).map(r => ({ name: r.role.replace("_", " "), value: r.count }))} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "10px", color: "#F8FAFC", fontSize: "12px" }} cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="value" fill="#2F80ED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Distribución de Puntajes" icon={<TrendingUp className="w-4 h-4" />}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={scoreDist || []}>
                <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8A96B" stopOpacity={0.2} /><stop offset="95%" stopColor="#C8A96B" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "10px", color: "#F8FAFC", fontSize: "12px" }} />
                <Area type="monotone" dataKey="count" stroke="#C8A96B" fill="url(#scoreGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <ChartCard title="Pipeline" icon={<Shield className="w-4 h-4" />}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={(pipeline || []).map(p => ({ name: p.status, value: p.count }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">
                  {(pipeline || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: "10px", color: "#F8FAFC", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {(pipeline || []).map((p, i) => (<span key={p.status} className="flex items-center gap-1.5 text-[11px] text-[#64748B]"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{p.status}</span>))}
            </div>
          </ChartCard>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6">
            <h3 className="text-[14px] font-semibold text-[#0F172A] mb-5 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#C8A96B]" />Satisfacción del Cliente</h3>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[{ label: "Servicio", value: feedbackStats?.avgService }, { label: "Respuesta", value: feedbackStats?.avgResponsiveness }, { label: "Calidad", value: feedbackStats?.avgQuality }].map((item) => (
                <div key={item.label} className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                  <div className="text-[28px] font-bold text-[#0F172A] tracking-tight">{item.value ? parseFloat(item.value.toString()).toFixed(1) : "—"}</div>
                  <div className="text-[11px] font-medium text-[#94A3B8] mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C8A96B]/20 flex items-center justify-center"><Award className="w-5 h-5 text-[#C8A96B]" /></div>
                <div><p className="text-[12px] text-[#94A3B8]">Net Promoter Score</p><p className="text-[18px] font-bold text-white">{nps}%</p></div>
              </div>
              <div className="text-right"><p className="text-[11px] text-[#64748B]">{feedbackStats?.totalCount || 0} respuestas</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card overflow-hidden mb-12">
          <div className="p-6 border-b border-[#E2E8F0]/60">
            <h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2"><Users className="w-4 h-4 text-[#2F80ED]" />Candidatos Recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#E2E8F0]/40">{["Candidato", "Rol", "Experiencia", "Estado", "Token", ""].map((h) => (<th key={h} className="text-left py-3 px-5 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{h}</th>))}</tr></thead>
              <tbody>
                {(candidates || []).slice(0, 15).map((c) => (
                  <tr key={c.id} className="border-b border-[#E2E8F0]/30 hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-5"><div className="flex items-center gap-3">{c.avatarUrl ? <img src={c.avatarUrl} alt={c.fullName} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center"><span className="text-white text-[10px] font-bold">{c.fullName.charAt(0)}</span></div>}<span className="text-[13px] font-medium text-[#0F172A]">{c.fullName}</span></div></td>
                    <td className="py-3 px-5 text-[12px] text-[#64748B]">{c.role.replace("_", " ")}</td>
                    <td className="py-3 px-5 text-[12px] text-[#64748B]">{c.experienceYears}y</td>
                    <td className="py-3 px-5"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-5"><code className="text-[10px] font-mono text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded">{c.token}</code></td>
                    <td className="py-3 px-5"><div className="flex items-center gap-2"><button onClick={() => copyToClipboard(evaluationUrl(c.token))} className="p-1.5 text-[#94A3B8] hover:text-[#2F80ED] rounded-lg transition-all">{copiedToken === evaluationUrl(c.token) ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}</button><Link to={`/candidate/${c.token}`} className="p-1.5 text-[#94A3B8] hover:text-[#2F80ED] rounded-lg transition-all"><Link2 className="w-3.5 h-3.5" /></Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string; color: string; sub: string }) {
  return <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-5"><div className="flex items-center justify-between mb-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}10` }}><span style={{ color }}>{icon}</span></div></div><div className="text-[28px] font-bold text-[#0F172A] tracking-tight">{value}</div><div className="text-[11px] font-medium text-[#94A3B8] mt-0.5">{label}</div><div className="text-[10px] text-[#CBD5E1] mt-1">{sub}</div></div>;
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-6"><h3 className="text-[14px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2"><span className="text-[#94A3B8]">{icon}</span>{title}</h3>{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { active: "bg-[#EAF2FF] text-[#2F80ED]", hired: "bg-[#DCFCE7] text-[#166534]", rejected: "bg-[#FEE2E2] text-[#991B1B]", archived: "bg-[#F1F5F9] text-[#64748B]" };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${styles[status] || styles.archived}`}>{status}</span>;
}
