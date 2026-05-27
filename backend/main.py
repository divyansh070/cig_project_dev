from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv() # Load variables from .env file

from database import engine
import models
from routers import auth, events, media, social, ai, notifications

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Photography Platform API")

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(media.router)
app.include_router(social.router)
app.include_router(ai.router)
app.include_router(notifications.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Photography Platform API"}
