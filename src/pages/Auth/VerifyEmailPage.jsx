import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmailApi, resendVerificationApi } from '../../services/otpApi.js';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();
  const initialEmail = query.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(location.state?.message || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clear message from state if user types to avoid stale success msg
  function handleInput(setter, val) {
    setter(val);
    if (message && location.state?.message) setMessage(null);
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await verifyEmailApi({ email, code });
      // navigate with success state to login? Or just let them login here?
      // navigate('/login') is fine, but maybe show a success momentarily?
      setMessage('Verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setError(e.message || 'Verification failed');
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    try {
      await resendVerificationApi({ email });
      setMessage('Verification code resent. Please check your inbox.');
    } catch (e) {
      setError(e.message || 'Failed to resend code');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="card w-full max-w-md border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="mt-2 text-sm text-slate-400">
            We've sent a 6-digit confirmation code to <span className="font-medium text-slate-300">{email}</span>
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 border border-emerald-500/20">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleInput(setCode, e.target.value)}
              required
              className="input w-full bg-slate-950/50 text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {/* Hidden email input to keep state but allow editing if needed */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Email Address</label>
              <button type="button" onClick={() => navigate('/register')} className="text-xs text-brand-400 hover:text-brand-300">Change?</button>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInput(setEmail, e.target.value)}
              required
              className="input w-full bg-slate-950/50"
            />
          </div>

          {error && <p className="text-center text-sm text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full py-3 text-base font-semibold shadow-lg shadow-brand-500/20"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-brand-400 hover:text-brand-300 hover:underline"
            >
              Click to resend
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default VerifyEmailPage;
