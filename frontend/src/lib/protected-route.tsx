'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('user' | 'admin' | 'gatekeeper')[];
}

/**
 * Get the correct dashboard path based on user role
 */
function getDashboardByRole(role: string): string {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'gatekeeper':
            return '/gatekeeper/scan';
        default:
            return '/dashboard';
    }
}

/**
 * Protected Route Wrapper
 * Redirects unauthenticated users to login
 * Redirects users to their correct dashboard if they don't have access
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            // If no user, redirect to login
            if (!user) {
                router.push('/login');
                return;
            }

            // If user role is not allowed, redirect to their correct dashboard
            if (allowedRoles && !allowedRoles.includes(user.role as any)) {
                const correctDashboard = getDashboardByRole(user.role);
                router.push(correctDashboard);
            }
        }
    }, [user, isLoading, router, allowedRoles]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if:
    // 1. No user (will redirect to login)
    // 2. User doesn't have required role (will redirect to their dashboard)
    if (!user || (allowedRoles && !allowedRoles.includes(user.role as any))) {
        return null;
    }

    // User is authenticated and authorized
    return <>{children}</>;
}

