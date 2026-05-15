import { useState, useRef } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Briefcase,
  Plus,
  FileText,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Upload,
  Check,
  AlertTriangle,
} from "lucide-react";

const ROLE_OPTIONS = [
  { value: "chef", label: "Chef Ejecutivo" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "manager", label: "Gerente de Restaurante" },
  { value: "waiter", label: "Camarero Senior" },
  { value: "bartender", label: "Jefe de Bar" },
  { value: "host", label: "Maître d'Hotel" },
];

const ROLE_LABELS: Record<string, string> = {
  chef: "Chef Ejecutivo",
  sous_chef: "Sous Chef",
  manager: "Gerente",
  waiter: "Camarero",
  bartender: "Bartender",
  host: "Maître",
};

export default function JobPostings() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [expandedRanking, setExpandedRanking] = useState(false);

  // Job form state
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("chef");
  const [requiredYears, setRequiredYears] = useState(3);
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // CV upload state
  const [uploadingCandidateId, setUploadingCandidateId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: jobs, isLoading: jobsLoading } = trpc.job.list.useQuery();
  const { data: candidates } = trpc.candidate.list.useQuery();
  const { data: ranking, isLoading: rankingLoading } = trpc.upload.rankCandidates.useQuery(
    { jobPostingId: selectedJobId! },
    { enabled: !!selectedJobId }
  );

  const createJob = trpc.job.create.useMutation({
    onSuccess: () => {
      utils.job.list.invalidate();
      setShowCreate(false);
      resetForm();
    },
  });

  const uploadCv = trpc.upload.uploadCv.useMutation({
    onSuccess: () => {
      utils.candidate.list.invalidate();
      utils.upload.rankCandidates.invalidate();
      setUploadingCandidateId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const resetForm = () => {
    setTitle("");
    setRole("chef");
    setRequiredYears(3);
    setRequiredSkills([]);
    setDescription("");
    setSkillInput("");
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (s: string) => {
    setRequiredSkills(requiredSkills.filter((sk) => sk !== s));
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createJob.mutate({
      title: title.trim(),
      role: role as "chef" | "sous_chef" | "manager" | "waiter" | "bartender" | "host",
      requiredSkills,
      requiredYears,
      description: description.trim() || undefined,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, candidateId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Solo archivos PDF");
      return;
    }

    setUploadingCandidateId(candidateId);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCv.mutate({
        candidateId,
        base64Pdf: base64,
        jobPostingId: selectedJobId || undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const selectedJob = jobs?.find((j) => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#0F172A]" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
              Puestos & <span className="text-[#C8A96B]">Ranking de CVs</span>
            </h1>
            <p className="text-[12px] text-[#64748B]">
              Define requisitos de puestos, sube CVs y genera ranking de match
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left: Job List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#2F80ED]" />
                Puestos Activos
              </h2>
              <button
                onClick={() => { setShowCreate(!showCreate); setSelectedJobId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 gradient-blue text-white rounded-lg text-[11px] font-semibold"
              >
                {showCreate ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showCreate ? "Cerrar" : "Nuevo"}
              </button>
            </div>

            {showCreate && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-5">
                <h3 className="text-[13px] font-semibold text-[#0F172A] mb-4">Crear Puesto</h3>
                <form onSubmit={handleCreateJob} className="space-y-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titulo del puesto"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#2F80ED]"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#2F80ED]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div>
                    <label className="text-[11px] text-[#64748B]">Anos de exp. requeridos</label>
                    <input
                      type="number"
                      value={requiredYears}
                      onChange={(e) => setRequiredYears(parseInt(e.target.value) || 0)}
                      min={0}
                      max={30}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#2F80ED]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#64748B]">Habilidades requeridas</label>
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                        placeholder="Ej: Cocina molecular"
                        className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#2F80ED]"
                      />
                      <button type="button" onClick={handleAddSkill} className="px-3 py-2 bg-[#F1F5F9] rounded-xl text-[#475569] text-[12px] font-medium">
                        + Agregar
                      </button>
                    </div>
                    {requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {requiredSkills.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-[#EAF2FF] text-[#2F80ED] rounded-lg text-[11px]">
                            {s}
                            <button type="button" onClick={() => handleRemoveSkill(s)} className="text-[#2F80ED] hover:text-[#1E40AF]">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripcion del puesto y requisitos adicionales..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] focus:outline-none focus:border-[#2F80ED] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={createJob.isPending || !title.trim()}
                    className="w-full py-2.5 gradient-blue text-white rounded-xl text-[13px] font-semibold disabled:opacity-50"
                  >
                    {createJob.isPending ? "Creando..." : "Crear Puesto"}
                  </button>
                </form>
              </div>
            )}

            {/* Job list */}
            {jobsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#2F80ED]" /></div>
            ) : !jobs || jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 p-8 text-center">
                <Briefcase className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-[13px] text-[#64748B]">No hay puestos creados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedJobId === job.id
                        ? "bg-[#EAF2FF] border-[#2F80ED] shadow-sm"
                        : "bg-white border-[#E2E8F0]/60 hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[13px] font-semibold text-[#0F172A]">{job.title}</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{ROLE_LABELS[job.role]}</p>
                      </div>
                      {selectedJobId === job.id ? (
                        <ChevronUp className="w-4 h-4 text-[#2F80ED]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                      )}
                    </div>
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(job.requiredSkills as string[]).slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-md text-[10px]">{s}</span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#94A3B8] rounded-md text-[10px]">+{job.requiredSkills.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: CV Upload & Ranking */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload CV Section */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-5">
              <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-[#2F80ED]" />
                Subir CVs
                {selectedJob && (
                  <span className="text-[11px] font-normal text-[#64748B]">
                    (Se analizaran contra: {selectedJob.title})
                  </span>
                )}
              </h2>

              {!candidates || candidates.length === 0 ? (
                <p className="text-[12px] text-[#94A3B8]">Primero crea candidatos en el Dashboard</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {candidates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAF2FF] flex items-center justify-center text-[12px] font-bold text-[#2F80ED]">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#0F172A]">{c.fullName}</p>
                          <p className="text-[11px] text-[#94A3B8]">
                            {ROLE_LABELS[c.role]} {c.matchScore !== null ? `· Match: ${c.matchScore}%` : "· Sin CV"}
                          </p>
                        </div>
                      </div>
                      <div>
                        {c.cvText ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#DCFCE7] text-[#166534] rounded-lg text-[10px] font-medium">
                            <Check className="w-3 h-3" /> CV cargado
                          </span>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf"
                              onChange={(e) => c.id && handleFileUpload(e, c.id)}
                              className="hidden"
                            />
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 gradient-blue text-white rounded-lg text-[11px] font-medium hover:shadow-md transition-all">
                              {uploadingCandidateId === c.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Subir CV
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ranking Section */}
            {selectedJobId && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card overflow-hidden">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRanking(!expandedRanking)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#0F172A]" />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-semibold text-[#0F172A]">
                        Ranking de Match
                      </h2>
                      {selectedJob && (
                        <p className="text-[11px] text-[#64748B]">
                          {selectedJob.title} · {ROLE_LABELS[selectedJob.role]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ranking && ranking.length > 0 && (
                      <span className="px-2 py-1 bg-[#EAF2FF] text-[#2F80ED] rounded-lg text-[11px] font-semibold">
                        {ranking.length} candidatos
                      </span>
                    )}
                    {expandedRanking ? (
                      <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                    )}
                  </div>
                </div>

                {expandedRanking && (
                  <div className="px-5 pb-5">
                    {rankingLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-[#2F80ED]" />
                      </div>
                    ) : !ranking || ranking.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-[#CBD5E1] mx-auto mb-3" />
                        <p className="text-[13px] text-[#64748B]">
                          Sube CVs de candidatos para generar el ranking
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ranking.map((r, idx) => (
                          <div
                            key={r.candidateId}
                            className={`p-4 rounded-xl border transition-all ${
                              idx === 0
                                ? "bg-[#FEF9C3] border-[#FDE68A]"
                                : idx === 1
                                ? "bg-[#F8FAFC] border-[#E2E8F0]"
                                : idx === 2
                                ? "bg-[#FFF7ED] border-[#FED7AA]"
                                : "bg-white border-[#F1F5F9]"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {/* Rank badge */}
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                                  idx === 0
                                    ? "bg-[#C8A96B] text-white"
                                    : idx === 1
                                    ? "bg-[#94A3B8] text-white"
                                    : idx === 2
                                    ? "bg-[#CD7F32] text-white"
                                    : "bg-[#F1F5F9] text-[#64748B]"
                                }`}
                              >
                                {idx + 1}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[13px] font-semibold text-[#0F172A]">
                                    {r.candidateName}
                                  </h4>
                                  {idx === 0 && (
                                    <Award className="w-4 h-4 text-[#C8A96B]" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#94A3B8]">
                                  {ROLE_LABELS[r.role]}
                                  {r.yearsFound ? ` · ${r.yearsFound} anos exp.` : ""}
                                </p>
                              </div>

                              {/* Score */}
                              <div className="text-right">
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className={`text-[22px] font-bold ${
                                      r.score >= 80
                                        ? "text-[#22C55E]"
                                        : r.score >= 60
                                        ? "text-[#F59E0B]"
                                        : "text-[#EF4444]"
                                    }`}
                                  >
                                    {r.score}
                                  </span>
                                  <span className="text-[11px] text-[#94A3B8]">/100</span>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    r.score >= 80
                                      ? "bg-[#DCFCE7] text-[#166534]"
                                      : r.score >= 60
                                      ? "bg-[#FEF9C3] text-[#854D0E]"
                                      : "bg-[#FEE2E2] text-[#991B1B]"
                                  }`}
                                >
                                  {r.score >= 80
                                    ? "Match Alto"
                                    : r.score >= 60
                                    ? "Match Medio"
                                    : "Bajo Match"}
                                </span>
                              </div>
                            </div>

                            {/* Score bar */}
                            <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${r.score}%`,
                                  background:
                                    r.score >= 80
                                      ? "linear-gradient(90deg, #22C55E, #4ADE80)"
                                      : r.score >= 60
                                      ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                                      : "linear-gradient(90deg, #EF4444, #F87171)",
                                }}
                              />
                            </div>

                            {/* Skills matched */}
                            <div className="flex flex-wrap gap-1">
                              {r.skillMatches.slice(0, 5).map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#DCFCE7] text-[#166534] rounded-md text-[10px]"
                                >
                                  <Check className="w-2.5 h-2.5" /> {s}
                                </span>
                              ))}
                              {r.skillGaps.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEE2E2] text-[#991B1B] rounded-md text-[10px]"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" /> {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
