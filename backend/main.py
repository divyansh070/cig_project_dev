from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(override=True) # Force load variables from .env file overriding shell vars

from database import engine
import models
from routers import auth, events, media, social, ai, notifications, face

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Photography Platform API")

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(media.router)
app.include_router(social.router)
app.include_router(ai.router)
app.include_router(notifications.router)
app.include_router(face.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://cig-project-dev.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Photography Platform API"}
