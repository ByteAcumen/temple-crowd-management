'use client';

// Auth Context Provider for Temple Smart E-Pass System
// Provides authentication state across the app

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User } from './api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: 'user' | 'gatekeeper' | 'admin') => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = authApi.getUser();
        if (storedUser) {
            setUser(storedUser);
            // Optionally verify token with backend
            authApi.getMe()
                .then(res => {
                    if (res.success && res.data) {
                        setUser(res.data);
                    }
                })
                .catch(() => {
                    // Token expired, clear storage
                    authApi.logout();
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.login({ email, password });
            setUser(response.user);

            // Redirect based on role
            redirectByRole(response.user.role);
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: 'user' | 'gatekeeper' | 'admin' = 'user'
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.register({ name, email, password, role });
            setUser(response.user);

            // Redirect based on role
            redirectByRole(response.user.role);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
        router.push('/login');
    };

    const clearError = () => setError(null);

    const redirectByRole = (role: string) => {
        switch (role) {
            case 'admin':
                router.push('/admin/dashboard');
                break;
            case 'gatekeeper':
                router.push('/gatekeeper/scan');
                break;
            default:
                router.push('/dashboard');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                error,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Higher-Order Component for protected routes
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles?: ('user' | 'gatekeeper' | 'admin')[]
) {
    return function AuthenticatedComponent(props: P) {
        const { user, isLoading, isAuthenticated } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading) {
                if (!isAuthenticated) {
                    router.push('/login');
                } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                    // User doesn't have permission
                    router.push('/unauthorized');
                }
            }
        }, [isLoading, isAuthenticated, user, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-slate-600">Loading...</p>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
