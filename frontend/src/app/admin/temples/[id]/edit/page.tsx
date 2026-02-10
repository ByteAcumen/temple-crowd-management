'use client';

// Temple Smart E-Pass - Edit Temple
// Form to update temple details

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/lib/protected-route';
import { useState, useEffect } from 'react';
import { templesApi, adminApi } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import TempleForm from '@/components/admin/TempleForm';

function EditTempleContent() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [initialData, setInitialData] = useState<any>(null);

    // Fetch existing data
    useEffect(() => {
        async function fetchTemple() {
            try {
                const res = await templesApi.getById(id);
                if (res.success) {
                    setInitialData(res.data);
                } else {
                    setError('Failed to fetch temple details');
                }
            } catch (err) {
                setError('Failed to load temple');
                console.error(err);
            } finally {
                setIsFetching(false);
            }
        }
        if (id) fetchTemple();
    }, [id]);

    const handleSubmit = async (payload: any) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await adminApi.updateTemple(id, payload);

            if (res.success) {
                router.push('/admin/temples');
            } else {
                setError(res.message || 'Failed to update temple');
            }
        } catch (err: any) {
            console.error('Update temple error:', err);
            setError(err.message || 'Failed to update temple');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <AdminLayout title="Edit Temple" subtitle="Update temple in the smart crowd management system">
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Edit Temple" subtitle="Update temple in the smart crowd management system">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/temples" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Temples
                </Link>

                <TempleForm
                    initialData={initialData}
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    isEdit={true}
                />
            </div>
        </AdminLayout>
    );
}

export default function EditTemplePage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <EditTempleContent />
        </ProtectedRoute>
    );
}
