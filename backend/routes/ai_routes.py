"""
Unified AI routes powered by Groq LLM API.

Includes:
1. Health Check
2. Summarize Guests
3. Generate Vendor Brief
4. Host/Guest Chat
5. Guest Day Suggestions
6. Ops Agent - Handle Issue
7. Planner - Set Basic Details
8. Planner - Search Vendor (AI summarization)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import os
import logging
import json
from datetime import datetime
import smtplib
from email.message import EmailMessage

from groq import Groq

from models.wedding_models import Wedding, Guest, Vendor
from utils.file_utils import get_from_collection, list_collection
from utils.maileroo import send_email

logger = logging.getLogger(__name__)
ai_router = APIRouter(prefix="/api/ai", tags=["AI"])

# -------------------------------------------------------------------
# Groq Setup
# -------------------------------------------------------------------

_groq_client: Optional[Groq] = None
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_TIMEOUT = 30

EMAIL_ADDRESS = os.getenv("ALERT_EMAIL")
EMAIL_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")

def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="GROQ_API_KEY not set")
        _groq_client = Groq(api_key=api_key, timeout=GROQ_TIMEOUT)
    return _groq_client

def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    try:
        client = _get_groq_client()
        res = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=max_tokens,
        )
        return res.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq error: {e}")
        raise HTTPException(status_code=502, detail="AI service unavailable")

# -------------------------------------------------------------------
# Context Builders
# -------------------------------------------------------------------

def _wedding_context(wedding: Wedding) -> str:
    lines = [
        f"Wedding: {wedding.name}",
        f"Location: {wedding.location}",
        f"Dates: {wedding.startDate} to {wedding.endDate}",
    ]
    for day in wedding.days:
        lines.append(f"\nDay {day.dayIndex + 1} ({day.date}):")
        for ev in day.events:
            lines.append(f"- {ev.name} at {ev.time}, Venue: {ev.venue}")
    return "\n".join(lines)

def _guests_context(guests: list[dict]) -> str:
    return json.dumps(guests, indent=2) if guests else "No guests yet."

def _vendors_context(vendors: list[dict]) -> str:
    return json.dumps(vendors, indent=2) if vendors else "No vendors yet."

def _load_wedding_data(wedding_id: str):
    try:
        wedding_data = get_from_collection("wedding.json", "weddings", wedding_id)
        wedding = Wedding(**wedding_data)
    except ValueError:
        raise HTTPException(status_code=404, detail="Wedding not found")

    guests = list_collection("guests.json", "guests", {"weddingId": wedding_id})
    vendors = list_collection("vendors.json", "vendors", {"weddingId": wedding_id})
    return wedding, guests, vendors

# -------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------

class WeddingIdRequest(BaseModel):
    weddingId: str

class ChatRequest(BaseModel):
    weddingId: str
    message: str
    role: str = "host"

class GuestDaySuggestionsRequest(BaseModel):
    weddingId: str
    dayIndex: Optional[int] = 0

class OpsIssueRequest(BaseModel):
    issue: str
    confirm: Optional[bool] = False

class PlannerSetDetailsRequest(BaseModel):
    location: str
    budget: Optional[str] = None
    date: Optional[str] = None
    guests: Optional[str] = None

class PlannerSearchRequest(BaseModel):
    vendor_type: str

class VendorSuggestAllRequest(BaseModel):
    location: str
    theme: str = ""
    budget: str = ""
    estimatedGuests: str = ""

class VendorSuggestion(BaseModel):
    name: str
    phone: str = "Not available"
    email: str = "Not available"
    review_rating: Optional[str] = None
    short_description: str = ""

class CategorySuggestions(BaseModel):
    category: str
    label: str
    vendors: List[VendorSuggestion]

class VendorSuggestAllResponse(BaseModel):
    location: str
    categories: List[CategorySuggestions]
    model: str = GROQ_MODEL
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class VendorComplaintRequest(BaseModel):
    weddingId: str
    vendorId: str
    complaintText: str
    vendorName: str
    vendorRole: str
    vendorEmail: str

class AIResponse(BaseModel):
    result: str
    model: str = GROQ_MODEL
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class VendorComplaintResponse(BaseModel):
    success: bool
    aiSummary: str
    rawComplaint: str
    emailSent: bool
    message: str
    error: Optional[str] = None

# -------------------------------------------------------------------
# In-memory Planner State
# -------------------------------------------------------------------

wedding_state = {
    "location": None,
    "budget": None,
    "date": None,
    "guests": None,
}

# -------------------------------------------------------------------
# 1️⃣ Health Check
# -------------------------------------------------------------------

@ai_router.get("/health")
async def ai_health():
    client = _get_groq_client()
    res = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": "Reply OK"}],
        max_tokens=5,
    )
    return {"status": "ok", "model": GROQ_MODEL, "reply": res.choices[0].message.content}

# -------------------------------------------------------------------
# 2️⃣ Summarize Guests
# -------------------------------------------------------------------

@ai_router.post("/summarize-guests", response_model=AIResponse)
async def summarize_guests(req: WeddingIdRequest):
    wedding, guests, _ = _load_wedding_data(req.weddingId)
    system = "You are a wedding planning assistant."
    user = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}"
    result = _call_groq(system, user)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 3️⃣ Generate Vendor Brief
# -------------------------------------------------------------------

@ai_router.post("/generate-vendor-brief", response_model=AIResponse)
async def generate_vendor_brief(req: WeddingIdRequest):
    wedding, guests, vendors = _load_wedding_data(req.weddingId)
    system = "You are a professional wedding coordinator writing a vendor brief."
    user = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}\nVendors:\n{_vendors_context(vendors)}"
    result = _call_groq(system, user, max_tokens=2048)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 4️⃣ AI Chat
# -------------------------------------------------------------------

@ai_router.post("/chat", response_model=AIResponse)
async def ai_chat(req: ChatRequest):
    wedding, guests, vendors = _load_wedding_data(req.weddingId)
    system = "You are an AI wedding copilot."
    context = f"{_wedding_context(wedding)}\nGuests:\n{_guests_context(guests)}\nVendors:\n{_vendors_context(vendors)}"
    result = _call_groq(system, f"{context}\nUser: {req.message}")
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 5️⃣ Guest Day Suggestions
# -------------------------------------------------------------------

@ai_router.post("/guest-day-suggestions", response_model=AIResponse)
async def guest_day_suggestions(req: GuestDaySuggestionsRequest):
    wedding, _, _ = _load_wedding_data(req.weddingId)
    day = wedding.days[req.dayIndex or 0]
    system = "You are a friendly wedding concierge."
    user = f"{_wedding_context(wedding)}\nEvents for the day:\n{json.dumps(day.model_dump(), indent=2)}"
    result = _call_groq(system, user)
    return AIResponse(result=result)

# -------------------------------------------------------------------
# 6️⃣ Ops Agent
# -------------------------------------------------------------------

@ai_router.post("/ops/handle-issue", response_model=Dict)
async def handle_ops_issue(req: OpsIssueRequest):
    system = "You are an AI wedding operations coordinator."
    user = f"Issue: {req.issue}\nReturn JSON with role, priority, action, message."
    raw = _call_groq(system, user)
    try:
        data = json.loads(raw[raw.index("{"):raw.rindex("}")+1])
        return data
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid AI response")

# -------------------------------------------------------------------
# 7️⃣ Planner - Set Details
# -------------------------------------------------------------------

@ai_router.post("/planner/set-details")
async def planner_set_details(req: PlannerSetDetailsRequest):
    # Only update fields that are provided
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    wedding_state.update(update_data)
    return {"status": "updated", "state": wedding_state}

# -------------------------------------------------------------------
# 9️⃣ Vendor Complaint - AI Summarization + Email
# -------------------------------------------------------------------

@ai_router.post("/vendor/complaint", response_model=VendorComplaintResponse)
async def handle_vendor_complaint(req: VendorComplaintRequest):
    """
    Process vendor complaint with AI summarization and automated email sending.
    
    Flow:
    1. Receive raw complaint text from organizer
    2. Use AI to generate professional summary
    3. Send AI summary to vendor via Maileroo
    4. Return AI summary to frontend for preview
    5. Log both raw and AI-generated text for debugging
    """
    try:
        # Load wedding data for context
        wedding, _, _ = _load_wedding_data(req.weddingId)
        
        # Log raw complaint
        logger.info(f"[VENDOR COMPLAINT] Wedding: {wedding.name}, Vendor: {req.vendorName} ({req.vendorRole})")
        logger.info(f"[RAW COMPLAINT] {req.complaintText}")
        
        # Step 1: Generate AI summary
        system_prompt = """You are a professional wedding coordinator. Your task is to rewrite vendor complaints into professional, clear, and constructive messages suitable for sending to vendors.

Guidelines:
- Be polite and professional
- State the issue clearly and concisely
- Maintain a solution-oriented tone
- Remove any emotional language
- Keep it brief (2-3 paragraphs max)
- Start with a greeting and end with a professional closing"""

        user_prompt = f"""Wedding Context:
- Wedding Name: {wedding.name}
- Location: {wedding.location}
- Dates: {wedding.startDate} to {wedding.endDate}

Vendor:
- Name: {req.vendorName}
- Service: {req.vendorRole}

Raw Complaint from Organizer:
"{req.complaintText}"

Please rewrite this complaint as a professional email message to send to the vendor."""

        try:
            ai_summary = _call_groq(system_prompt, user_prompt, max_tokens=500)
            logger.info(f"[AI SUMMARY] {ai_summary}")
        except Exception as ai_error:
            logger.error(f"AI summarization failed: {ai_error}")
            # Fallback: use raw complaint if AI fails
            ai_summary = f"""Dear {req.vendorName},

We would like to bring the following matter to your attention regarding our wedding:

{req.complaintText}

We appreciate your prompt attention to this matter.

Best regards,
{wedding.name} Wedding Organizers"""
            logger.warning("[FALLBACK] Using raw complaint text due to AI failure")
        
        # Step 2: Send email to vendor
        email_sent = False
        email_error = None
        
        if req.vendorEmail and req.vendorEmail.strip():
            try:
                email_subject = f"Update Required - {wedding.name} Wedding"
                email_html = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1B4332;">Message from Wedding Organizers</h2>
                    <p style="color: #333; line-height: 1.6;">{ai_summary.replace(chr(10), '<br>')}</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        Wedding: {wedding.name}<br>
                        Location: {wedding.location}<br>
                        Dates: {wedding.startDate} to {wedding.endDate}
                    </p>
                </div>
                """
                
                email_result = await send_email(
                    to=req.vendorEmail,
                    subject=email_subject,
                    html=email_html,
                    text=ai_summary,
                    from_name=f"{wedding.name} Wedding"
                )
                
                if email_result.success:
                    email_sent = True
                    logger.info(f"[EMAIL SUCCESS] Complaint sent to {req.vendorEmail}")
                else:
                    email_error = email_result.error
                    logger.error(f"[EMAIL FAILED] {email_error}")
                    
            except Exception as email_exception:
                email_error = str(email_exception)
                logger.error(f"[EMAIL EXCEPTION] {email_error}")
        else:
            email_error = "Vendor email not provided"
            logger.warning("[EMAIL SKIPPED] No vendor email available")
        
        # Step 3: Return response
        if email_sent:
            return VendorComplaintResponse(
                success=True,
                aiSummary=ai_summary,
                rawComplaint=req.complaintText,
                emailSent=True,
                message=f"Complaint successfully sent to {req.vendorName}"
            )
        else:
            return VendorComplaintResponse(
                success=False,
                aiSummary=ai_summary,
                rawComplaint=req.complaintText,
                emailSent=False,
                message="Failed to send email to vendor",
                error=email_error
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[COMPLAINT HANDLER ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process vendor complaint: {str(e)}"
        )


# -------------------------------------------------------------------
# 8️⃣ Planner - Search Vendor (AI summary)
# -------------------------------------------------------------------

@ai_router.post("/planner/search-vendor", response_model=AIResponse)
async def planner_search_vendor(req: PlannerSearchRequest):
    system = "You are a wedding planner assistant."
    user = f"Suggest top 3 {req.vendor_type} options in {wedding_state['location']} with brief summaries."
    result = _call_groq(system, user)
    return AIResponse(result=result)


# -------------------------------------------------------------------
# 🔟 Suggest All Vendors (structured, per-category)
# -------------------------------------------------------------------

VENDOR_CATEGORIES = [
    ("catering", "Catering"),
    ("photography", "Photography"),
    ("decoration", "Decoration"),
    ("music", "Music/DJ"),
    ("makeup", "Makeup & Hair"),
    ("venue", "Venue"),
    ("transport", "Transport"),
    ("mehendi", "Mehendi Artist"),
    ("pandit", "Pandit/Priest"),
]


@ai_router.post("/planner/suggest-vendors", response_model=VendorSuggestAllResponse)
async def suggest_all_vendors(req: VendorSuggestAllRequest):
    """
    For each vendor subcategory, ask the LLM to return top 3 vendors
    near the given location, considering theme, budget, and guest count.
    Returns structured JSON per category.
    """
    context_parts = [f"Location: {req.location}"]
    if req.theme:
        context_parts.append(f"Wedding Theme: {req.theme}")
    if req.budget:
        context_parts.append(f"Budget Range: {req.budget}")
    if req.estimatedGuests:
        context_parts.append(f"Estimated Guests: {req.estimatedGuests}")
    context_str = "\n".join(context_parts)

    system_prompt = """You are an expert Indian wedding planner assistant with deep knowledge of local vendors.
Your job is to suggest the top 3 real, well-known vendors for a given category in the specified city/location.
Return ONLY valid JSON (no markdown, no extra text) in this exact format:
[
  {
    "name": "Vendor Name",
    "phone": "phone number or Not available",
    "email": "email or Not available",
    "review_rating": "4.5/5" or null,
    "short_description": "One line about why they are good for this wedding"
  }
]
Rules:
- Suggest vendors that actually exist and are well-known in the area if possible.
- If you are not sure about phone/email, put "Not available".
- If you don't know the review rating, set it to null (do NOT make up ratings).
- Tailor suggestions to the wedding theme, budget, and size when provided.
- Return exactly 3 vendors. No extra text, just the JSON array."""

    all_categories: List[CategorySuggestions] = []

    for cat_value, cat_label in VENDOR_CATEGORIES:
        user_prompt = f"""{context_str}
Vendor Category: {cat_label}
Return top 3 {cat_label} vendors for a wedding in {req.location}."""

        try:
            raw = _call_groq(system_prompt, user_prompt, max_tokens=600)
            # Parse JSON from response
            # Try to extract JSON array from the response
            start = raw.find("[")
            end = raw.rfind("]")
            if start != -1 and end != -1:
                json_str = raw[start:end + 1]
                vendor_list = json.loads(json_str)
            else:
                vendor_list = json.loads(raw)

            vendors_parsed = []
            for v in vendor_list[:3]:
                vendors_parsed.append(VendorSuggestion(
                    name=v.get("name", "Unknown"),
                    phone=v.get("phone", "Not available"),
                    email=v.get("email", "Not available"),
                    review_rating=v.get("review_rating"),
                    short_description=v.get("short_description", ""),
                ))

            all_categories.append(CategorySuggestions(
                category=cat_value,
                label=cat_label,
                vendors=vendors_parsed,
            ))
        except Exception as e:
            logger.warning(f"Failed to get suggestions for {cat_label}: {e}")
            all_categories.append(CategorySuggestions(
                category=cat_value,
                label=cat_label,
                vendors=[],
            ))

    return VendorSuggestAllResponse(
        location=req.location,
        categories=all_categories,
    )