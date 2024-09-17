from api.stripe.router import router as stripe_router
from api.user.router import router as user_router
from fastapi import FastAPI

app = FastAPI()

app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
