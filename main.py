from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

# Allow requests from your React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://mental-health-score-predictor-fe.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("Mental_Model.pkl")


class InputData(BaseModel):
    age: int = Field(..., ge=15, le=100)

    gender: Literal["Male", "Female", "Other"]
    country: str = Field(..., min_length=2, max_length=100)
    academic_level: str = Field(..., min_length=2, max_length=100)
    most_used_platform: str = Field(..., min_length=2, max_length=100)
    purpose_of_use: str = Field(..., min_length=2, max_length=100)

    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0, le=1000)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)

    stress_level: Literal["Low", "Medium", "High"]


top_countries = [
    "Other",
    "Canada",
    "USA",
    "India",
    "Australia",
    "UK",
    "Germany",
    "France",
    "Spain",
    "Mexico",
    "Turkey",
]


@app.post("/predict")
def predict(data: InputData):
    country_group = data.country if data.country in top_countries else "Other"

    input_row = pd.DataFrame(
        [
            {
                "Age": data.age,
                "Gender": data.gender,
                "Country": data.country,
                "Academic_Level": data.academic_level,
                "Most_Used_Platform": data.most_used_platform,
                "Purpose_Of_Use": data.purpose_of_use,
                "Avg_Daily_Usage_Hours": data.avg_daily_usage_hours,
                "Daily_Unlocks": data.daily_unlocks,
                "Study_Hours": data.study_hours,
                "Physical_Activity_Hours": data.physical_activity_hours,
                "Sleep_Hours_Per_Night": data.sleep_hours_per_night,
                "Stress_Level": data.stress_level,
                "Grouped_Country": country_group,
            }
        ]
    )

    prediction = model.predict(input_row)[0]

    return {"prediction": str(round(float(prediction), 2))}
