from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from datetime import datetime, timedelta

app = FastAPI(
    title="Crowd Forecasting Service",
    description="LSTM and Prophet-based crowd forecasting API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ForecastRequest(BaseModel):
    temple_id: str
    days: int = 7

class ForecastResponse(BaseModel):
    temple_id: str
    predictions: List[Dict[str, float]]
    model_used: str
    accuracy_metrics: Dict[str, float]

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "service": "crowd-forecasting",
        "models": ["LSTM", "Prophet"]
    }

# Generate Forecast
@app.post("/forecast", response_model=ForecastResponse)
async def forecast_crowd(request: ForecastRequest):
    """
    Generate crowd forecast for next N days
    """
    try:
        # TODO: Implement LSTM/Prophet forecasting
        # For now, return mock predictions
        predictions = []
        base_time = datetime.now()
        
        for i in range(request.days * 24):  # Hourly predictions
            predictions.append({
                "timestamp": (base_time + timedelta(hours=i)).isoformat(),
                "predicted_count": 800 + (i * 10) % 500,  # Mock data
                "lower_bound": 700 + (i * 10) % 400,
                "upper_bound": 900 + (i * 10) % 600
            })
        
        return ForecastResponse(
            temple_id=request.temple_id,
            predictions=predictions,
            model_used="LSTM",
            accuracy_metrics={
                "mae": 45.3,
                "rmse": 92.1,
                "mape": 12.5
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Train Model
@app.post("/train")
async def train_model():
    """
    Trigger model retraining
    """
    # TODO: Implement training pipeline
    return {
        "message": "Training started",
        "status": "in_progress"
    }

# Get Model Info
@app.get("/models")
async def list_models():
    """
    List available forecasting models
    """
    return {
        "models": [
            {
                "name": "LSTM",
                "version": "1.0",
                "accuracy": {"mae": 45.3, "rmse": 92.1}
            },
            {
                "name": "Prophet",
                "version": "1.0",
                "accuracy": {"mae": 52.1, "rmse": 105.3}
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
