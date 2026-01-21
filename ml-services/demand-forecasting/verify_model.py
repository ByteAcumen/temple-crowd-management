import joblib
import pandas as pd
import os
import sys

# Define Path
current_dir = os.getcwd()
model_path = os.path.join(current_dir, "models", "optimized_temple_brain.pkl")

print(f"🔍 Testing Model at: {model_path}")

if not os.path.exists(model_path):
    print("❌ ERROR: Model file does not exist!")
    sys.exit(1)

try:
    # 1. Load
    artifacts = joblib.load(model_path)
    model = artifacts["model"]
    le_temple = artifacts["le_temple"]
    le_moon = artifacts["le_moon"]
    features = artifacts["features"]
    print("✅ Model File Loaded!")

    # 2. Prepare Dummy Data (Somnath, 2025-08-15)
    # Replicating logic from api.py
    temple = "Somnath"
    date_str = "2025-08-15"
    temp = 32
    rain = 1
    moon = "Normal"
    is_weekend = 0

    t_encoded = le_temple.transform([temple])[0]
    m_encoded = le_moon.transform([moon])[0]
    dt = pd.to_datetime(date_str)
    
    day_of_year = dt.dayofyear
    is_vacation = 1 if dt.month in [5, 11] else 0
    is_shravan = 1 if dt.month == 8 else 0

    input_df = pd.DataFrame([[
        t_encoded, dt.month, dt.day, dt.dayofweek, day_of_year,
        is_weekend, is_vacation, is_shravan, 
        m_encoded, temp, rain
    ]], columns=features)

    # 3. Predict
    prediction = int(model.predict(input_df)[0])
    print(f"🔮 Prediction Test Success!")
    print(f"   Input: {temple} on {date_str}")
    print(f"   Forecast: {prediction} visitors")
    
    # 4. Check Business Logic
    if prediction > 80000:
        print("   Status: CRITICAL (Logic Check OK)")
    else:
        print("   Status: Normal (Logic Check OK)")

except Exception as e:
    print(f"❌ TEST FAILED: {str(e)}")
    sys.exit(1)
