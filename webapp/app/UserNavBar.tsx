"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X } from "lucide-react";

export default function UserNavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Sites", href: "/sites" },
    { name: "Image Gallery", href: "/gallery" },
    { name: "Logout", href: "/logout", danger: true},
  ];

  return (
    <nav className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 flex items-center justify-between gap-2 relative">

      {/* Hamburger Menu - always visible */}
      <button
        className="p-2 rounded-full transition-all hover:bg-white/20 hover:scale-110"
        title = "user dropdown menu"
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
              } ${item.danger ? "text-[#B91C1C] hover:bg-[#FEE2E2] font-medium" : "text-[#254431]"}`}
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
