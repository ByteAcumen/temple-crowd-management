from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List

app = FastAPI(title="Temple Demand Forecasting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "demand-forecasting"}

@app.post("/forecast")
def get_forecast(data: dict):
    # Mock forecast for now
    return {
        "prediction": 150,
        "confidence": 0.85,
        "trend": "increasing"
    }


@app.post("/predict")
def predict(data: dict):
    """Backend-compatible crowd prediction endpoint."""
    # Mock prediction - can be replaced with LSTM model inference
    import random
    base = 500 + random.randint(0, 1500)
    pred = base * (1.5 if data.get("is_weekend", 0) else 1)
    status = "CRITICAL" if pred > 8000 else "HIGH" if pred > 5000 else "Normal"
    return {
        "predicted_visitors": int(pred),
        "crowd_status": status,
    }


@app.post("/chat")
def chat(data: dict):
    """RAG-style chat endpoint for bot queries."""
    query = data.get("query", "")
    context = data.get("context", "")
    return {
        "answer": f"Based on current data: {context}. For your question '{query[:50]}...', please visit during off-peak hours for the best experience."
    }
