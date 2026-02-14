import useSWR from 'swr';
import { liveApi } from '@/lib/api';

// Fetchers
const crowdDataFetcher = async () => {
    const res = await liveApi.getCrowdData();
    if (!res.success) throw new Error("Failed to fetch crowd data");
    return res.data;
};

const templeLiveFetcher = async (templeId: string) => {
    const res = await liveApi.getLiveCrowdData(templeId);
    if (!res.success) throw new Error("Failed to fetch temple live data");
    return res.data;
};

// Check if user has access to live data
function canAccessLiveData(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return false;

        const user = JSON.parse(userStr);
        // Only allow gatekeepers and admins to view live data (Backend restriction)
        return user && (user.role === 'gatekeeper' || user.role === 'admin');
    } catch {
        return false;
    }
}

// Hook for ALL temples (Dashboard)
export function useAllCrowdData() {
    const hasAccess = canAccessLiveData();

    const { data, error, isLoading, mutate } = useSWR(
        hasAccess ? 'all-live-data' : null,
        crowdDataFetcher,
        {
            refreshInterval: hasAccess ? 30000 : 0, // Auto-refresh every 30s if has access
            revalidateOnFocus: hasAccess
        }
    );

    return {
        data,
        isLoading,
        isError: error,
        mutate,
        hasAccess
    };
}

// Hook for SINGLE temple (Details Page)
export function useTempleLiveData(templeId: string | null) {
    const hasAccess = canAccessLiveData();

    const { data, error, isLoading, mutate } = useSWR(
        templeId && hasAccess ? `live-data-${templeId}` : null,
        () => templeLiveFetcher(templeId!),
        {
            refreshInterval: hasAccess ? 15000 : 0, // Faster refresh for specific page if has access
            revalidateOnFocus: hasAccess
        }
    );

    return {
        liveData: data,
        isLoading,
        isError: error,
        mutate,
        hasAccess
    };
}
