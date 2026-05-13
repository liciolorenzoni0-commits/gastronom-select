import { Link } from "react-router";
import {
  ArrowRight,
  Users,
  Star,
  TrendingUp,
  Award,
  Zap,
  Shield,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EAF2FF] rounded-full mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2F80ED] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#2F80ED] tracking-wide uppercase">
                Acceso Exclusivo
              </span>
            </div>

            <h1 className="text-[40px] md:text-[56px] lg:text-[64px] font-semibold text-[#0F172A] leading-[1.1] tracking-tight">
              La plataforma de
              <br />
              evaluación para los
              <br />
              <span className="text-[#2F80ED]">mejores</span> clientes
              <br />
              <span className="text-[#2F80ED]">de hostelería</span>
            </h1>

            <p className="mt-6 text-[17px] text-[#64748B] leading-relaxed max-w-lg">
              Gastronom Select, el nuevo estándar de contratación para hostelería.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/evaluate"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 gradient-blue text-white rounded-xl text-[14px] font-semibold hover:shadow-lg hover:shadow-[#2F80ED]/20 transition-all"
              >
                Iniciar Evaluación
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/feedback"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-[#334555] rounded-xl text-[14px] font-medium border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-card-hover transition-all"
              >
                Compartir Feedback
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Colocaciones", value: "2,400+", color: "#2F80ED" },
              { icon: Star, label: "Puntaje Prom.", value: "9.4/10", color: "#C8A96B" },
              { icon: TrendingUp, label: "Retención", value: "98%", color: "#22C55E" },
              { icon: Award, label: "Locales Asociados", value: "180+", color: "#8B5CF6" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group bg-white rounded-2xl p-5 border border-[#E2E8F0]/60 shadow-card hover:shadow-card-hover transition-all"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}10` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-[24px] font-semibold text-[#0F172A] tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[12px] text-[#94A3B8] font-medium mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-[11px] font-semibold text-[#2F80ED] tracking-[0.15em] uppercase">
            Por qué Select
          </span>
          <h2 className="text-[32px] md:text-[40px] font-semibold text-[#0F172A] mt-3 tracking-tight">
            Construido para la contratación <span className="text-[#2F80ED]">de precisión</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Zap,
              title: "Evaluación Ultra Rápida",
              desc: "Evalúa candidatos en menos de 3 minutos con puntuación por deslizadores y valores predeterminados inteligentes. Diseñado para operadores ocupados que necesitan velocidad sin sacrificar calidad.",
              color: "#2F80ED",
            },
            {
              icon: BrainCircuit,
              title: "Resúmenes con IA",
              desc: "Nuestro motor analiza puntajes, notas y transcripciones de voz para generar resúmenes ejecutivos con fortalezas, preocupaciones y evaluaciones de ajuste cultural.",
              color: "#8B5CF6",
            },
            {
              icon: Shield,
              title: "Talento Verificado",
              desc: "Cada candidato pasa por una rigurosa verificación que incluye exámenes prácticos, verificación de referencias y cheques de antecedentes antes de llegar a tu bandeja.",
              color: "#22C55E",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-2xl p-7 border border-[#E2E8F0]/60 shadow-card hover:shadow-card-hover transition-all"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${feature.color}10` }}
              >
                <feature.icon
                  className="w-5 h-5"
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="text-[17px] font-semibold text-[#0F172A] mb-2">
                {feature.title}
              </h3>
              <p className="text-[14px] text-[#64748B] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-[#E2E8F0]/60 shadow-card overflow-hidden">
          <div className="p-8 md:p-12">
            <span className="text-[11px] font-semibold text-[#2F80ED] tracking-[0.15em] uppercase">
              El Proceso
            </span>
            <h2 className="text-[28px] md:text-[36px] font-semibold text-[#0F172A] mt-3 tracking-tight">
              Tres pasos hacia tu próxima <span className="text-[#C8A96B]">estrella</span>
            </h2>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Recibe al Candidato",
                  desc: "Obtén un enlace de evaluación único vía WhatsApp o email con el perfil completo del candidato, CV y etiquetas de habilidades.",
                },
                {
                  step: "02",
                  title: "Puntúa y Graba",
                  desc: "Usa deslizadores intuitivos para puntuar competencias. Añade notas de voz para observaciones rápidas. Toma menos de 3 minutos.",
                },
                {
                  step: "03",
                  title: "Resumen con IA",
                  desc: "Recibe un resumen ejecutivo instantáneo con recomendación, fortalezas, preocupaciones y análisis de ajuste cultural.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[32px] font-bold text-[#E2E8F0]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#0F172A] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#64748B] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="gradient-navy rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F80ED]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C8A96B]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-tight">
              ¿Listo para evaluar a
              <br />
              tu próximo <span className="text-[#C8A96B]">candidato?</span>
            </h2>
            <p className="mt-4 text-[15px] text-[#94A3B8] max-w-md mx-auto">
              Ingresa tu token de evaluación para acceder al perfil del candidato y comenzar la valoración.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/evaluate"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#2F80ED] text-white rounded-xl text-[14px] font-semibold hover:bg-[#2563EB] transition-colors"
              >
                Ingresar Token
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/feedback"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-xl text-[14px] font-medium border border-white/20 hover:bg-white/15 transition-colors"
              >
                Compartir Feedback
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0]/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md gradient-blue flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">G</span>
            </div>
            <span className="text-[13px] font-semibold text-[#0F172A]">
              Gastronom
            </span>
            <span className="text-[10px] font-semibold text-[#C8A96B] tracking-wider uppercase">
              Select
            </span>
          </div>
          <span className="text-[12px] text-[#94A3B8]">
            &copy; {new Date().getFullYear()} Gastronom Culinary Staffing. Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
