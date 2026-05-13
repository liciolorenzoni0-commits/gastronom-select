import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Lock, Shield, Eye, EyeOff, Sparkles } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.password.login.useMutation({
    onSuccess: () => {
      window.location.href = "/#/dashboard";
    },
    onError: (err) => {
      setError(err.message || "Contraseña incorrecta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Ingresa tu contraseña");
      return;
    }
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 relative">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2F80ED]/20">
            <span className="text-white text-[20px] font-bold">G</span>
          </div>
          <h1 className="text-[22px] font-semibold text-[#0F172A] tracking-tight">
            Gastronom <span className="text-[#C8A96B]">Select</span>
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1">
            Acceso exclusivo para equipo interno
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E2E8F0]/60 shadow-card rounded-2xl">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-[#2F80ED]" />
              </div>
              <h2 className="text-[16px] font-semibold text-[#0F172A]">
                Iniciar Sesion
              </h2>
              <p className="text-[12px] text-[#94A3B8] mt-1">
                Ingresa la contrasena de administrador
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1.5">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Tu contrasena"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/10 transition-all pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl">
                  <p className="text-[12px] text-[#991B1B] font-medium">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3 gradient-blue text-white rounded-xl text-[14px] font-semibold hover:shadow-lg hover:shadow-[#2F80ED]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Shield className="w-4 h-4" />
                {loginMutation.isPending ? "Entrando..." : "Entrar al Panel"}
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[10px] font-medium text-[#CBD5E1] uppercase tracking-wider">
            Seguro
          </span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        <div className="flex items-start gap-2.5 p-3 bg-white border border-[#E2E8F0]/60 rounded-xl shadow-sm">
          <Sparkles className="w-4 h-4 text-[#C8A96B] mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Acceso protegido con contrasena. Solo el equipo autorizado de
            Gastronom tiene acceso al panel de control.
          </p>
        </div>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">
          &copy; {new Date().getFullYear()} Gastronom Culinary Staffing
        </p>
      </div>
    </div>
  );
}
