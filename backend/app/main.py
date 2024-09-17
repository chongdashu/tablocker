from dotenv import load_dotenv
from fastapi import FastAPI

from routes.auth.router import router as auth_router
from routes.stripe.router import router as stripe_router
from routes.user.router import router as user_router

load_dotenv()

app = FastAPI()

app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
