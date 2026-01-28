from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
import os
import sys
from sentence_transformers import SentenceTransformer, util
from typing import Optional

# --- PATH CONFIGURATION (CRITICAL) ---
# This ensures api.py can find the model in the sibling 'models' folder
# Get the directory where api.py is located (src)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up one level to 'demand-forecasting'
base_dir = os.path.dirname(current_dir)
# Define path to the model
# Define path to the model
model_path = os.path.join(base_dir, "models", "optimized_temple_brain.pkl")

# --- RAG CONFIGURATION ---
print("🧠 Loading Semantic RAG Model (all-MiniLM-L6-v2)...")
try:
    rag_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ RAG Model Loaded!")
    
    # Knowledge Base
    FAQ_DATA = [
        {"q": "What are the temple timings?", "a": "The temple opens at 6:00 AM and closes at 10:00 PM. Aarti is at 7:00 AM and 7:00 PM."},
        {"q": "Can I bring my bag or luggage?", "a": "No, large bags are not allowed inside for security. Please use the cloakroom near Gate 1."},
        {"q": "Is there a dress code?", "a": "Yes, modest traditional clothing is requested. Shoulders and knees must be covered."},
        {"q": "How to book a ticket?", "a": "You can book a free Darshan slot via this app. Just go to the 'Book Slot' tab."},
        {"q": "Is photography allowed?", "a": "Photography is prohibited inside the main sanctum, but allowed in the outer complex."},
        {"q": "Where is parking?", "a": "Free parking is available 500m from the main entrance near the distinct bus stand."},
        {"q": "Is there a wheelchair service?", "a": "Yes, wheelchairs are available at the help desk for seniors and differently-abled devotees."},
        {"q": "Can I donate online?", "a": "Yes, donations can be made securely through the official website or app under 'Donations'."},
        {"q": "Is it crowded? What is the current status?", "a": "You can see the real-time crowd numbers below."}
    ]
    # compute embeddings once
    faq_questions = [item['q'] for item in FAQ_DATA]
    faq_embeddings = rag_model.encode(faq_questions, convert_to_tensor=True)
    print(f"✅ Indexed {len(FAQ_DATA)} FAQs for Semantic Search.")

except Exception as e:
    print(f"⚠️ Warning: RAG Model failed to load: {e}")
    rag_model = None



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

# --- RAG ENDPOINT ---
class ChatRequest(BaseModel):
    query: str
    context: Optional[str] = ""

@app.post("/chat")
def chat_bot(data: ChatRequest):
    if not rag_model:
        return {"answer": "AI Brain is currently offline. Please try again later."}
    
    # 1. Embed Query
    query_embedding = rag_model.encode(data.query, convert_to_tensor=True)
    
    # 2. Semantic Search (Cosine Similarity)
    # util.cos_sim returns a tensor [[score1, score2, ...]]
    hits = util.cos_sim(query_embedding, faq_embeddings)[0]
    
    # 3. Find Best Match
    best_score = float(hits.max())
    best_idx = int(hits.argmax())
    
    print(f"🔎 Query: '{data.query}' | Best Match: '{FAQ_DATA[best_idx]['q']}' | Score: {best_score:.4f}")
    
    # Threshold for "I don't know"
    if best_score < 0.35:
        response_text = "I'm sorry, I don't have information about that specific query. Please ask the help desk."
    else:
        response_text = FAQ_DATA[best_idx]['a']
    
    # 4. Append Live Context if pertinent
    if data.context:
        response_text += f"\n\n(Live Update: {data.context})"
        
    return {"answer": response_text, "score": best_score}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
