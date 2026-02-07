'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('user' | 'admin' | 'gatekeeper')[];
}

/**
 * Protected Route Wrapper
 * Redirects unauthenticated users to login
 * Redirects unauthorized users to their appropriate dashboard
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

            // If user role is not allowed, redirect to unauthorized page
            if (allowedRoles && !allowedRoles.includes(user.role as any)) {
                router.push('/unauthorized');
            }
        }
    }, [user, isLoading, router, allowedRoles]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                    <p className="text-slate-600">Verifying authentication...</p>
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
