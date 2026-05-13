import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    const hashPath = location.pathname.replace("/", "");
    return hashPath === path.replace("#/", "").replace("/", "");
  };

  const navLinkClass = (path: string) =>
    `text-[13px] font-medium transition-colors ${
      isActive(path)
        ? "text-[#2F80ED]"
        : "text-[#64748B] hover:text-[#0F172A]"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-3">
        <div className="max-w-6xl mx-auto glass border border-white/60 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-5 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">G</span>
              </div>
              <span className="text-[14px] font-semibold text-[#0F172A] tracking-tight">
                Gastronom
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#C8A96B]/10 text-[#C8A96B] text-[10px] font-semibold tracking-wider uppercase">
                Select
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-7">
              <Link to="/" className={navLinkClass("/")}>
                Inicio
              </Link>
              <Link to="/evaluate" className={navLinkClass("/evaluate")}>
                Evaluar
              </Link>
              <Link to="/feedback" className={navLinkClass("/feedback")}>
                Feedback
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className={navLinkClass("/dashboard")}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Panel
                  </span>
                </Link>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F1F5F9] rounded-full">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2F80ED] to-[#1D4ED8] flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">G</span>
                    </div>
                    <span className="text-[12px] font-medium text-[#334155]">
                      Admin
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded-lg hover:bg-[#F1F5F9]"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-[12px] font-semibold text-white gradient-blue rounded-lg hover:opacity-90 transition-opacity"
                >
                  Entrar
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-[#E2E8F0] px-5 py-4 space-y-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="block text-[13px] font-medium text-[#64748B]">Inicio</Link>
              <Link to="/evaluate" onClick={() => setMobileOpen(false)} className="block text-[13px] font-medium text-[#64748B]">Evaluar</Link>
              <Link to="/feedback" onClick={() => setMobileOpen(false)} className="block text-[13px] font-medium text-[#64748B]">Feedback</Link>
              {isAuthenticated && (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-[13px] font-medium text-[#64748B]">Panel</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
