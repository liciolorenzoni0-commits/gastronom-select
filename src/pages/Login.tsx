import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Shield, Sparkles } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

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

        <Card className="border border-[#E2E8F0]/60 shadow-card rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-[#2F80ED]" />
            </div>
            <CardTitle className="text-[16px] font-semibold text-[#0F172A]">
              Iniciar Sesión
            </CardTitle>
            <p className="text-[12px] text-[#94A3B8] mt-1">
              Accede al panel de control y gestión de candidatos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3 h-auto gradient-blue text-white rounded-xl text-[14px] font-semibold hover:shadow-lg hover:shadow-[#2F80ED]/20 transition-all"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              <Shield className="w-4 h-4" />
              Entrar con Kimi
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-[10px] font-medium text-[#CBD5E1] uppercase tracking-wider">
                Seguro
              </span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-[#F8FAFC] rounded-xl">
              <Sparkles className="w-4 h-4 text-[#C8A96B] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Autenticación segura con Kimi AI. Solo el equipo autorizado de Gastronom tiene acceso al panel de control.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">
          &copy; {new Date().getFullYear()} Gastronom Culinary Staffing
        </p>
      </div>
    </div>
  );
}
