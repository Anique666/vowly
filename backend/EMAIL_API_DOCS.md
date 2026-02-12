# Email API Documentation - Resend Integration

## Overview
The Email API provides endpoints for sending wedding-related emails using the Resend email service. This includes invitation emails with RSVP links and thank you emails to guests.

---

## Setup

### Environment Variables

Add to `/app/backend/.env`:
```env
RESEND_API_KEY=re_your_actual_api_key_here
SENDER_EMAIL=your-verified-email@yourdomain.com
```

**Current Setup (Testing):**
```env
RESEND_API_KEY=re_dummy_key_for_testing_12345
SENDER_EMAIL=onboarding@resend.dev
```

### Getting a Real Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Go to Dashboard → API Keys
3. Click "Create API Key"
4. Copy the key (starts with `re_`)
5. Update `.env` file with real key
6. Restart backend: `sudo supervisorctl restart backend`

### Domain Verification (Production)

For production use, verify your sending domain:
1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification
5. Use email like `noreply@yourdomain.com`

---

## Endpoints

### 1. Send Wedding Invitations

**Endpoint:** `POST /api/email/send-invites`

**Description:** Send personalized wedding invitation emails with RSVP links to specified guests.

**Request Body:**
```json
{
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
  "guestEmails": [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com"
  ]
}
```

**Success Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Sent 3 invitation(s) for Royal Wedding 2026",
  "emailsSent": 3,
  "failed": []
}
```

**Partial Success Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Sent 2 invitation(s) for Royal Wedding 2026",
  "emailsSent": 2,
  "failed": ["invalid@example.com"]
}
```

**Error Responses:**

`404 Not Found` - Wedding doesn't exist
```json
{
  "detail": "Wedding with id 'invalid-id' not found"
}
```

`422 Unprocessable Entity` - Invalid email format
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "guestEmails", 0],
      "msg": "value is not a valid email address",
      "input": "not-an-email"
    }
  ]
}
```

---

### 2. Send Thank You Emails

**Endpoint:** `POST /api/email/send-thankyou`

**Description:** Send personalized thank you emails to all guests of a wedding.

**Request Body:**
```json
{
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3"
}
```

**Success Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Sent 15 thank you email(s) for Royal Wedding 2026",
  "emailsSent": 15,
  "failed": []
}
```

**Partial Success Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Sent 14 thank you email(s) for Royal Wedding 2026",
  "emailsSent": 14,
  "failed": ["bounced@example.com"]
}
```

**Error Responses:**

`404 Not Found` - Wedding doesn't exist
```json
{
  "detail": "Wedding with id 'invalid-id' not found"
}
```

`404 Not Found` - No guests found
```json
{
  "detail": "No guests found for wedding 'wedding-id'"
}
```

---

## Email Templates

### Invitation Email

**Features:**
- Gold-themed design matching wedding aesthetic
- Wedding name, location, and dates
- Multi-day event support
- RSVP button with personalized link
- Mobile-responsive HTML layout
- Inline CSS for maximum compatibility

**RSVP Link Format:**
```
https://your-app-url.com/rsvp?weddingId={wedding.id}&email={guest_email}
```

**Preview:**
```
┌─────────────────────────────────────┐
│     🎉 You're Invited! 🎉          │
│     (Gold gradient header)          │
├─────────────────────────────────────┤
│  Royal Wedding 2026                 │
│                                     │
│  We are delighted to invite you...  │
│                                     │
│  📍 Location: Udaipur Palace       │
│  📅 Duration: 3 days               │
│                                     │
│  [ RSVP Now ]  (Gold button)       │
│                                     │
│  We look forward to celebrating!    │
└─────────────────────────────────────┘
```

### Thank You Email

**Features:**
- Personalized with guest name
- Wedding location reference
- Gratitude message
- Inspirational quote
- Gold-themed design
- Mobile-responsive layout

**Preview:**
```
┌─────────────────────────────────────┐
│     💛 Thank You! 💛               │
│     (Gold gradient header)          │
├─────────────────────────────────────┤
│  Dear Alice Smith,                  │
│                                     │
│  Thank you for being part of        │
│  Royal Wedding 2026...              │
│                                     │
│  "The best thing to hold onto       │
│   in life is each other."           │
│                                     │
│  With warmest regards,              │
│  The Wedding Party                  │
└─────────────────────────────────────┘
```

---

## Testing

### Using curl

**Send Invitations:**
```bash
curl -X POST http://localhost:8001/api/email/send-invites \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "guestEmails": [
      "guest1@example.com",
      "guest2@example.com"
    ]
  }'
```

**Send Thank You Emails:**
```bash
curl -X POST http://localhost:8001/api/email/send-thankyou \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3"
  }'
```

### Using Python Test Suite

```bash
cd /app/backend
python test_email_api.py
```

---

## Implementation Details

### Async Email Sending

Emails are sent asynchronously to prevent blocking the FastAPI event loop:

```python
# Non-blocking email send
email_response = await asyncio.to_thread(resend.Emails.send, params)
```

### Error Handling

- Individual email failures are caught and logged
- Failed emails are tracked in the response
- API continues processing remaining emails
- Overall status reflects partial success

### Guest Filtering

For thank you emails:
- Only guests with email addresses receive emails
- Guests without emails are skipped (logged)
- Final count reflects actual emails sent

---

## Production Deployment

### Checklist

- [ ] Sign up for Resend account
- [ ] Verify your sending domain
- [ ] Get production API key
- [ ] Update `RESEND_API_KEY` in `.env`
- [ ] Update `SENDER_EMAIL` with verified address
- [ ] Test with real email addresses
- [ ] Monitor Resend dashboard for deliverability
- [ ] Set up webhook for bounce handling
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Test on multiple email clients

### Monitoring

View email status in Resend Dashboard:
- Delivered emails
- Bounced emails
- Spam complaints
- Open rates (if tracking enabled)
- Click rates (if tracking enabled)

---

## Use Cases

### Scenario 1: Bulk Invitation Send

```python
import requests

# Get all guests for wedding
response = requests.get(f"{BASE_URL}/guest/list?weddingId={wedding_id}")
guests = response.json()

# Extract emails
guest_emails = [g['email'] for g in guests if g.get('email')]

# Send invitations
response = requests.post(
    f"{BASE_URL}/email/send-invites",
    json={
        "weddingId": wedding_id,
        "guestEmails": guest_emails
    }
)

print(f"Sent {response.json()['emailsSent']} invitations")
```

### Scenario 2: Post-Wedding Thank You

```python
import requests

# Simply provide wedding ID
response = requests.post(
    f"{BASE_URL}/email/send-thankyou",
    json={"weddingId": wedding_id}
)

result = response.json()
print(f"Sent {result['emailsSent']} thank you emails")
if result['failed']:
    print(f"Failed: {', '.join(result['failed'])}")
```

### Scenario 3: Selective Invitations

```python
import requests

# Send to VIP guests first
vip_emails = [
    "family1@example.com",
    "family2@example.com",
    "vip@example.com"
]

response = requests.post(
    f"{BASE_URL}/email/send-invites",
    json={
        "weddingId": wedding_id,
        "guestEmails": vip_emails
    }
)

# Later send to remaining guests
```

---

## Customization

### Custom Email Templates

To customize email templates, modify these functions in `server.py`:
- `create_invite_email_html()` - Invitation template
- `create_thankyou_email_html()` - Thank you template

### Adding Images

```html
<!-- Use absolute URLs for images -->
<img src="https://your-cdn.com/wedding-logo.png" 
     alt="Wedding Logo" 
     style="max-width: 200px;">
```

### Custom RSVP Link

Update the RSVP link in `create_invite_email_html()`:
```python
rsvp_url = f"https://your-actual-domain.com/rsvp?weddingId={wedding.id}&email={guest_email}"
```

---

## Limitations

### Resend Free Tier

- 100 emails/day
- 1 domain verification
- Basic analytics
- Email API access

### Dummy API Key

Current setup uses dummy key:
- Emails won't actually send
- API calls will fail
- Failed emails tracked in response
- Useful for testing integration

---

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is correct
2. **Verify Domain**: Ensure sending domain is verified
3. **Check Logs**: `tail -f /var/log/supervisor/backend.err.log`
4. **Test Email**: Use Resend dashboard to send test email
5. **Check Quota**: Verify you haven't hit daily limit

### Emails Going to Spam

1. Verify SPF, DKIM, DMARC records
2. Use verified sending domain
3. Avoid spam trigger words
4. Include unsubscribe link (future enhancement)
5. Warm up IP address gradually

### High Bounce Rate

1. Validate email addresses before sending
2. Remove invalid/bounced emails
3. Use double opt-in for email collection
4. Monitor Resend bounce reports

---

## Future Enhancements

- [ ] Email scheduling (send at specific time)
- [ ] Template variables for customization
- [ ] Attachment support
- [ ] Email preview before sending
- [ ] Unsubscribe link management
- [ ] Email open/click tracking
- [ ] A/B testing different templates
- [ ] Retry logic for failed emails
- [ ] Webhook integration for bounces
- [ ] Multi-language support
- [ ] Rich text editor for templates
- [ ] Save the date emails
- [ ] Reminder emails (X days before wedding)
- [ ] Photo sharing emails after wedding

---

## API Summary

| Endpoint | Method | Purpose | Key Feature |
|----------|--------|---------|-------------|
| `/api/email/send-invites` | POST | Send invitations | Bulk send with RSVP links |
| `/api/email/send-thankyou` | POST | Send thank you emails | Auto-fetch guests from wedding |

Both endpoints handle partial failures gracefully and provide detailed response with success/failure counts.
