from api.stripe import router as stripe_router
from api.user import router as user_router
from fastapi import FastAPI

app = FastAPI()

app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])



