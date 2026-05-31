import os
from twilio.rest import Client

TWILIO_ACCOUNT_SID = "AC5c341e82eea084fc37852a717a858532"
TWILIO_AUTH_TOKEN = "949c06cdb88a4db10127b15735328c7c"
TWILIO_PHONE_NUMBER = "+14582306619"
TARGET_PHONE_NUMBER = "+919314050474"

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

try:
    print("Initiating test call...")
    twiml_script = """
    <Response>
        <Say voice="Polly.Joanna" language="en-US">
            Hello! The Twilio Authentication is now working perfectly!
        </Say>
    </Response>
    """
    call = client.calls.create(
        twiml=twiml_script,
        to=TARGET_PHONE_NUMBER,
        from_=TWILIO_PHONE_NUMBER
    )
    print(f"SUCCESS! Call SID: {call.sid}")
except Exception as e:
    print(f"FAILED! Error: {e}")
