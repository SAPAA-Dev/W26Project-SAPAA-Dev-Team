'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, signInWithGoogle, signInWithMicrosoft } from '@/services/auth';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, Loader2, Eye, EyeOff, Leaf, MapPin, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/sites');
      }
    };
    checkSession();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (res.success) {
      router.push('/sites');
    } else {
      setErr(res.error || 'Login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErr(null);
    const res = await signInWithGoogle();
    if (!res.success) {
      setErr(res.error || 'Google sign in failed');
      setBusy(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setBusy(true);
    setErr(null);
    const res = await signInWithMicrosoft();
    if (!res.success) {
      setErr(res.error || 'Microsoft sign in failed');
      setBusy(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EBE4] via-[#F7F2EA] to-[#E4EBE4]">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#356B43] via-[#254431] to-[#356B43] text-[#F7F2EA] px-12 xl:px-16 py-12">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#254431] rounded-full blur-3xl opacity-30 -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#86A98A] rounded-full blur-3xl opacity-20 translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
          <div className="mb-8">
              <Image 
                src="/images/sapaa-full-white.png" 
                alt="SAPAA - Stewards helping stewards"
                width={200}
                height={200}
                priority
                className="h-auto w-48"
              />
              <div className="text-sm font-medium text-[#F7F2EA]">
                  Stewards helping stewards
                </div>
            </div>
                
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Welcome back.
              <span className="block text-[#86A98A] mt-2">
              
              </span>
            </h1>

            <p className="text-lg leading-relaxed text-[#E4EBE4] max-w-lg">
              Continue your vital work monitoring Alberta's protected areas. 
              Access your site inspections, track changes over time, and contribute to preserving our natural heritage.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4 group">
              <div className="mt-1 w-10 h-10 rounded-lg bg-[#254431] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-[#86A98A]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Site Insights at a Glance</h3>
                <p className="text-[#E4EBE4] leading-relaxed">
                  View SAPAA inspection reports and naturalness scores for each site, all at one place.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="mt-1 w-10 h-10 rounded-lg bg-[#254431] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-[#86A98A]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">History You Can Browse</h3>
                <p className="text-[#E4EBE4] leading-relaxed">
                  Compare inspections over time to see how conditions and naturalness scores are changing.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm text-[#86A98A]">
            Stewards of Alberta's Protected Areas Association · Alberta, Canada
          </div>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-6 sm:px-8 lg:px-12 py-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#254431] rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#86A98A]" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.15em] uppercase text-[#356B43]">
                  SAPAA
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#254431] mb-3">
                Welcome Back
              </h1>
              <p className="text-lg text-[#7A8075]">
                Sign in to access site inspections.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-[#E4EBE4] rounded-2xl bg-white hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[#1E2520] font-medium group-hover:text-[#254431]">
                  Continue with Google
                </span>
              </button>

              <button
                onClick={handleMicrosoftSignIn}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-[#E4EBE4] rounded-2xl bg-white hover:bg-[#F7F2EA] hover:border-[#86A98A] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span className="text-[#1E2520] font-medium group-hover:text-[#254431]">
                  Continue with Microsoft
                </span>
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#E4EBE4]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#E4EBE4] text-sm font-medium text-[#7A8075]">
                  Or continue with email
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#254431] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Mail className="h-5 w-5 text-[#7A8075]" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (err) setErr(null);
                    }}
                    onKeyPress={handleKeyPress}
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-4 py-3.5 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#254431] mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="h-5 w-5 text-[#7A8075]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (err) setErr(null);
                    }}
                    onKeyPress={handleKeyPress}
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-12 py-3.5 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-[#F7F2EA] rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#7A8075] hover:text-[#1E2520]" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#7A8075] hover:text-[#1E2520]" />
                    )}
                  </button>
                </div>
              </div>

              {err && (
                <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#B91C1C] px-4 py-3.5 rounded-xl font-medium">
                  {err}
                </div>
              )}

              <button
                onClick={(e) => onSubmit(e)}
                disabled={busy}
                className="w-full bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[#7A8075]">
                Don't have an account?{' '}
                <a
                  href="/signup"
                  className="font-bold text-[#356B43] hover:text-[#254431] underline underline-offset-2 transition-colors"
                >
                  Create one
                </a>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-[#E4EBE4]">
              <p className="text-xs text-center text-[#7A8075] leading-relaxed">
                By signing in, you agree to help protect Alberta's natural spaces 
                and contribute to the conservation of our protected areas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}