import logging
import os

import stripe
import stripe.error
from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi import Depends
from fastapi import Request
from sqlalchemy.orm import Session

from database.manager import get_db
from database.models import PayingUser

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    logger.info("Received Stripe webhook")

    load_dotenv()

    # Set your secret key. Remember to switch to your live secret key in production.
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    if stripe.api_key is None:
        logger.error("STRIPE_SECRET_KEY environment variable is not set")
        raise ValueError("STRIPE_SECRET_KEY environment variable is not set")

    stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if stripe_webhook_secret is None:
        logger.error("STRIPE_WEBHOOK_SECRET environment variable is not set")
        raise ValueError("STRIPE_WEBHOOK_SECRET environment variable is not set")

    # Get the event data from the webhook
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=stripe_webhook_secret,
        )
        logger.info(f"Constructed Stripe event: {event['type']}")
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload: {e}")
        return {"error": "Invalid payload"}
    except stripe.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature: {e}")
        return {"error": "Invalid signature"}

    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        logger.info("Processing checkout.session.completed event")
        session = event["data"]["object"]

        # Retrieve the session to get customer details
        checkout_session = stripe.checkout.Session.retrieve(session["id"])
        customer_email = checkout_session["customer_details"]["email"]
        logger.info(f"Customer email: {customer_email}")

        # Create or update the PayingUser entry
        paying_user = db.query(PayingUser).filter(PayingUser.email == customer_email).first()
        if paying_user:
            logger.info(f"Updating existing user: {customer_email}")
            paying_user.is_paying = True
        else:
            logger.info(f"Creating new paying user: {customer_email}")
            new_paying_user = PayingUser(email=customer_email, is_paying=True)
            db.add(new_paying_user)

        db.commit()
        logger.info("Database updated successfully")

    logger.info("Webhook processing completed")
    return {"success": True}
