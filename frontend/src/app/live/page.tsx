'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LiveRedirect() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (user && (user.role === 'admin')) {
                router.replace('/admin/live');
            } else if (user && user.role === 'gatekeeper') {
                router.replace('/gatekeeper');
            } else {
                router.replace('/login');
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
    );
}
