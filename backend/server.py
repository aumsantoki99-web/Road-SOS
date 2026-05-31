import logging
import requests as req
import groq
from flask import Flask, request, jsonify
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.twiml.messaging_response import MessagingResponse

# ─────────────────────────────────────────────────────────────────
# CONFIG — Replace with your real keys
# ─────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID  = "AC5c341e82eea084fc37852a717a858532"
TWILIO_AUTH_TOKEN   = "949c06cdb88a4db10127b15735328c7c"
TWILIO_PHONE_NUMBER = "+14582306619"
TARGET_PHONE_NUMBER = "+919314050474"   # AI Operator Voice Call Destination
HELPER_PHONE_NUMBER = "+917359129704"   # Outbound SMS Notification Destination


# Add as many Groq keys here as you want to bypass the 30 RPM limit
GROQ_API_KEYS = [
    "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",
    "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",
    "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",
    "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",
    "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",
]
groq_key_index = 0

def get_next_groq_key():
    global groq_key_index
    key = GROQ_API_KEYS[groq_key_index]
    # Skip placeholder keys
    while "YOUR_" in key:
        groq_key_index = (groq_key_index + 1) % len(GROQ_API_KEYS)
        key = GROQ_API_KEYS[groq_key_index]
    
    groq_key_index = (groq_key_index + 1) % len(GROQ_API_KEYS)
    return key

# Dynamic URLs will be used instead of hardcoded PUBLIC_URL

# ─────────────────────────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = jsonify({"success": True})
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        # Dynamic header echo for maximum CORS compatibility
        req_headers = request.headers.get('Access-Control-Request-Headers')
        if req_headers:
            response.headers['Access-Control-Allow-Headers'] = req_headers
        else:
            response.headers['Access-Control-Allow-Headers'] = '*'
            
        req_method = request.headers.get('Access-Control-Request-Method')
        if req_method:
            response.headers['Access-Control-Allow-Methods'] = req_method
        else:
            response.headers['Access-Control-Allow-Methods'] = '*'
            
        response.headers['Access-Control-Max-Age'] = '86400'
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers['Access-Control-Allow-Headers'] = '*'
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers['Access-Control-Allow-Methods'] = '*'
    return response

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
# Gemini model is now instantiated dynamically per request with rotated keys

# In-memory session store: CallSid -> session data
call_sessions = {}

# ─────────────────────────────────────────────────────────────────
# LANGUAGE MAP  (country code → Twilio language + Polly voice)
# ─────────────────────────────────────────────────────────────────
COUNTRY_LANG = {
    "IN": ("hi-IN",  "Aditi"),      # India — Hindi
    "US": ("en-US",  "Joanna"),     # USA — English
    "GB": ("en-GB",  "Amy"),        # UK  — English
    "FR": ("fr-FR",  "Celine"),     # France — French
    "DE": ("de-DE",  "Marlene"),    # Germany — German
    "JP": ("ja-JP",  "Mizuki"),     # Japan — Japanese
    "CN": ("cmn-CN", "Zhiyu"),      # China — Mandarin
    "ES": ("es-ES",  "Conchita"),   # Spain — Spanish
    "BR": ("pt-BR",  "Vitoria"),    # Brazil — Portuguese
    "AE": ("ar-XA",  "Zeina"),      # UAE — Arabic
}
DEFAULT_LANG  = ("en-US", "Joanna")

# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────
def reverse_geocode(lat, lng):
    """Convert lat/lng → human-readable address + country code."""
    try:
        url = (f"https://nominatim.openstreetmap.org/reverse"
               f"?lat={lat}&lon={lng}&format=json&zoom=18&addressdetails=1")
        resp = req.get(url, headers={"User-Agent": "RoadSOS/1.0 Emergency App"}, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            address      = data.get("display_name", f"{lat}, {lng}")
            country_code = data.get("address", {}).get("country_code", "").upper()
            return address, country_code
    except Exception as e:
        logging.warning(f"Reverse geocode failed: {e}")
    return f"Latitude {lat}, Longitude {lng}", "US"


def get_lang(country_code):
    return COUNTRY_LANG.get(country_code, DEFAULT_LANG)


def build_system_prompt(category, address, lat, lng, country_code, lang_code, name="Unknown", age="Unknown", blood_group="Unknown", conditions="None reported", phone="Unknown", gender="Unknown"):
    """Dynamic system prompt based on emergency type + location + medical ID details."""
    language_name = lang_code.split("-")[0].upper()

    if "police" in category.lower():
        persona = (
            f"You are an AI emergency dispatch assistant calling police on behalf of a citizen in danger named {name} ({age} years old, {gender}). "
            f"Speak ONLY to law enforcement. Prioritize: exact address, that the victim cannot speak, "
            f"and that the threat may still be active. Assume armed if asked."
        )
    elif "ambul" in category.lower():
        persona = (
            f"You are an AI emergency dispatch assistant calling an ambulance service on behalf of a patient named {name} ({age} years old, {gender}). "
            f"Blood group: {blood_group}. Prioritize: exact address, that this was a silent SOS panic button, "
            f"and that they have reported the following medical conditions or history: '{conditions}'."
        )
    else:
        persona = (
            f"You are an AI emergency dispatch assistant calling medical trauma services on behalf of a patient named {name} ({age} years old, {gender}). "
            f"Blood group: {blood_group}. Prioritize: exact address, that the victim triggered a silent SOS panic button, "
            f"and that their reported medical conditions/allergies are: '{conditions}'."
        )

    return f"""
{persona}

CRITICAL RULES — follow them exactly:
1. You must respond ONLY with a valid JSON object. No markdown, no pre-text.
2. The default language is '{lang_code}'. However, if the operator speaks to you in a different language, YOU MUST switch and reply natively in their language.
3. DO NOT output asterisks (*), markdown, or ellipses (...). The voice engine will read them out loud as "dot dot dot". Use plain conversational text and commas only.
4. The victim's location is: {address}
5. The exact GPS coordinates are {lat}, {lng}. If asked for exact GPS, you MUST translate the words "Latitude" and "Longitude" into the caller's language and read the numbers clearly.
6. The victim's medical ID details are:
   - Full Name: {name}
   - Age: {age} years old
   - Gender: {gender}
   - Blood Group: {blood_group}
   - Medical Conditions / Allergies: {conditions}
7. If asked for symptoms/condition: state that this was a silent SOS trigger, but the user has registered these medical conditions: {conditions}.
8. If asked for name, identity or contact details: say the patient's name is {name}, they are {age} years old, and their gender is {gender}. DO NOT speak or disclose their phone number.
9. Never say you are an AI unless directly asked. Just dispatch facts.
10. If the operator says "cut the call", "hang up", "bye", "disconnect", "cut call", "exit", or tells you to stop/terminate, you MUST set "call_status" to "hang_up_call" immediately.

JSON FORMAT REQUIRED:
{{
    "language_code": "<Twilio language code of your reply, e.g., 'gu-IN' for Gujarati, 'hi-IN' for Hindi, 'fr-FR' for French>",
    "reply": "<Your 2-sentence conversational reply in that language>",
    "call_status": "<'keep_call_active' or 'hang_up_call'. Output 'hang_up_call' ONLY if the emergency is resolved AND the operator no longer needs you, OR if they explicitly ask to cut the call. IF THE OPERATOR ASKS YOU NOT TO CUT THE CALL, YOU MUST OUTPUT 'keep_call_active' NO MATTER WHAT.>"
}}
""".strip()

def ask_gemini(system_prompt, conversation_history, user_message):
    """Send conversation to Groq and get a super-fast response with key rotation."""
    messages = [{"role": "system", "content": system_prompt}]
    for m in conversation_history:
        messages.append({"role": "user", "content": m["operator"]})
        messages.append({"role": "assistant", "content": m["agent"]})
    messages.append({"role": "user", "content": user_message})

    total_keys = len(GROQ_API_KEYS)
    for attempt in range(total_keys):
        next_key = get_next_groq_key()
        logging.info(f"🔑 Trying Groq key={next_key[:8]}...")
        try:
            # max_retries=0 prevents the SDK from sleeping for 19s on rate limits, which causes Twilio to timeout.
            client = groq.Groq(api_key=next_key, max_retries=0)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=500,
                temperature=0.5
            )
            logging.info("✅ Success with Groq!")
            return response.choices[0].message.content.strip()
        except Exception as e:
            err = str(e)
            if "429" in err or "rate limit" in err.lower() or "too many requests" in err.lower():
                logging.warning(f"⚠️  Groq key {next_key[:8]} rate-limited. Trying next key...")
                continue
            elif "401" in err or "invalid_api_key" in err.lower():
                logging.warning(f"⚠️  Groq key {next_key[:8]} is INVALID (401). Trying next key...")
                continue
            else:
                logging.error(f"Groq API error: {e}")
                break

    logging.error("❌ All Groq keys exhausted!")
    return "Please hold. Dispatching emergency services to the reported location immediately."


def build_twiml_gather(say_text, lang_code, action_url):
    """Build a TwiML response: Say something, then listen in the correct language."""
    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action=action_url,
        method="POST",
        language=lang_code,
        speech_timeout="auto",
        actionOnEmptyResult="true",
        hints="location, address, ambulance, police, injury, bleeding, help, emergency, trauma"
    )
    
    # Map explicit Google Cloud voices for languages that Twilio Basic/Polly don't support natively
    voice = None
    if "gu-IN" in lang_code: voice = "Google.gu-IN-Standard-A"
    elif "mr-IN" in lang_code: voice = "Google.mr-IN-Standard-A"
    elif "ta-IN" in lang_code: voice = "Google.ta-IN-Standard-A"
    elif "te-IN" in lang_code: voice = "Google.te-IN-Standard-A"
    elif "bn-IN" in lang_code: voice = "Google.bn-IN-Standard-A"
    elif "hi-IN" in lang_code: voice = "Polly.Aditi"
    elif "en-IN" in lang_code: voice = "Polly.Aditi"

    if voice:
        gather.say(say_text, voice=voice, language=lang_code)
        response.append(gather)
        response.say("No response received. Keeping line open. Please speak now.", voice=voice, language=lang_code)
    else:
        # Fallback to Twilio auto-select for generic global languages (like ur-PK, fr-FR)
        gather.say(say_text, language=lang_code)
        response.append(gather)
        response.say("No response received. Keeping line open. Please speak now.", language=lang_code)
    
    return str(response)


# ─────────────────────────────────────────────────────────────────
# ROUTE 1: Flutter app triggers SOS (online mode)
# ─────────────────────────────────────────────────────────────────
@app.route('/trigger-call', methods=['POST'])
def trigger_call():
    try:
        data        = request.json or {}
        lat         = data.get('lat', 0)
        lng         = data.get('lng', 0)
        category    = data.get('category', 'Medical Emergency')
        name        = data.get('name', 'Unknown')
        age         = data.get('age', 'Unknown')
        blood_group = data.get('bloodGroup', 'Unknown')
        conditions  = data.get('conditions', 'None reported')
        phone       = data.get('phone', 'Unknown')
        gender      = data.get('gender', 'Unknown')

        logging.info(f"🚨 SOS received! lat={lat}, lng={lng}, category={category}, patient={name}")

        # Step 1: Reverse geocode to get human address + country
        address, country_code = reverse_geocode(lat, lng)
        lang_code = get_lang(country_code)[0]

        logging.info(f"📍 Address: {address} | Country: {country_code} | Lang: {lang_code}")

        # Step 2: Build the system prompt for this session
        system_prompt = build_system_prompt(category, address, lat, lng, country_code, lang_code, name, age, blood_group, conditions, phone, gender)

        # Step 3: Opening statement with all available details (Name, Age, Gender, Blood Group, Conditions)
        details_list = []
        if name and name != 'Unknown': details_list.append(f"named {name}")
        if age and age != 'Unknown': details_list.append(f"{age} years old")
        if gender and gender != 'Unknown': details_list.append(f"gender is {gender}")
        if blood_group and blood_group != 'Unknown': details_list.append(f"blood group is {blood_group}")
        if conditions and conditions != 'None reported' and conditions != 'Unknown':
            details_list.append(f"medical conditions are: {conditions}")

        if details_list:
            details_phrase = ", ".join(details_list)
            opening = (
                f"Emergency Alert. This is an automated AI assistant calling on behalf of a citizen in critical danger, "
                f"with the following registered details: {details_phrase}. "
                f"The victim is at {address}. "
                f"Please ask me for any information you need to dispatch emergency services immediately."
            )
        else:
            opening = (
                f"Emergency Alert. This is an automated AI assistant calling on behalf of a citizen in critical danger. "
                f"The victim is at {address}. "
                f"Please ask me for any information you need to dispatch emergency services immediately."
            )

        # Step 4: Initiate Twilio call — pass context via URL params
        import urllib.parse
        encoded_category    = urllib.parse.quote(category)
        encoded_address     = urllib.parse.quote(address)
        encoded_name        = urllib.parse.quote(str(name))
        encoded_age         = urllib.parse.quote(str(age))
        encoded_bloodGroup  = urllib.parse.quote(str(blood_group))
        encoded_conditions  = urllib.parse.quote(str(conditions))
        encoded_phone       = urllib.parse.quote(str(phone))
        encoded_gender      = urllib.parse.quote(str(gender))

        tunnel_base = request.host_url.rstrip('/')

        action_url = (f"{tunnel_base}/ai-response?category={encoded_category}&address={encoded_address}"
                      f"&lat={lat}&lng={lng}&lang={lang_code}"
                      f"&name={encoded_name}&age={encoded_age}&bloodGroup={encoded_bloodGroup}&conditions={encoded_conditions}"
                      f"&phone={encoded_phone}&gender={encoded_gender}")

        # Step 4: Initiate Twilio call
        call_sid = None
        call_error = None
        try:
            call = twilio_client.calls.create(
                to=TARGET_PHONE_NUMBER,
                from_=TWILIO_PHONE_NUMBER,
                twiml=build_twiml_gather(
                    opening,
                    lang_code,
                    action_url
                )
            )
            call_sid = call.sid
            logging.info(f"📞 Call initiated! SID: {call_sid}")
        except Exception as e:
            call_error = str(e)
            logging.error(f"Failed to initiate Twilio Call: {e}")

        # Step 5: Send Google Maps SMS to the Helper Phone (+917359129704)
        sms_sent = False
        sms_error = None
        try:
            maps_link = f"https://maps.google.com/?q={lat},{lng}"
            sms_body = f"🚨 RoadSOS ALERT\nLocation: {address}\nGoogle Maps: {maps_link}\nCategory: {category}"
            if name != 'Unknown':
                sms_body += f"\nName: {name}\nAge: {age}\nGender: {gender}\nPhone: {phone}\nBlood Group: {blood_group}\nConditions: {conditions}"

            twilio_client.messages.create(
                body=sms_body,
                to=HELPER_PHONE_NUMBER,
                from_=TWILIO_PHONE_NUMBER
            )
            sms_sent = True
            logging.info("📱 SMS with Maps link sent to helper phone!")
        except Exception as e:
            sms_error = str(e)
            logging.error(f"Failed to send Twilio SMS to helper: {e}")

        if call_sid:
            return jsonify({
                "success": True,
                "call_sid": call_sid,
                "address": address,
                "sms_sent": sms_sent,
                "sms_error": sms_error
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Twilio Call Failed: {call_error}. Please ensure the number {TARGET_PHONE_NUMBER} is verified in your Twilio Console."
            }), 200

    except Exception as e:
        logging.error(f"Error in trigger_call: {e}")
        return jsonify({"success": False, "error": str(e)}), 500



# ─────────────────────────────────────────────────────────────────
# ROUTE 2: AI responds to operator's spoken question
# ─────────────────────────────────────────────────────────────────
@app.route('/ai-response', methods=['POST'])
def ai_response():
    try:
        call_sid      = request.values.get('CallSid', '')
        speech_result = request.values.get('SpeechResult', '').strip()
        category      = request.args.get('category', 'Medical Emergency')
        address       = request.args.get('address', 'Unknown location')
        lat           = request.args.get('lat', 'unknown')
        lng           = request.args.get('lng', 'unknown')
        lang_code     = request.args.get('lang', 'en-US')
        name          = request.args.get('name', 'Unknown')
        age           = request.args.get('age', 'Unknown')
        blood_group   = request.args.get('bloodGroup', 'Unknown')
        conditions    = request.args.get('conditions', 'None reported')
        phone         = request.args.get('phone', 'Unknown')
        gender        = request.args.get('gender', 'Unknown')
        voice         = get_lang("IN")[1] if "IN" in lang_code else "Polly.Joanna"

        logging.info(f"🎤 Operator said: '{speech_result}' | CallSid: {call_sid}")

        # Get or create session
        if call_sid not in call_sessions:
            call_sessions[call_sid] = {
                "history": [],
                "system_prompt": build_system_prompt(category, address, lat, lng, "XX", lang_code, name, age, blood_group, conditions, phone, gender),
                "empty_count": 0,
                "latest_address": address,
                "latest_lat": lat,
                "latest_lng": lng
            }

        session       = call_sessions[call_sid]
        system_prompt = session["system_prompt"]
        history       = session["history"]

        # Check for silence/timeout
        if not speech_result:
            session["empty_count"] = session.get("empty_count", 0) + 1
            if session["empty_count"] >= 2:
                logging.info(f"📴 Hanging up due to repeated silence. CallSid: {call_sid}")
                resp = VoiceResponse()
                resp.say("No response detected. Terminating emergency call. Help has been requested.", language=lang_code)
                resp.hangup()
                return str(resp), 200, {'Content-Type': 'text/xml'}
            
            speech_result = "Can you repeat the location or confirm help is on the way?"
        else:
            session["empty_count"] = 0  # reset on active speech

        # Force programmatic hangup if specific end-call phrases are spoken by the operator (English and Hindi)
        speech_lower = speech_result.lower()
        hangup_phrases = [
            "cut call", "cut the call", "hang up", "disconnect", "bye", "end call", "end the call", "exit", "terminate",
            "call kato", "call kat do", "kata do", "band karo", "band kar do", "khatam"
        ]
        if any(phrase in speech_lower for phrase in hangup_phrases):
            logging.info(f"📴 Programmatic hangup triggered by phrase: '{speech_result}'")
            resp = VoiceResponse()
            
            # Map explicit Google Cloud voices for languages that Twilio Basic/Polly don't support natively
            voice_name = None
            if "gu-IN" in lang_code: voice_name = "Google.gu-IN-Standard-A"
            elif "mr-IN" in lang_code: voice_name = "Google.mr-IN-Standard-A"
            elif "ta-IN" in lang_code: voice_name = "Google.ta-IN-Standard-A"
            elif "te-IN" in lang_code: voice_name = "Google.te-IN-Standard-A"
            elif "bn-IN" in lang_code: voice_name = "Google.bn-IN-Standard-A"
            elif "hi-IN" in lang_code: voice_name = "Polly.Aditi"
            elif "en-IN" in lang_code: voice_name = "Polly.Aditi"

            # Say goodbye natively
            bye_msg = "Goodbye. Terminating the emergency call."
            if "hi-IN" in lang_code or "IN" in lang_code:
                bye_msg = "आपातकालीन कॉल समाप्त की जा रही है।"

            if voice_name:
                resp.say(bye_msg, voice=voice_name, language=lang_code)
            else:
                resp.say(bye_msg, language=lang_code)
                
            resp.hangup()
            return str(resp), 200, {'Content-Type': 'text/xml'}

        # Get AI response (JSON)
        json_response_text = ask_gemini(system_prompt, history, speech_result)
        
        try:
            import json
            data = json.loads(json_response_text)
            ai_reply = data.get("reply", "Dispatching help now.")
            new_lang_code = data.get("language_code", lang_code)
            call_status = data.get("call_status", "keep_call_active")
            logging.info(f"🤖 AI dynamically switched language to: {new_lang_code}")
        except Exception as e:
            logging.error(f"Failed to parse AI JSON: {e}")
            ai_reply = json_response_text.strip()
            new_lang_code = lang_code
            call_status = "keep_call_active"

        logging.info(f"🤖 AI reply: '{ai_reply}'")

        # Save to history
        history.append({"operator": speech_result, "agent": ai_reply})

        # Save session to file for persistent debugging
        import os
        os.makedirs("logs", exist_ok=True)
        with open(f"logs/session_{call_sid}.json", "w", encoding="utf-8") as f:
            json.dump(history, f, indent=4, ensure_ascii=False)

        # Build tunnel base from request
        tunnel_base  = request.host_url.rstrip('/')
        
        # URL encode all fields
        import urllib.parse
        encoded_cat  = urllib.parse.quote(category)
        encoded_addr = urllib.parse.quote(address)
        encoded_name = urllib.parse.quote(name)
        encoded_age  = urllib.parse.quote(age)
        encoded_bg   = urllib.parse.quote(blood_group)
        encoded_cond = urllib.parse.quote(conditions)
        encoded_phone = urllib.parse.quote(phone)
        encoded_gender = urllib.parse.quote(gender)

        # If call_status is hang_up_call, hang up!
        if call_status == "hang_up_call":
            logging.info(f"📴 AI decided to hang up. CallSid: {call_sid}")
            
            # Map explicit Google Cloud voices for languages that Twilio Basic/Polly don't support natively
            voice = None
            if "gu-IN" in new_lang_code: voice = "Google.gu-IN-Standard-A"
            elif "mr-IN" in new_lang_code: voice = "Google.mr-IN-Standard-A"
            elif "ta-IN" in new_lang_code: voice = "Google.ta-IN-Standard-A"
            elif "te-IN" in new_lang_code: voice = "Google.te-IN-Standard-A"
            elif "bn-IN" in new_lang_code: voice = "Google.bn-IN-Standard-A"
            elif "hi-IN" in new_lang_code: voice = "Polly.Aditi"
            elif "en-IN" in new_lang_code: voice = "Polly.Aditi"

            action_url = (f"{tunnel_base}/ai-response?category={encoded_cat}&address={encoded_addr}&lat={lat}&lng={lng}&lang={new_lang_code}"
                          f"&name={encoded_name}&age={encoded_age}&bloodGroup={encoded_bg}&conditions={encoded_cond}"
                          f"&phone={encoded_phone}&gender={encoded_gender}")

            resp = VoiceResponse()
            
            # Put the final message in a Gather so the user can barge in and say "don't cut"
            gather = Gather(
                input="speech",
                action=action_url,
                method="POST",
                language=new_lang_code,
                speech_timeout="auto",
                timeout=3, # Wait 3 seconds after speaking before hanging up
                actionOnEmptyResult="false" # If no speech, fall through to Hangup
            )
            
            if voice:
                gather.say(ai_reply, voice=voice, language=new_lang_code)
            else:
                gather.say(ai_reply, language=new_lang_code)
                
            resp.append(gather)
            resp.hangup()
            return str(resp), 200, {'Content-Type': 'text/xml'}

        # Pass the NEW lang_code in the action URL so the next Twilio <Gather> listens in the new language!
        action_url = (f"{tunnel_base}/ai-response?category={encoded_cat}&address={encoded_addr}&lat={lat}&lng={lng}&lang={new_lang_code}"
                      f"&name={encoded_name}&age={encoded_age}&bloodGroup={encoded_bg}&conditions={encoded_cond}"
                      f"&phone={encoded_phone}&gender={encoded_gender}")

        twiml = build_twiml_gather(ai_reply, new_lang_code, action_url)
        return twiml, 200, {'Content-Type': 'text/xml'}

    except Exception as e:
        logging.error(f"Error in ai_response: {e}")
        resp = VoiceResponse()
        resp.say("System error. Please dispatch emergency services to the last known location.")
        return str(resp), 200, {'Content-Type': 'text/xml'}


# ─────────────────────────────────────────────────────────────────
# ROUTE 3: Incoming SMS (offline fallback via MacroDroid)
# ─────────────────────────────────────────────────────────────────
@app.route('/incoming-sms', methods=['POST'])
def incoming_sms():
    try:
        body        = request.values.get('Body', '').strip()
        from_number = request.values.get('From', 'Unknown')
        logging.info(f"📩 SMS from {from_number}: {body}")

        parts = body.split('|')
        if len(parts) >= 4 and parts[0].upper() == 'SOS':
            lat      = parts[1]
            lng      = parts[2]
            category = parts[3]
            name     = parts[4] if len(parts) >= 8 else 'Unknown'
            age      = parts[5] if len(parts) >= 8 else 'Unknown'
            blood_group = parts[6] if len(parts) >= 8 else 'Unknown'
            conditions  = parts[7] if len(parts) >= 8 else 'None reported'
            phone       = parts[8] if len(parts) >= 10 else 'Unknown'
            gender      = parts[9] if len(parts) >= 10 else 'Unknown'

            address, country_code = reverse_geocode(lat, lng)
            lang_code, _ = get_lang(country_code)

            logging.info(f"📍 Offline SOS! Address: {address} | Patient={name}")

            details_list = []
            if name and name != 'Unknown': details_list.append(f"named {name}")
            if age and age != 'Unknown': details_list.append(f"{age} years old")
            if gender and gender != 'Unknown': details_list.append(f"gender is {gender}")
            if blood_group and blood_group != 'Unknown': details_list.append(f"blood group is {blood_group}")
            if conditions and conditions != 'None reported' and conditions != 'Unknown':
                details_list.append(f"medical conditions are: {conditions}")

            if details_list:
                details_phrase = ", ".join(details_list)
                opening = (
                    f"Emergency Alert. This is an automated AI assistant. An offline SOS was triggered for a patient "
                    f"with the following registered details: {details_phrase}. "
                    f"The patient is at {address}. "
                    f"Please ask me for the information you need."
                )
            else:
                opening = (
                    f"Emergency Alert. This is an automated AI assistant. "
                    f"An offline SOS was triggered. The victim is at {address}. "
                    f"Please ask me for the information you need."
                )

            tunnel_base = request.host_url.rstrip('/')
            import urllib.parse
            encoded_cat        = urllib.parse.quote(category)
            encoded_addr       = urllib.parse.quote(address)
            encoded_name       = urllib.parse.quote(str(name))
            encoded_age        = urllib.parse.quote(str(age))
            encoded_bloodGroup = urllib.parse.quote(str(blood_group))
            encoded_conditions = urllib.parse.quote(str(conditions))
            encoded_phone      = urllib.parse.quote(str(phone))
            encoded_gender     = urllib.parse.quote(str(gender))

            action_url = (f"{tunnel_base}/ai-response?category={encoded_cat}&address={encoded_addr}"
                          f"&lat={lat}&lng={lng}&lang={lang_code}"
                          f"&name={encoded_name}&age={encoded_age}&bloodGroup={encoded_bloodGroup}&conditions={encoded_conditions}"
                          f"&phone={encoded_phone}&gender={encoded_gender}")

            # Wrap Twilio call creation in a try-except block
            try:
                call = twilio_client.calls.create(
                    to=TARGET_PHONE_NUMBER,
                    from_=TWILIO_PHONE_NUMBER,
                    twiml=build_twiml_gather(
                        opening,
                        lang_code,
                        action_url
                    )
                )
                logging.info(f"📞 Offline SOS Call initiated! SID: {call.sid}")
            except Exception as e:
                logging.error(f"Failed to initiate offline Twilio Call: {e}")

            # Wrap Twilio SMS creation in a try-except block
            try:
                maps_link = f"https://maps.google.com/?q={lat},{lng}"
                sms_body = f"🚨 RoadSOS OFFLINE ALERT\nLocation: {address}\nGoogle Maps: {maps_link}\nCategory: {category}"
                if name != 'Unknown':
                    sms_body += f"\nName: {name}\nAge: {age}\nGender: {gender}\nPhone: {phone}\nBlood Group: {blood_group}\nConditions: {conditions}"

                twilio_client.messages.create(
                    body=sms_body,
                    to=HELPER_PHONE_NUMBER,
                    from_=TWILIO_PHONE_NUMBER
                )
                logging.info("📱 Offline SMS with Maps link sent to helper phone!")
            except Exception as e:
                logging.error(f"Failed to send offline Twilio SMS to helper: {e}")

        resp = MessagingResponse()
        resp.message("SOS Received. Help is being dispatched.")
        return str(resp)

    except Exception as e:
        logging.error(f"Error in incoming_sms: {e}")
        return "Error", 500


# ─────────────────────────────────────────────────────────────────
# ROUTE 4: Live Location Updates from Flutter App
# ─────────────────────────────────────────────────────────────────
@app.route('/update-location', methods=['POST'])
def update_location():
    try:
        data = request.json or {}
        call_sid = data.get('call_sid')
        lat = data.get('lat')
        lng = data.get('lng')

        if call_sid and call_sid in call_sessions and lat and lng:
            address, _ = reverse_geocode(lat, lng)
            session = call_sessions[call_sid]
            
            # If address changed, inject a system note so AI knows
            if session.get("latest_address") != address or session.get("latest_lat") != lat:
                session["latest_address"] = address
                session["latest_lat"] = lat
                session["latest_lng"] = lng
                session["history"].append({
                    "operator": "[SYSTEM NOTE: DO NOT REPLY TO THIS]", 
                    "agent": f"The victim's location has updated to Address: {address}. GPS: Lat {lat}, Lng {lng}. Use this if asked."
                })
                logging.info(f"📍 Updated session location for {call_sid} to {address}")
            return jsonify({"success": True, "address": address})
        return jsonify({"success": False, "error": "Invalid session or missing data"}), 400
    except Exception as e:
        logging.error(f"Error in update_location: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/debug-sessions', methods=['GET'])
def debug_sessions():
    return jsonify(call_sessions)


if __name__ == '__main__':
    print("Starting RoadSOS AI Agent Backend...")
    print("Endpoints: /trigger-call  /ai-response  /incoming-sms  /update-location  /debug-sessions")
    app.run(host='0.0.0.0', port=5000, debug=True)
