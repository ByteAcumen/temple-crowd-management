'use client';

// Temple Smart E-Pass - Premium Login Page
// Unified login for Devotees, Gatekeepers, and Admins

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Login Mode: 'devotee' (default) or 'staff'
    const [loginMode, setLoginMode] = useState<'devotee' | 'staff'>('devotee');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { login, error: authError, clearError, loginDemo } = useAuth();
    const searchParams = useSearchParams();

    // Handle session expired or redirect messages
    useEffect(() => {
        const sessionError = searchParams.get('session');
        if (sessionError === 'expired') {
            setFormError('Your session has expired. Please log in again.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        if (!email || !password) {
            setFormError('Please enter both email and password');
            return;
        }

        setIsSubmitting(true);
        try {
            // Pass the loginMode to ensure users don't login to wrong portal
            await login(email, password, loginMode);
            // Redirect happens automatically in auth context
        } catch (err: any) {
            setFormError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSwitchMode = (mode: 'devotee' | 'staff') => {
        setLoginMode(mode);
        setFormError(null);
        clearError();
        // Optional: clear inputs when switching for security
        // setEmail(''); 
        // setPassword('');
    };

    return (
        <div className="min-h-screen flex gradient-animated">
            {/* Left Side - Branding & Visuals (Hidden on Mobile) */}
            <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden transition-colors duration-500 ${loginMode === 'devotee' ? 'gradient-dark' : 'bg-slate-900'}`}>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 -left-20 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-float-reverse"></div>
                    {loginMode === 'staff' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/patterns/grid.svg')] opacity-10"></div>
                    )}
                </div>

                <div className="relative z-10 max-w-md text-center stagger-children">
                    <div className="flex justify-center mb-8">
                        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 animate-float">
                            <Logo variant="light" size="lg" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        {loginMode === 'devotee' ? 'Welcome Back,' : 'System Access'}
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-200">
                            {loginMode === 'devotee' ? 'Pilgrim' : 'Authorized Personnel'}
                        </span>
                    </h1>

                    <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                        {loginMode === 'devotee'
                            ? 'Your spiritual journey continues here. Access your E-Passes and skip the queues.'
                            : 'Secure portal for Temple Administrators and Gatekeepers. Unauthorized access is prohibited.'}
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {(loginMode === 'devotee' ?
                            ['✨ Instant Booking', '📱 Digital E-Pass', '🔔 Live Alerts'] :
                            ['🛡️ Secure Enclave', '📊 Real-time Data', '⚡ Fast Actions']
                        ).map((feature, i) => (
                            <span key={i} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-slate-200 text-sm font-medium">
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-white">
                <div className="w-full max-w-md animate-fade-in-up">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Logo className="justify-center" />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
                        <p className="text-slate-500 mt-2">Access your Temple Smart account</p>
                    </div>

                    {/* Role Switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 relative">
                        {/* Sliding Indicator */}
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-spring ${loginMode === 'devotee' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>

                        <button
                            type="button"
                            onClick={() => handleSwitchMode('devotee')}
                            className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 ${loginMode === 'devotee' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Devotee
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('staff')}
                            className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 ${loginMode === 'staff' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Staff Access
                        </button>
                    </div>

                    {/* Error Display */}
                    {(formError || authError) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-shake">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm text-red-600 font-medium">{formError || authError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="password">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${isSubmitting ? 'opacity-80 cursor-wait' : ''
                                } ${loginMode === 'devotee'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/30 hover:shadow-orange-500/40'
                                    : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-slate-900/30 hover:shadow-slate-900/40'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In securely
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-600">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className={`font-bold transition-colors ${loginMode === 'devotee' ? 'text-orange-600 hover:text-orange-700' : 'text-blue-600 hover:text-blue-700'}`}>
                                Create Free E-Pass ID
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
