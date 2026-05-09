from contextlib import asynccontextmanager
import asyncio
from functools import partial
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import ALL models before create_all so SQLAlchemy registers every table
import app.models  # noqa: F401 — side-effect import registers all models

from app.routes import auth, nutrition, depth, food, meals, users
from app.database import Base, engine
from app.services.midas_util import get_midas
from app.services.yolo_util import load_model

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run blocking model loads in thread pool so the event loop isn't blocked
    loop = asyncio.get_event_loop()

    print("⏳ Pre-loading MiDaS model at startup...")
    try:
        await loop.run_in_executor(None, get_midas)
        print("✅ MiDaS ready — first request will be instant")
    except Exception as e:
        print(f"⚠️  MiDaS pre-load failed ({e}) — will retry on first request")

    print("⏳ Pre-loading YOLO model at startup...")
    try:
        await loop.run_in_executor(None, load_model)
        print("✅ YOLO ready — first request will be instant")
    except Exception as e:
        print(f"⚠️  YOLO pre-load failed ({e}) — will retry on first request")

    yield


app = FastAPI(title="NutriScan API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(auth.router)       # /auth/*
app.include_router(depth.router)      # /depth  and  /depth/validate
app.include_router(food.router)       # /food/analyze  /food/result/{id}
app.include_router(nutrition.router)  # /nutrition/foods
app.include_router(meals.router)      # /meals/log  /meals/history  /meals/daily-summary
app.include_router(users.router)      # /goals  (GET + PUT)


@app.get("/")
def root():
    return {"status": "NutriScan API running"}
