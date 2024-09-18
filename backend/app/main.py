import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.manager import init_db
from routes.auth.router import router as auth_router
from routes.health.router import router as health_router
from routes.stripe.router import router as stripe_router
from routes.user.router import router as user_router

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(health_router, prefix="/api/health", tags=["health"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://iaaiaejgfjimgoiagiahmeiogbiomlaa",  # Allow your Chrome extension
    ],
    allow_credentials=True,  # Enable credentials
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting the application")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info", reload=True)
