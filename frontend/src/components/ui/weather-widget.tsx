'use client';

import { WeatherData } from '@/lib/weather-service';

interface WeatherWidgetProps {
    weather: WeatherData | null | undefined;
    isLoading: boolean;
}

export function WeatherWidget({ weather, isLoading }: WeatherWidgetProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                    <div className="h-6 bg-slate-100 rounded w-24"></div>
                    <div className="h-8 bg-slate-100 rounded w-8"></div>
                </div>
                <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            </div>
        );
    }

    if (!weather) return null;

    const getWeatherIcon = (condition: string) => {
        switch (condition.toLowerCase()) {
            case 'sunny': return '☀️';
            case 'cloudy': return '☁️';
            case 'rainy': return '🌧️';
            case 'clear': return '🌙';
            default: return '🌤️';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>🌦️</span> Weather Forecast
            </h3>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-4xl font-bold text-slate-900">
                        {weather.temp}°<span className="text-xl text-slate-500">C</span>
                    </div>
                    <p className="text-slate-600 font-medium">{weather.condition}</p>
                </div>
                <div className="text-6xl animate-bounce-slow">
                    {getWeatherIcon(weather.condition)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Humidity</p>
                    <p className="text-slate-700 font-semibold">{weather.humidity}%</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Wind</p>
                    <p className="text-slate-700 font-semibold">{weather.windSpeed} km/h</p>
                </div>
            </div>

            <div className="space-y-3">
                {weather.forecast.map((day, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-t border-slate-50 first:border-0">
                        <span className="text-slate-500 font-medium w-20">{day.day}</span>
                        <span className="flex-1 flex items-center gap-2 justify-center">
                            <span>{getWeatherIcon(day.condition)}</span>
                            <span className="text-slate-600">{day.condition}</span>
                        </span>
                        <span className="font-bold text-slate-900">{day.temp}°</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
