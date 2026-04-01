"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Users, MapPin, FileEdit } from "lucide-react";

export default function AdminNavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4 text-[#555]" />, description: "View analytics and stats" },
    { name: "Account Management", href: "/admin/account-management", icon: <Users className="w-4 h-4 text-[#555]" />, description: "Manage user accounts" },
    { name: "Sites", href: "/admin/sites", icon: <MapPin className="w-4 h-4 text-[#555]" />, description: "View and edit all sites" },
    { name: "Form Editor", href: "/admin/form-editor", icon: <FileEdit className="w-4 h-4 text-[#555]" />, description: "Edit inspection forms" },
  ];

  return (
    <nav className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 flex items-center justify-between gap-2 relative">
      {/* Left side - Home button */}
      <Link
        href="/sites"
        className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center transition-all hover:bg-white/10 hover:border-white/40"
      >
        <Home className="w-5 h-5 text-white transition-colors" />
      </Link>
    
      {/* Hamburger Menu - always visible */}
      <button
        className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center gap-[5px] transition-all
        ${menuOpen
            ? 'bg-white/15 border-white/40'
            : 'bg-transparent border-white/25 hover:bg-white/10'
        }`}
        title = "admin dropdown menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {/* Animated hamburger → X */}
        <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
          ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`}
        />
        <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
          ${menuOpen ? 'opacity-0' : ''}`}
        />
        <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-200
          ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`}
        />
      </button>

      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">

            {/* Admin pages */}
            <div className="py-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
                Admin
              </p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors ${
                    pathname === item.href ? 'bg-[#f0efeb]' : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <span className={`text-sm text-[#1a1a1a] ${pathname === item.href ? 'font-semibold' : 'font-medium'}`}>
                      {item.name}
                    </span>
                    <p className="text-xs text-black/40">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </>
      )}
    </nav>
  );
}
