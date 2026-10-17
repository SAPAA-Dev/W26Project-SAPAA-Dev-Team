'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, Loader2, CheckCircle, ArrowLeft, Leaf } from 'lucide-react';

type Stage = 'email' | 'code' | 'sent';

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const response = await fetch('/auth/password-reset/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErr(body.error || 'Could not send a code. Try again.');
        return;
      }
      if (body.providerRequired) {
        setErr(body.error);
        return;
      }
      setStage('code');
      setNotice(body.message || 'Check your email for the verification code.');
    } catch {
      setErr('Could not send a code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const response = await fetch('/auth/password-reset/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErr(body.error || 'That code is invalid or has expired.');
        return;
      }
      setStage('sent');
    } catch {
      setErr('That code is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = () => {
    setStage('email');
    setCode('');
    setErr(null);
    setNotice(null);
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

        {stage !== 'sent' && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#254431] mb-3">Reset your password</h1>
            <p className="text-lg text-[#7A8075]">
              {stage === 'email'
                ? 'Enter your email and we will send you a verification code.'
                : `Enter the six-digit code sent to ${email}.`}
            </p>
          </div>
        )}

        {stage === 'sent' ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E4EBE4] p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#E4EBE4] rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-[#356B43]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#254431] mb-2">Check your email</h1>
            <p className="text-[#7A8075] mb-6">
              We sent a password reset link to <span className="font-semibold text-[#254431]">{email}</span>.
              Open the link to set a new password.
            </p>
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-[#356B43] to-[#254431] hover:from-[#254431] hover:to-[#356B43] text-white font-bold py-4 px-4 rounded-xl transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {stage === 'email' ? (
              <form onSubmit={requestCode} className="space-y-5">
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
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (err) setErr(null);
                      }}
                      className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-4 py-3.5 text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {err && (
                  <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#B91C1C] px-4 py-3.5 rounded-xl font-medium">
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
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <span>Send verification code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-5">
                {notice && (
                  <div className="bg-[#E4EBE4] border-2 border-[#86A98A] text-[#254431] px-4 py-3.5 rounded-xl font-medium">
                    {notice}
                  </div>
                )}

                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-[#254431] mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                      <KeyRound className="h-5 w-5 text-[#7A8075]" />
                    </div>
                    <input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, ''));
                        if (err) setErr(null);
                      }}
                      className="block w-full rounded-xl border-2 border-[#E4EBE4] bg-white pl-11 pr-4 py-3.5 text-[#1E2520] tracking-[0.5em] placeholder:tracking-normal placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-transparent transition-all"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                {err && (
                  <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#B91C1C] px-4 py-3.5 rounded-xl font-medium">
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
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify code</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={changeEmail}
                    className="font-semibold text-[#356B43] hover:text-[#254431] underline underline-offset-2 transition-colors"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={requestCode}
                    disabled={busy}
                    className="font-semibold text-[#356B43] hover:text-[#254431] underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-[#7A8075] hover:text-[#254431] transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
