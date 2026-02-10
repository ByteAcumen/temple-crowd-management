from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Temple Crowd Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "crowd-detection"}

@app.post("/detect")
async def detect_crowd(file: UploadFile = File(...)):
    # Mock detection for now
    return {
        "count": 42,
        "density": "moderate",
        "heatmap": "mock_heatmap_url"
    }
