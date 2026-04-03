import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Wifi } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/report", label: "Submit Report" },
    { href: "/map", label: "Live Map" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col infra-bg relative">
      {/* Animated bridge structure overlay — top of page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Bridge cable spans — subtle horizontal lines */}
        <div className="absolute top-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
        <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/8 to-transparent" />
        {/* Glass building columns — vertical lines on sides */}
        <div className="absolute top-0 bottom-0 left-[8%] w-px bg-gradient-to-b from-blue-500/12 via-blue-400/6 to-transparent" />
        <div className="absolute top-0 bottom-0 left-[14%] w-px bg-gradient-to-b from-blue-500/8 via-blue-400/4 to-transparent" />
        <div className="absolute top-0 bottom-0 right-[8%] w-px bg-gradient-to-b from-blue-500/12 via-blue-400/6 to-transparent" />
        <div className="absolute top-0 bottom-0 right-[14%] w-px bg-gradient-to-b from-blue-500/8 via-blue-400/4 to-transparent" />
        {/* City skyline silhouette at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 city-skyline opacity-40" />
        {/* Top-right glow — city light */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-700/12 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-blue-900/60 bg-[#0F172A]/95 backdrop-blur-md text-white h-16 flex items-center px-6">
        <div className="flex items-center gap-2.5 mr-10 font-bold text-xl tracking-tight">
          <div className="relative">
            <Activity className="h-6 w-6 text-blue-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          <span className="text-white">CivicScan</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                location === link.href
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-400 font-medium">Live</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
