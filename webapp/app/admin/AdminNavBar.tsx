"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X } from "lucide-react";

export default function AdminNavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Account Management", href: "/admin/account-management" },
    { name: "Sites", href: "/admin/sites" },
  ];

  return (
    <nav className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 flex items-center justify-between relative">
      {/* Left side - Home button */}
      <Link
        href="/sites"
        className="flex items-center p-2 rounded-full transition-all hover:bg-white/20 hover:scale-110"
      >
        <Home className="w-5 h-5 text-white hover:text-[#F7F2EA] transition-colors" />
      </Link>

      {/* Hamburger Menu - always visible */}
      <button
        className="p-2 rounded-full transition-all hover:bg-white/20 hover:scale-110"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-6 top-full mt-2 w-48 bg-white text-[#254431] rounded-lg shadow-lg flex flex-col overflow-hidden z-50">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 hover:bg-[#F7F2EA] ${
                pathname === item.href ? "font-semibold" : "font-normal"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
