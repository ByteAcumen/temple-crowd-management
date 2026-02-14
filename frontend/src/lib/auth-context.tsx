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
    login: (email: string, password: string, expectedRole?: 'devotee' | 'staff', redirectPath?: string) => Promise<void>;
    loginDemo: () => void;
    register: (name: string, email: string, password: string, role?: 'user' | 'gatekeeper' | 'admin') => Promise<void>;
    updateProfile: (data: { name?: string; email?: string; phone?: string; city?: string; state?: string }) => Promise<void>;
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

    // ... (useEffect remains same)

    const loginDemo = () => {
        const demoUser: User = {
            id: 'demo-admin',
            _id: 'demo-admin',
            name: 'Demo Admin',
            email: 'demo@temple.com',
            role: 'admin',
            isSuperAdmin: true
        };
        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', 'demo-token');
        router.push('/admin/dashboard');
    };

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            const storedUser = authApi.getUser();
            const token = localStorage.getItem('token');

            if (storedUser && token) {
                console.log('🔐 AuthContext: Found stored user', storedUser.role);
                // Set user from localStorage immediately for fast UI
                setUser(storedUser);

                try {
                    // Verify token with backend and get fresh user data
                    const res = await authApi.getMe();
                    if (res.success && res.data) {
                        console.log('✅ AuthContext: Backend verified user', res.data.role);
                        // Update both state AND localStorage with fresh data
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    }
                } catch (err) {
                    // API unavailable - keep using stored user data
                    // Only logout if token is explicitly invalid (401)
                    console.warn('⚠️ AuthContext: Could not verify session with server, using stored data', err);
                }
            } else {
                console.log('ℹ️ AuthContext: No stored session found');
            }
            setIsLoading(false);
        };

        checkSession();
    }, []);

    const login = async (email: string, password: string, expectedRole?: 'devotee' | 'staff', redirectPath?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.login({ email, password });
            const userRole = response.user.role;

            // Validate role matches the selected login portal
            if (expectedRole === 'devotee' && userRole !== 'user') {
                // Staff member trying to login via devotee portal
                authApi.logout(); // Clear the token
                throw new Error('This account is registered as ' +
                    (userRole === 'admin' ? 'Admin' : 'Gatekeeper') +
                    '. Please use the Staff Access tab.');
            }

            if (expectedRole === 'staff' && userRole === 'user') {
                // Devotee trying to login via staff portal
                authApi.logout(); // Clear the token
                throw new Error('This account is registered as Devotee. Please use the Devotee tab.');
            }

            setUser(response.user);

            // Redirect based on role or custom path
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                redirectByRole(response.user.role);
            }
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

    const updateProfile = async (data: { name?: string; email?: string; phone?: string; city?: string; state?: string }) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.updateProfile(data);
            if (response.success && response.data) {
                const updatedUser = { ...user, ...response.data } as User;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
            }
        } catch (err: any) {
            setError(err.message || 'Profile update failed');
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
                loginDemo,
                register,
                updateProfile,
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
