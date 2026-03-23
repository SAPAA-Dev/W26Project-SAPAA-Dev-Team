'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Mail, BookOpen } from 'lucide-react';

interface HelpMenuProps {
  onStartTutorial: () => void;
}

export default function HelpMenu({ onStartTutorial }: HelpMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="tutorial-help-btn"
        onClick={() => setOpen((v) => !v)}
        className="bg-[#356B43] hover:bg-[#254431] mt-2 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <HelpCircle className="w-5 h-5" />
        Help
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border-2 border-[#E4EBE4] overflow-hidden z-50">
          {/* Contact Us */}
          <a
            href="mailto:devteams@sapaastewards.com"
            className="flex items-center gap-3 px-4 py-3 text-[#1E2520] hover:bg-[#F7F2EA] transition-colors border-b border-[#E4EBE4]"
            onClick={() => setOpen(false)}
          >
            <Mail className="w-4 h-4 text-[#356B43] flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold">Contact Us</div>
              <div className="text-xs text-[#7A8075]">Send us a message</div>
            </div>
          </a>

          {/* Application Tutorial */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-[#1E2520] hover:bg-[#F7F2EA] transition-colors text-left"
            onClick={() => {
              setOpen(false);
              onStartTutorial();
            }}
          >
            <BookOpen className="w-4 h-4 text-[#356B43] flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold">App Tutorial</div>
              <div className="text-xs text-[#7A8075]">Replay the walkthrough</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
