#!/bin/bash

# Function to generate a random email
generate_random_email() {
  echo "user$(date +%s%N)@example.com"
}

# Set your variables
PRICE_ID=$(grep STRIPE_UNTAB_PRICE_ID .env | cut -d '=' -f2)
SUCCESS_URL="https://example.com/success"
CANCEL_URL="https://example.com/cancel"
STRIPE_SECRET_KEY=$(grep STRIPE_SECRET_KEY .env | cut -d '=' -f2)

# Check if an email argument was passed; if not, generate a random email
if [ -z "$1" ]; then
  CUSTOMER_EMAIL=$(generate_random_email)
else
  CUSTOMER_EMAIL=$1
fi

# Output the email being used
echo "Using email: $CUSTOMER_EMAIL"

# Create a Checkout Session
echo "Creating a Stripe Checkout Session..."

SESSION_RESPONSE=$(curl -X POST https://api.stripe.com/v1/checkout/sessions \
  -u "$STRIPE_SECRET_KEY": \
  -d success_url="$SUCCESS_URL" \
  -d cancel_url="$CANCEL_URL" \
  -d "line_items[0][price]=$PRICE_ID" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d customer_email="$CUSTOMER_EMAIL")

# Log the full response for debugging
echo "Full Response from Stripe:"
echo "$SESSION_RESPONSE"

# Check if the response contains an error
if echo "$SESSION_RESPONSE" | grep -q 'error'; then
  echo "Error creating checkout session: $SESSION_RESPONSE"
  exit 1
fi

# Parse the session ID using jq
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.id')

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" == "null" ]; then
  echo "Failed to create a checkout session"
  exit 1
fi

echo "Checkout Session ID: $SESSION_ID"

# Trigger the checkout.session.completed event
echo "Triggering checkout.session.completed event..."
TRIGGER_RESPONSE=$(stripe trigger checkout.session.completed)

# Log the trigger response
echo "Trigger Response:"
echo "$TRIGGER_RESPONSE"

# Extract the event ID from the trigger response
EVENT_ID=$(echo "$TRIGGER_RESPONSE" | grep -o '"id": "[^"]*' | cut -d'"' -f4)

if [ -z "$EVENT_ID" ]; then
  echo "Failed to extract event ID from trigger response"
  exit 1
fi

echo "Event ID: $EVENT_ID"

# Retrieve and display the full event data
echo "Full event data:"
stripe events retrieve "$EVENT_ID"

# Extract and log the customer email from the event data
EVENT_DATA=$(stripe events retrieve "$EVENT_ID" --expand data.object)
TRIGGERED_EMAIL=$(echo "$EVENT_DATA" | jq -r '.data.object.customer_email')
echo "Triggered customer email: $TRIGGERED_EMAIL"

# Compare the original email with the triggered email
if [ "$CUSTOMER_EMAIL" = "$TRIGGERED_EMAIL" ]; then
  echo "Customer email matched successfully"
else
  echo "Warning: Customer email mismatch"
  echo "Original email: $CUSTOMER_EMAIL"
  echo "Triggered email: $TRIGGERED_EMAIL"
fi

# Add this line to see the full event data
echo "Full event data:"
stripe events retrieve $(echo "$TRIGGER_RESPONSE" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
