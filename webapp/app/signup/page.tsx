'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup, resendConfirmation, signInWithGoogle, signInWithMicrosoft } from '@/services/auth';
import { Mail, Lock, Loader2, CheckCircle, Eye, EyeOff, Leaf, Shield, ShieldCheck, Users } from 'lucide-react';
import { Smartphone, History } from "lucide-react";
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;
  const strengthColors = ['#B91C1C', '#D97706', '#E0A63A', '#1C7C4D'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErr('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }

    setBusy(true);
    setErr(null);
    const res = await signup(email.trim(), password);
    setBusy(false);

    if (res.success) {
      if (res.needsConfirmation) {
        setShowEmailDialog(true);
      } else {
        router.push('/sites');
      }
    } else {
      setErr(res.error || 'Signup failed');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#254431] via-[#356B43] to-[#254431] text-[#F7F2EA] px-12 xl:px-16 py-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#356B43] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#86A98A] rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/2" />
          
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
              Protect Alberta's
              <span className="block text-[#86A98A] mt-2">
                Natural Heritage
              </span>
            </h1>

            <p className="text-lg leading-relaxed text-[#E4EBE4] max-w-lg">
              Join a community of dedicated stewards tracking and preserving Alberta's protected areas. 
              Create an account to view SAPAA site inspections and naturalness scores.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4 group">
          <div className="mt-1 w-10 h-10 rounded-lg bg-[#356B43] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Smartphone className="w-5 h-5 text-[#86A98A]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Sync With SAPAA in the Field</h3>
            <p className="text-[#E4EBE4] leading-relaxed">
              Sign up to access inspection data collected in the SAPAA mobile app from your browser.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 group">
          <div className="mt-1 w-10 h-10 rounded-lg bg-[#356B43] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <History className="w-5 h-5 text-[#86A98A]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Explore Site History</h3>
            <p className="text-[#E4EBE4] leading-relaxed">
              Browse past visits, notes, and naturalness scores to see how conditions have changed.
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
                Create Account
              </h1>
              <p className="text-lg text-[#7A8075]">
                Join the community of Alberta's environmental stewards.
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
                <span className="px-4 bg-[#F7F2EA] text-sm font-medium text-[#7A8075]">
                  Or sign up with email
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
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-12 py-3.5 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="Create a strong password"
                    required
                    minLength={6}
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
                {password && passwordStrength > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#7A8075]">Password strength</span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: strengthColors[passwordStrength - 1] }}
                      >
                        {strengthLabels[passwordStrength - 1]}
                      </span>
                    </div>
                    <div className="h-2 bg-[#E4EBE4] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength - 1],
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#254431] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="h-5 w-5 text-[#7A8075]" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (err) setErr(null);
                    }}
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-12 py-3.5 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-[#F7F2EA] rounded-r-xl transition-colors"
                  >
                    {showConfirmPassword ? (
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
                className="w-full bg-gradient-to-r from-[#E0A63A] to-[#C76930] hover:from-[#C76930] hover:to-[#E0A63A] text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[#7A8075]">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-bold text-[#356B43] hover:text-[#254431] underline underline-offset-2 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showEmailDialog && (
        <div className="fixed inset-0 bg-[#254431]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">

            <div className="flex items-center justify-center mb-7">
              <div className="flex items-center">
                <div className="bg-[#E4EBE4] rounded-full p-4 z-10">
                  <Mail className="h-8 w-8 text-[#1C7C4D]" strokeWidth={2} />
                </div>
                <div className="bg-[#FEF3E2] rounded-full p-4 -ml-4 shadow-[0_0_0_3px_white]">
                  <ShieldCheck className="h-8 w-8 text-[#D98C30]" strokeWidth={2} />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#254431] text-center mb-2">
              One more step to go
            </h2>
            <p className="text-[#7A8075] text-center leading-relaxed mb-6">
              We've sent a confirmation link to{' '}
              <span className="font-semibold text-[#1E2520]">{email}</span>.{' '}
              After verifying, your account will be reviewed for access.
            </p>
            <div className="flex flex-col gap-3 mb-7">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F0F7F3] border border-[#C8DFD2]">
                <div className="w-7 h-7 rounded-full bg-[#E4EBE4] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#1C7C4D]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E2520]">Account created</p>
                  <p className="text-xs text-[#7A8075]">Your details have been saved.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFFBF3] border border-[#FCE5B8]">
                <div className="w-7 h-7 rounded-full bg-[#FCE5B8] flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#B8711F]">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E2520]">Verify your email</p>
                  <p className="text-xs text-[#7A8075]">Click the link we sent to your inbox.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFFBF3] border border-[#FCE5B8]">
                <div className="w-7 h-7 rounded-full bg-[#FCE5B8] flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#B8711F]">
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E2520]">Admin approval</p>
                  <p className="text-xs text-[#7A8075]">An administrator will review and grant access.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowEmailDialog(false);
                router.push('/login');
              }}
              className="w-full bg-gradient-to-r from-[#E0A63A] to-[#C76930] hover:from-[#C76930] hover:to-[#E0A63A] text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Go to login
            </button>

            <p className="text-center text-xs text-[#7A8075] mt-4">
              Didn't receive an email?{' '}
              
              <button className="text-[#1C7C4D] font-medium hover:underline"
                onClick={async () => {
                  try{
                    await  resendConfirmation(email);
                  } catch (err){
                    console.log(err)
                  }
              }}>
                Resend confirmation
              </button>
            </p>

          </div>
        </div>
      )}
    </div>
  );
}
