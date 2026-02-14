'use client';

// Temple Smart E-Pass - Add New Temple
// Form to register a new temple in the system

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState } from 'react';
import { adminApi } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import TempleForm from '@/components/admin/TempleForm';

function AddTempleContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (payload: Record<string, unknown>) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await adminApi.createTemple(payload);

            if (res.success) {
                router.push('/admin/temples');
            } else {
                setError(res.message || 'Failed to create temple');
            }
        } catch (err: unknown) {
            console.error('Create temple error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create temple');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout title="Add New Temple" subtitle="Register a temple in the smart crowd management system">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/temples" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Temples
                </Link>

                <TempleForm
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                />
            </div>
        </AdminLayout>
    );
}

export default function AddTemplePage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AddTempleContent />
        </ProtectedRoute>
    );
}
