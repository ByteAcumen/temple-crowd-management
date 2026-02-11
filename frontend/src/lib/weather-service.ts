// Weather Service
// Handles fetching weather data for temple locations

// Mock data generator for now - can be replaced with OpenWeatherMap or similar
const getWeatherCondition = (temp: number) => {
    if (temp > 30) return 'Sunny';
    if (temp > 25) return 'Cloudy';
    if (temp > 20) return 'Rainy';
    return 'Clear';
};

export interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    forecast: { day: string; temp: number; condition: string }[];
}

export const weatherService = {
    // Get current weather for a location
    getWeather: async (lat: number, lng: number): Promise<WeatherData> => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate semi-random deterministic weather based on location
        const seed = lat + lng;
        const temp = 20 + (Math.abs(Math.sin(seed)) * 15); // 20-35 degrees

        return {
            temp: Math.round(temp),
            condition: getWeatherCondition(temp),
            humidity: 60 + Math.round(Math.random() * 20),
            windSpeed: 5 + Math.round(Math.random() * 10),
            forecast: [
                { day: 'Today', temp: Math.round(temp), condition: getWeatherCondition(temp) },
                { day: 'Tomorrow', temp: Math.round(temp - 1), condition: getWeatherCondition(temp - 1) },
                { day: 'Wed', temp: Math.round(temp + 1), condition: getWeatherCondition(temp + 1) },
            ]
        };
    }
};
