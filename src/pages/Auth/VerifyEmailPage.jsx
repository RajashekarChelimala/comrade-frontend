import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmailApi, resendVerificationApi } from '../../services/otpApi.js';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const initialEmail = query.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await verifyEmailApi({ email, code });
      setMessage('Email verified. You can now log in.');
      navigate('/login');
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
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
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md px-8 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-slate-50">Verify your email</h1>
        <p className="subtle-text mb-4">
          We&apos;ve sent a 6-digit code to your Gmail. Enter it below to activate your Comrade account.
        </p>
        <form onSubmit={handleVerify} className="mt-2 flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium text-slate-200">
            Verification code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="input mt-1"
              placeholder="6-digit code"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <button type="button" onClick={handleResend} className="mt-4 text-sm text-brand-400 hover:text-brand-300">
          Resend Code
        </button>
      </div>
    </main>
  );
}

export default VerifyEmailPage;
