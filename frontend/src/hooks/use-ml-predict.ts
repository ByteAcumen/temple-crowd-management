'use client';

// ML Prediction Hook - Connect to trained crowd prediction model
// Endpoint: POST http://localhost:8002/predict

import { useState, useCallback } from 'react';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8002';

// Request payload matching the ML API
interface PredictionRequest {
    temple_id: string;
    date: string;           // YYYY-MM-DD format
    day_of_week: number;    // 0=Monday, 6=Sunday
    month: number;          // 1-12
    is_holiday: boolean;
    is_weekend: boolean;
    weather_condition?: string;
    special_event?: string;
}

// Response from ML API
interface PredictionResponse {
    temple_id: string;
    predicted_visitors: number;
    confidence: number;
    status: 'GREEN' | 'ORANGE' | 'RED';
    recommendation: string;
}

interface UseMLPredictReturn {
    predict: (request: PredictionRequest) => Promise<PredictionResponse>;
    predictBatch: (requests: PredictionRequest[]) => Promise<PredictionResponse[]>;
    isLoading: boolean;
    error: string | null;
    lastPrediction: PredictionResponse | null;
}

export function useMLPredict(): UseMLPredictReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);

    // Single prediction
    const predict = useCallback(async (request: PredictionRequest): Promise<PredictionResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${ML_API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`ML API error: ${response.status}`);
            }

            const data = await response.json();

            // Normalize response
            const result: PredictionResponse = {
                temple_id: request.temple_id,
                predicted_visitors: data.predicted_visitors || data.prediction || 0,
                confidence: data.confidence || 0.85,
                status: getStatusFromVisitors(data.predicted_visitors || data.prediction || 0),
                recommendation: data.recommendation || getRecommendation(data.predicted_visitors || 0),
            };

            setLastPrediction(result);
            return result;
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to get prediction';
            setError(errorMsg);

            // Return fallback prediction
            return {
                temple_id: request.temple_id,
                predicted_visitors: 500, // Default
                confidence: 0.5,
                status: 'GREEN',
                recommendation: 'ML service unavailable. Showing estimated data.',
            };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Batch predictions for multiple temples
    const predictBatch = useCallback(async (requests: PredictionRequest[]): Promise<PredictionResponse[]> => {
        setIsLoading(true);
        setError(null);

        try {
            // Try batch endpoint first
            const response = await fetch(`${ML_API_URL}/predict/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ predictions: requests }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.predictions || [];
            }

            // Fallback: make individual requests
            const results = await Promise.all(
                requests.map(req => predict(req))
            );
            return results;
        } catch (err: any) {
            setError(err.message || 'Batch prediction failed');

            // Return fallback predictions
            return requests.map(req => ({
                temple_id: req.temple_id,
                predicted_visitors: 500,
                confidence: 0.5,
                status: 'GREEN' as const,
                recommendation: 'ML service unavailable',
            }));
        } finally {
            setIsLoading(false);
        }
    }, [predict]);

    return {
        predict,
        predictBatch,
        isLoading,
        error,
        lastPrediction,
    };
}

// Helper: Determine status from visitor count
function getStatusFromVisitors(visitors: number, capacity: number = 5000): 'GREEN' | 'ORANGE' | 'RED' {
    const percentage = (visitors / capacity) * 100;
    if (percentage > 95) return 'RED';
    if (percentage > 85) return 'ORANGE';
    return 'GREEN';
}

// Helper: Generate recommendation text
function getRecommendation(visitors: number): string {
    if (visitors > 4500) {
        return 'High crowd expected. Consider booking for early morning or evening slots.';
    }
    if (visitors > 3000) {
        return 'Moderate crowd expected. Plan your visit accordingly.';
    }
    return 'Low crowd expected. Great time to visit!';
}

export default useMLPredict;
