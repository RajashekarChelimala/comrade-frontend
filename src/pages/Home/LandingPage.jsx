import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function LandingPage() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-50 selection:bg-brand-500/30">
            {/* Background Gradients */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />

            <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white shadow-lg shadow-brand-500/20">
                        C
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-100">Comrade</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="rounded-full bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-white hover:shadow-xl active:scale-95"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center lg:py-32">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-slate-300">Secure & Encrypted Messaging</span>
                </div>

                <h1 className="mt-8 max-w-4xl text-5xl font-bold tracking-tight text-white lg:text-7xl">
                    Connect with true <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-500">Comrades</span> anywhere.
                </h1>

                <p className="mt-6 max-w-2xl text-lg text-slate-400">
                    Experience a new era of messaging. Fast, secure, and designed for genuine connections.
                    No algorithms, just you and your people.
                </p>

                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                    <Link
                        to="/register"
                        className="group relative flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-8 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-500 hover:shadow-brand-500/40 active:scale-95"
                    >
                        Create Account
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                    <Link
                        to="/login"
                        className="flex h-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 px-8 text-base font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
                    >
                        Login to existing
                    </Link>
                </div>

                <div className="mt-24 grid w-full max-w-4xl gap-8 sm:grid-cols-3">
                    {[
                        { title: 'Real-time', desc: 'Instant message delivery with Socket.io' },
                        { title: 'Secure', desc: 'End-to-end encryption for your privacy' },
                        { title: 'Simple', desc: 'No clutter, just pure communication' },
                    ].map((item) => (
                        <div key={item.title} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-left transition-all hover:border-slate-700 hover:bg-slate-900/60">
                            <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default LandingPage;
