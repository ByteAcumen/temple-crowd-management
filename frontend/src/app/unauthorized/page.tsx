'use client';

// 403 Unauthorized Page - Temple Smart E-Pass
// Displayed when user attempts to access a route without proper role

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function UnauthorizedPage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center gradient-animated p-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="card p-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">
                        Access Denied
                    </h1>
                    <p className="text-slate-600 mb-6">
                        You don&apos;t have permission to access this page.
                        {user && (
                            <span className="block mt-2 text-sm">
                                Your role: <span className="font-semibold text-orange-600">{user.role}</span>
                            </span>
                        )}
                    </p>

                    {/* Actions */}
                    <div className="space-y-3">
                        {user ? (
                            <>
                                <Link
                                    href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'gatekeeper' ? '/gatekeeper/scan' : '/dashboard'}
                                    className="block w-full btn-primary py-3"
                                >
                                    Go to My Dashboard
                                </Link>
                                <button
                                    onClick={logout}
                                    className="block w-full btn-secondary py-3"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link href="/login" className="block w-full btn-primary py-3">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>

                {/* Security Notice */}
                <p className="mt-6 text-sm text-slate-500">
                    🔒 This access attempt has been logged for security purposes.
                </p>
            </div>
        </div>
    );
}
