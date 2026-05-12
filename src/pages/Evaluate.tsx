import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Search, ArrowRight, AlertCircle, Fingerprint } from "lucide-react";

export default function Evaluate() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const candidateQuery = trpc.candidate.getByToken.useQuery(
    { token: token.trim() },
    { enabled: false, retry: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token.trim()) {
      setError("Please enter an evaluation token");
      return;
    }
    try {
      const result = await candidateQuery.refetch();
      if (result.data) {
        navigate(`/candidate/${token.trim()}`);
      } else {
        setError("Candidate not found. Please check your token.");
      }
    } catch {
      setError("Candidate not found. Please check your token.");
    }
  };

  const demoTokens = [
    { token: "chef-elena-2026", name: "Elena V.", role: "Sous Chef" },
    { token: "chef-marcus-2026", name: "Marcus C.", role: "Executive Chef" },
    { token: "pastry-sophie-2026", name: "Sophie L.", role: "Pastry Chef" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-16 px-6">
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0]/60 shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF2FF] flex items-center justify-center mx-auto mb-5">
              <Fingerprint className="w-6 h-6 text-[#2F80ED]" />
            </div>
            <h1 className="text-[24px] font-semibold text-[#0F172A] tracking-tight">
              Enter Evaluation Token
            </h1>
            <p className="text-[14px] text-[#64748B] mt-2">
              Input your unique token to access the candidate profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(""); }}
                placeholder="e.g., chef-elena-2026"
                className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/20 focus:border-[#2F80ED] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#EF4444] text-[13px] px-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={candidateQuery.isLoading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 gradient-blue text-white rounded-xl text-[14px] font-semibold hover:shadow-lg hover:shadow-[#2F80ED]/20 transition-all disabled:opacity-50"
            >
              {candidateQuery.isLoading ? "Searching..." : "Access Profile"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick Access */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold text-[#94A3B8] tracking-[0.1em] uppercase text-center mb-4">
            Quick Access
          </p>
          <div className="space-y-2.5">
            {demoTokens.map((demo) => (
              <button
                key={demo.token}
                onClick={() => {
                  setToken(demo.token);
                  setError("");
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  token === demo.token
                    ? "border-[#2F80ED] bg-[#EAF2FF] shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                    : "border-[#E2E8F0]/60 bg-white shadow-card hover:shadow-card-hover hover:border-[#CBD5E1]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[12px] font-bold">
                    {demo.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A]">
                    {demo.name}
                  </p>
                  <p className="text-[12px] text-[#94A3B8]">{demo.role}</p>
                </div>
                <span className="text-[11px] font-mono text-[#CBD5E1]">
                  {demo.token}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
