from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
from typing import List, Optional
import os

app = FastAPI(
    title="Crowd Detection Service",
    description="YOLOv8-based person detection and crowd counting API",
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
class DetectionRequest(BaseModel):
    camera_id: str
    rtsp_url: Optional[str] = None

class DetectionResponse(BaseModel):
    camera_id: str
    count: int
    timestamp: str
    confidence: float

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "service": "crowd-detection",
        "model": "YOLOv8n",
        "device": "CPU"  # Will be "CUDA" if GPU available
    }

# Detect Persons in Image
@app.post("/detect", response_model=DetectionResponse)
async def detect_crowd(file: UploadFile = File(...)):
    """
    Detect persons in uploaded image
    """
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # TODO: Implement YOLOv8 detection
        # For now, return mock data
        count = 42  # Mock count
        
        return DetectionResponse(
            camera_id="mock-camera",
            count=count,
            timestamp="2026-01-20T10:00:00Z",
            confidence=0.95
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Process RTSP Stream
@app.post("/detect/stream")
async def detect_stream(request: DetectionRequest):
    """
    Process RTSP stream for continuous crowd monitoring
    """
    # TODO: Implement stream processing
    return {
        "message": "Stream processing started",
        "camera_id": request.camera_id,
        "status": "active"
    }

# Get Latest Count
@app.get("/cameras/{camera_id}/count")
async def get_latest_count(camera_id: str):
    """
    Get latest crowd count for a specific camera
    """
    # TODO: Fetch from Redis/Firebase
    return {
        "camera_id": camera_id,
        "count": 35,
        "timestamp": "2026-01-20T10:05:00Z"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
