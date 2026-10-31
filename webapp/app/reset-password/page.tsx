'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Leaf } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type State = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const [state, setState] = useState<State>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session ? 'ready' : 'invalid');
    });
  }, []);

  const onSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();
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
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setErr(error.message || 'Could not update your password. Request a new code.');
      return;
    }
    // Clear the recovery session so the user returns to login with the new password.
    await supabase.auth.signOut();
    setBusy(false);
    setState('done');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E4EBE4] via-[#F7F2EA] to-[#E4EBE4] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#254431] rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-[#86A98A]" strokeWidth={2.5} />
          </div>
          <div className="text-xs font-semibold tracking-[0.15em] uppercase text-[#356B43]">
            SAPAA
          </div>
        </div>

        {state === 'checking' && (
          <div className="flex items-center justify-center py-12 text-[#5B655D]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {state === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E4EBE4] p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#FEE2E2] rounded-full p-3">
                <AlertCircle className="h-8 w-8 text-[#B91C1C]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#254431] mb-2">Link expired</h1>
              <p className="text-[#5B655D] mb-6">
                This session is invalid or has expired. Request a new code.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white font-bold py-4 px-4 rounded-xl transition-all text-center mb-3"
              >
                Request a new code
              </Link>
            <Link
              href="/login"
              className="block w-full bg-[#F7F2EA] hover:bg-[#E4EBE4] text-[#254431] font-semibold py-4 px-4 rounded-xl transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        )}

        {state === 'done' && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E4EBE4] p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#E4EBE4] rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-[#356B43]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#254431] mb-2">Password updated</h1>
            <p className="text-[#5B655D] mb-6">Your password has been changed. Sign in with your new password.</p>
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white font-bold py-4 px-4 rounded-xl transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#254431] mb-3">Set a new password</h1>
              <p className="text-lg text-[#5B655D]">Choose a new password for your account.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#254431] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="h-5 w-5 text-[#5B655D]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (err) setErr(null);
                    }}
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-12 py-3.5 text-[#1E2520] placeholder:text-[#5B655D] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="Enter a new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-[#F7F2EA] rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#5B655D] hover:text-[#1E2520]" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#5B655D] hover:text-[#1E2520]" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#254431] mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="h-5 w-5 text-[#5B655D]" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (err) setErr(null);
                    }}
                    className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-4 py-3.5 text-[#1E2520] placeholder:text-[#5B655D] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                    placeholder="Re-enter your new password"
                    required
                  />
                </div>
              </div>

              {err && (
                <div role="alert" className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#B91C1C] px-4 py-3.5 rounded-xl font-medium">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update password</span>
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 block text-center text-[#5B655D] hover:text-[#254431] transition-colors font-medium"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
