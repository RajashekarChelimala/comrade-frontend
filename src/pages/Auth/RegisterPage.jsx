import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFeatureFlags } from '../../context/FeatureFlagsContext.jsx';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const flags = useFeatureFlags();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);

  const registrationEnabled = flags.FEATURE_ENABLE_REGISTRATION !== false;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!registrationEnabled) return;
    setError(null);
    setLoading(true);
    try {
      const payload = { name, email, password };
      if (handle) payload.handle = handle;
      const data = await register(payload);
      setInfo(`Welcome ${data.user.name}. Handle: ${data.user.comradeHandle}, ID: ${data.user.comradeId}`);
      navigate(`/verify-email?email=${encodeURIComponent(data.user.email)}`);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md px-8 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-slate-50">Create your Comrade account</h1>
        <p className="subtle-text mb-4">Use your Gmail address. You&apos;ll verify it with a one-time code.</p>
        {!registrationEnabled && (
          <p className="mb-3 text-sm text-red-400">Registration is temporarily disabled.</p>
        )}
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-200">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium text-slate-200">
            Gmail address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium text-slate-200">
            Handle (optional)
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. rajashekar"
              className="input mt-1"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-400">{info}</p>}
          <button
            type="submit"
            disabled={loading || !registrationEnabled}
            className="btn-primary mt-2 w-full"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="subtle-text mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
