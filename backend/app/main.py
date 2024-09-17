from fastapi import FastAPI

from app.api.stripe import router as stripe_router
from app.api.user import router as user_router

app = FastAPI()

app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])


@app.get("/")
async def root():
    return {"message": "Welcome to the API"}
