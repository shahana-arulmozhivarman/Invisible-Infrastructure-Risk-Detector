import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/report", label: "Submit Report" },
    { href: "/map", label: "Live Map" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-[#0F172A] text-white h-16 flex items-center px-6">
        <div className="flex items-center gap-2 mr-8 font-bold text-xl tracking-tight">
          <Activity className="h-6 w-6 text-blue-400" />
          <span>CivicScan</span>
        </div>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-blue-300 ${
                location === link.href ? "text-blue-400" : "text-slate-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
