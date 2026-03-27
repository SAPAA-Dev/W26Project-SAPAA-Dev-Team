"use client";

import { logout } from "@/services/auth";
import { usePathname } from "next/navigation";
import { Mail, LogOut, BadgeInfo, Images, House, ShieldUser} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

import React, { useState, Suspense, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';




async function getCurrentUser(): Promise<{ email: string; role: string; name: string; avatar: string} | null> {
  try {
    const supabase = createClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('No session or session error');
      return null;
    }
    
    const email = session.user.email ?? '';
    const role = session.user.user_metadata?.role ?? 'steward';
    const name  = session.user.user_metadata?.full_name ?? '';
    const avatar = session.user.user_metadata?.avatar_url ?? '';
    console.log(session.user)
    
    return {
      email,
      role,
      name,
      avatar
    };
  } catch (error) {
    return null;
  }
}


export default function UserNavBar() {
    const [currentUser, setCurrentUser] = useState<{ email: string; role: string; name:string; avatar:string } | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [forceTutorial, setForceTutorial] = useState(false);

    const handleStartTutorial = useCallback(() => {
    setForceTutorial(false);
    setTimeout(() => setForceTutorial(true), 50);
    }, []);

    const handleTutorialFinish = useCallback(() => {
    setForceTutorial(false);
    }, []);

    const router = useRouter();

    useEffect(() => {
    const fetchUser = async () => {
        setUserLoading(true);
        try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        } catch (err) {
        setCurrentUser(null);
        } finally {
        setUserLoading(false);
        }
    };
    fetchUser();
    }, []);


  return (
        <div className="relative mt-4">
        <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Open menu"
            className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center gap-[5px] transition-all
            ${menuOpen
                ? 'bg-white/15 border-white/40'
                : 'bg-transparent border-white/25 hover:bg-white/10'
            }`}
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
            {/* Backdrop — closes menu on outside click */}
            <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
            />

            <div className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">

                {/* Admin section — only for admins */}
                {currentUser?.role === 'admin' && (
                <div className="py-1.5 border-b border-black/[0.07]">
                    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
                    Admin
                    </p>
                    <button
                    onClick={() => { setMenuOpen(false); router.push('/admin/dashboard'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
                    >
                    <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
                        <ShieldUser className="w-4 h-4 text-[#555]" />
                    </span>
                    <div className="text-left">
                    <span className="text-sm font-medium text-[#1a1a1a]">Admin</span>
                    <p className="text-xs text-black/40">Go to admin dashboard</p>
                    </div>
                    
                    </button>
                    </div>
                    )}
                    <div className="py-1.5 border-b border-black/[0.07]">
                    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
                        Pages
                    </p>
                    <button
                    onClick={() => { setMenuOpen(false); router.push('/sites'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
                    >
                        
                    <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
                        <House className="w-4 h-4 text-[#555]" />
                    </span>
                    <div className="text-left">
                    <span className="text-sm font-medium text-[#1a1a1a]">Home</span>
                    <p className="text-xs text-black/40">Go to Homepage</p>
                    </div>
                    </button>
                    <button
                    onClick={() => { setMenuOpen(false); router.push('/gallery'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
                    >
                    <span className="w-8 h-8 rounded-lg bg-[#f0efeb] flex items-center justify-center flex-shrink-0">
                        <Images className="w-4 h-4 text-[#555]" />
                    </span>
                    <div className="text-left">
                    <span className="text-sm font-medium text-[#1a1a1a]">Image gallery</span>
                    <p className="text-xs text-black/40">Go to gallery</p>
                    </div>
                    </button>
                </div>


                {/* Help section */}
                <div className="py-1.5 border-b border-black/[0.07]">
                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-black/30 px-4 pt-2 pb-1">
                    Help
                </p>
                <button
                    onClick={() => { setMenuOpen(false); handleStartTutorial(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-[#eef4fb] flex items-center justify-center flex-shrink-0">
                    <BadgeInfo className="w-4 h-4 text-[#2a6db5]" />
                    </span>
                    <div className="text-left">
                    <p className="text-sm font-medium text-[#1a1a1a]">App tutorial</p>
                    <p className="text-xs text-black/40">Replay the walkthrough</p>
                    </div>
                </button>
                <a
                    href="mailto:support@example.com"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f5f3] transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-[#eef4fb] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-[#2a6db5]" />
                    </span>
                    <div className="text-left">
                    <p className="text-sm font-medium text-[#1a1a1a]">Contact us</p>
                    <p className="text-xs text-black/40">Send us a message</p>
                    </div>
                </a>
                </div>

                {/* Logout */}
                <div className="py-1.5">
                <button
                    onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fdf0f0] transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-[#fdf0f0] flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4 text-[#c0392b]" />
                    </span>
                    <span className="text-sm font-medium text-[#c0392b]">Logout</span>
                </button>
                </div>

            </div>
            </>
        )}
        </div>
  );
}

