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

// Hook for ALL temples (Dashboard)
export function useAllCrowdData() {
    const { data, error, isLoading, mutate } = useSWR(
        'all-live-data',
        crowdDataFetcher,
        {
            refreshInterval: 30000, // Auto-refresh every 30s
            revalidateOnFocus: true
        }
    );

    return {
        data,
        isLoading,
        isError: error,
        mutate
    };
}

// Hook for SINGLE temple (Details Page)
export function useTempleLiveData(templeId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        templeId ? `live-data-${templeId}` : null,
        () => templeLiveFetcher(templeId!),
        {
            refreshInterval: 15000, // Faster refresh for specific page
            revalidateOnFocus: true
        }
    );

    return {
        liveData: data,
        isLoading,
        isError: error,
        mutate
    };
}
