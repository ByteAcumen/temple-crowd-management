import useSWR from 'swr';
import { weatherApi } from '@/lib/api';
import { weatherService, WeatherData } from '@/lib/weather-service';

// Fetcher function that chains the API calls
const weatherFetcher = async (templeId: string) => {
    // 1. Get location coordinates (or use default)
    const res = await weatherApi.getForTemple(templeId);
    if (!res.success || !res.data) {
        throw new Error("Could not fetch location");
    }

    // 2. Get weather for those coordinates
    const { lat, lng } = res.data;
    return weatherService.getWeather(lat, lng);
};

export function useWeather(templeId: string | null) {
    const { data, error, isLoading } = useSWR<WeatherData>(
        templeId ? `weather-${templeId}` : null,
        () => weatherFetcher(templeId!)
    );

    return {
        weather: data,
        isLoading,
        isError: error
    };
}
