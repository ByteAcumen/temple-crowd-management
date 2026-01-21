from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import sys

# --- PATH CONFIGURATION (CRITICAL) ---
# This ensures api.py can find the model in the sibling 'models' folder
# Get the directory where api.py is located (src)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up one level to 'demand-forecasting'
base_dir = os.path.dirname(current_dir)
# Define path to the model
model_path = os.path.join(base_dir, "models", "optimized_temple_brain.pkl")

# Initialize App
app = FastAPI(title="Temple Crowd Prediction AI")

print(f"📂 Looking for model at: {model_path}")

# Load the Brain
try:
    artifacts = joblib.load(model_path)
    model = artifacts["model"]
    le_temple = artifacts["le_temple"]
    le_moon = artifacts["le_moon"]
    features = artifacts["features"]
    print("✅ Model Loaded Successfully!")
except FileNotFoundError:
    print("❌ ERROR: Model file not found!")
    print("Please check if 'optimized_temple_brain.pkl' is inside the 'models' folder.")
    sys.exit(1)

# Define Input Schema
class PredictionRequest(BaseModel):
    temple_name: str
    date_str: str
    temperature: int
    rain_flag: int
    moon_phase: str
    is_weekend: int

    class Config:
        json_schema_extra = {
            "example": {
                "temple_name": "Somnath",
                "date_str": "2025-08-15",
                "temperature": 30,
                "rain_flag": 0,
                "moon_phase": "Normal",
                "is_weekend": 1
            }
        }

@app.post("/predict")
def predict_crowd(data: PredictionRequest):
    try:
        # Preprocessing
        dt = pd.to_datetime(data.date_str)
        
        # Validation
        if data.temple_name not in le_temple.classes_:
            raise HTTPException(status_code=400, detail="Unknown Temple")
        
        t_encoded = le_temple.transform([data.temple_name])[0]
        m_encoded = le_moon.transform([data.moon_phase])[0]
        
        # Feature Engineering
        day_of_year = dt.dayofyear
        is_vacation = 1 if dt.month in [5, 11] else 0
        is_shravan = 1 if dt.month == 8 else 0

        # EXPLICIT FEATURES LIST (Matces Model Expectation)
        features_list = [
            'Temple_Encoded', 'Month', 'Day', 'DayOfWeek', 'DayOfYear',
            'Is_Weekend', 'Is_Vacation', 'Is_Shravan', 
            'Moon_Phase_Encoded', 'Temperature_C', 'Rain_Flag'
        ]

        # Create DataFrame
        input_df = pd.DataFrame([[
            t_encoded, dt.month, dt.day, dt.dayofweek, day_of_year,
            data.is_weekend, is_vacation, is_shravan, 
            m_encoded, data.temperature, data.rain_flag
        ]], columns=features_list)

        # DEBUG: Print DataFrame Info
        print("DEBUG: Model Type:", type(model))
        print("DEBUG: DataFrame Columns:", input_df.columns.tolist())
        print("DEBUG: First Row (Raw):", input_df.values[0])

        # Cast to Float
        input_df = input_df.astype(float)
        
        # BYPASS FEATURE Name Check by using Numpy Array
        # (XGBoost sometimes fails column validation on different versions)
        prediction = int(model.predict(input_df.values)[0])

        # Business Logic
        status = "Normal"
        color = "green"
        if prediction > 80000:
            status = "CRITICAL"
            color = "red"
        elif prediction > 40000:
            status = "High"
            color = "orange"

        return {
            "temple": data.temple_name,
            "date": data.date_str,
            "predicted_visitors": prediction,
            "crowd_status": status,
            "color_code": color
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
