import stripe
from database.manager import get_db
from database.models import User
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request
from sqlalchemy.orm import Session

router = APIRouter()

stripe.api_key = "your_stripe_api_key"  # Replace with your actual Stripe API key


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, "your_stripe_webhook_secret")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_email = session["customer_email"]
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            user.is_paying = True
            db.commit()

    return {"status": "success"}
