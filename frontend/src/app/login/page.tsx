'use client';

// Temple Smart E-Pass - Enhanced Login Page with Role Tabs
// Unified login for Devotees, Gatekeepers, and Admins

import Link from 'next/link';
import { useState, FormEvent, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type LoginMode = 'devotee' | 'staff';

function LoginContent() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<LoginMode>('devotee');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    const emailInputRef = useRef<HTMLInputElement>(null);

    const { login, loginDemo, error: authError, clearError } = useAuth();

    // Check for session expired and auto-focus email
    useEffect(() => {
        if (searchParams.get('session') === 'expired') {
            setSessionExpired(true);
        }
        // Auto-focus on email input
        emailInputRef.current?.focus();
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSessionExpired(false);
        clearError();

        if (!email || !password) {
            setFormError('Please fill in all fields');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setFormError('Please enter a valid email address');
            return;
        }

        // Password minimum length check
        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanEmail = email.trim().toLowerCase();
            const redirectPath = searchParams.get('from') || undefined;
            await login(cleanEmail, password, mode, redirectPath);
        } catch (err: any) {
            const message = err instanceof Error ? err.message : 'Login failed';
            // Detailed debugging for user
            setFormError(`DEBUG: ${message} | ${JSON.stringify(err)}`);
            // Better error handling for connection issues
            if (message.includes('Cannot connect')) {
                setFormError('⚠️ Cannot connect to server. Please check if the backend is running.');
            } else if (mode === 'staff' && message.toLowerCase().includes('user')) {
                setFormError('This account is registered as a Devotee. Please use the Devotee tab to login.');
            } else if (mode === 'devotee' && (message.toLowerCase().includes('gatekeeper') || message.toLowerCase().includes('admin'))) {
                setFormError('This account is registered as Staff. Please use the Staff Access tab to login.');
            } else {
                setFormError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex gradient-animated relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-1/4 w-2 h-2 bg-orange-500/30 rounded-full animate-float"></div>
                <div className="absolute top-40 right-1/3 w-1 h-1 bg-orange-400/40 rounded-full animate-float-reverse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-orange-600/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-dark items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-500/20 blob animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 blob animate-float-reverse"></div>

                <div className="relative z-10 max-w-md text-center stagger-children">
                    {/* Logo */}
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float transform hover:scale-110 transition-transform">
                            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">Welcome Back!</h1>
                    <p className="text-slate-300 text-lg mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Sign in to access your temple E-Passes, manage bookings, and enjoy hassle-free darshan.
                    </p>

                    {/* Features */}
                    <div className="space-y-4 text-left">
                        {[
                            { icon: '🎫', text: 'Instant QR E-Pass Generation' },
                            { icon: '📊', text: 'Real-time Crowd Monitoring' },
                            { icon: '🔐', text: 'Secure & Private Booking' }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 text-slate-300 animate-fade-in-up transform hover:translate-x-2 transition-transform"
                                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                            >
                                <span className="text-2xl">{feature.icon}</span>
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-md animate-fade-in-up">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox=" 0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900">Temple Smart</span>
                        </Link>
                    </div>

                    {/* Form Card with Glass Effect */}
                    <div className="card p-8 backdrop-blur-sm bg-white/95 shadow-2xl">
                        {/* Role Tabs */}
                        <div className="flex gap-2 p-1.5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl mb-6 shadow-inner">
                            <button
                                onClick={() => {
                                    setMode('devotee');
                                    setFormError(null);
                                    clearError();
                                }}
                                className={`flex-1 px-4 py-3.5 rounded-lg font-medium transition-all duration-300 transform ${mode === 'devotee'
                                    ? 'bg-white text-orange-600 shadow-md scale-105'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <svg className={`w-5 h-5 transition-transform ${mode === 'devotee' ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Devotee
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setMode('staff');
                                    setFormError(null);
                                    clearError();
                                }}
                                className={`flex-1 px-4 py-3.5 rounded-lg font-medium transition-all duration-300 transform ${mode === 'staff'
                                    ? 'bg-white text-orange-600 shadow-md scale-105'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <svg className={`w-5 h-5 transition-transform ${mode === 'staff' ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Staff & Admin
                                </span>
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {mode === 'devotee' ? 'Devotee Sign In' : 'Staff Portal'}
                            </h2>
                            <p className="text-slate-600">
                                {mode === 'devotee'
                                    ? 'Access your E-Passes and bookings'
                                    : 'For Gatekeepers, Admins & Super Admins'
                                }
                            </p>
                        </div>

                        {/* Session Expired Banner */}
                        {sessionExpired && !formError && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-3 animate-slide-down">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Your session has expired. Please sign in again.</span>
                            </div>
                        )}

                        {/* Error Message */}
                        {(formError || authError) && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-shake">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formError || authError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                        <svg className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        ref={emailInputRef}
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-slate-900 hover:border-slate-300"
                                        placeholder={mode === 'devotee' ? 'user@temple.com' : 'admin@temple.com'}
                                        autoComplete="email"
                                        inputMode="email"
                                        required
                                    />
                                    {mode === 'staff' && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Default Admin: <span className="font-mono bg-slate-100 px-1 rounded">admin@temple.com</span> / <span className="font-mono bg-slate-100 px-1 rounded">Admin@123456</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                        <svg className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-14 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-slate-900 hover:border-slate-300"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-orange-600 transition-colors min-h-[44px] min-w-[44px]"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Conditionally show register link only for devotees */}
                        {mode === 'devotee' && (
                            <>
                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-slate-500">New here?</span>
                                    </div>
                                </div>

                                {/* Register Link */}
                                <Link
                                    href="/register"
                                    className="block w-full text-center px-4 py-3.5 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Create Free Account
                                </Link>
                            </>
                        )}

                        {/* Staff Info */}
                        {mode === 'staff' && (
                            <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Staff Portal Access
                                </h4>
                                {/* Account Type Info - Users register as devotees */}
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-xl border border-orange-100">👤</div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Devotee Account</h3>
                                            <p className="text-sm text-slate-600">You are registering as a Devotee.</p>
                                            <p className="text-xs text-orange-600 mt-1">To get a Staff/Admin account, please contact the temple administrator.</p>
                                        </div>
                                    </div>
                                </div>
                                <ul className="text-sm text-slate-600 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                        <span>👮</span>
                                        <span><strong>Gatekeepers:</strong> Scan E-Passes for entry/exit</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                    </li>
                                </ul>
                                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                                    <span>🔐</span>
                                    Staff credentials provided by temple administration only
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>256-bit SSL encrypted</span>
                    </div>

                    {/* Quick Test Credentials (dev only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                            <strong>Test Credentials:</strong>
                            <div className="mt-1 space-y-0.5 font-mono">
                                <div>Admin: admin@temple.com / Admin@123456</div>
                                <div>Gatekeeper: gatekeeper@temple.com / Gate@12345</div>
                                <div>Devotee: user@temple.com / User@12345</div>
                            </div>
                        </div>
                    )}

                    {/* Offline Demo Mode Button */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400 mb-2">Backend issues?</p>
                        <button
                            type="button"
                            onClick={() => {
                                // Direct access to Demo Mode for testing/offline use
                                loginDemo();
                            }}
                            className="text-sm font-medium text-slate-500 hover:text-orange-600 underline decoration-dotted underline-offset-4 transition-colors"
                        >
                            Enter Offline Demo Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main export with Suspense for useSearchParams
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin shadow-lg" />
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
