# Vendor API - Complete Documentation

## Overview
The Vendor API provides endpoints for vendors to register their availability for weddings with validated email format and attendingDays alignment.

---

## Endpoints

### 1. Vendor Response (Create)

**Endpoint:** `POST /api/vendor/respond`

**Description:** Create a new vendor availability response with automatic validation.

**Request Body:**
```json
{
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
  "name": "Royal Caterers",
  "serviceType": "catering",
  "email": "info@royalcaterers.com",
  "phoneNumber": "+91-9876543210",
  "attendingDays": [false, true, true],
  "notes": "Specializes in North Indian cuisine"
}
```

**Field Descriptions:**
- `weddingId` (string, required) - UUID of the wedding
- `name` (string, required) - Vendor company name
- `serviceType` (string, required) - Type of service provided
- `email` (string, optional) - Valid email address
- `phoneNumber` (string, optional) - Contact phone number
- `attendingDays` (boolean[], required) - Array of availability per day
- `notes` (string, optional) - Additional notes or requirements

**Validation Rules:**
1. ✅ **Email format validation** - Must be valid email (user@domain.com)
2. ✅ **attendingDays length** - Must match number of wedding days exactly
3. ✅ **Wedding existence** - Wedding ID must exist in database

**Success Response:** `201 Created`
```json
{
  "id": "fa81a46b-1234-5678-90ab-cdef01234567",
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
  "name": "Royal Caterers",
  "serviceType": "catering",
  "email": "info@royalcaterers.com",
  "phoneNumber": "+91-9876543210",
  "attendingDays": [false, true, true],
  "notes": "Specializes in North Indian cuisine"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid email format
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "email"],
      "msg": "value is not a valid email address: An email address must have an @-sign.",
      "input": "not-an-email"
    }
  ]
}
```

`400 Bad Request` - attendingDays length mismatch
```json
{
  "detail": "attendingDays length (2) must match number of wedding days (3)"
}
```

`404 Not Found` - Wedding doesn't exist
```json
{
  "detail": "Wedding with id 'invalid-wedding-id' not found"
}
```

`500 Internal Server Error` - Server error
```json
{
  "detail": "Internal server error: <error message>"
}
```

---

### 2. List Vendors by Wedding

**Endpoint:** `GET /api/vendor/list?weddingId={wedding_id}`

**Description:** Retrieve all vendors for a specific wedding.

**Query Parameters:**
- `weddingId` (string, required) - UUID of the wedding

**Example Request:**
```
GET /api/vendor/list?weddingId=f887960a-acd2-49e3-adcc-7b30b25632d3
```

**Success Response:** `200 OK`
```json
[
  {
    "id": "fa81a46b-1234-5678-90ab-cdef01234567",
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Royal Caterers",
    "serviceType": "catering",
    "email": "info@royalcaterers.com",
    "phoneNumber": "+91-9876543210",
    "attendingDays": [false, true, true],
    "notes": "Specializes in North Indian cuisine"
  },
  {
    "id": "gb92h57c-2345-6789-01bc-def123456789",
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Dream Photography",
    "serviceType": "photography",
    "email": "contact@dreamphotos.com",
    "phoneNumber": "+91-9876543211",
    "attendingDays": [true, true, true],
    "notes": "Professional wedding photography"
  }
]
```

**Error Responses:**

`404 Not Found` - Wedding doesn't exist
```json
{
  "detail": "Wedding with id 'invalid-id' not found"
}
```

`500 Internal Server Error` - Server error
```json
{
  "detail": "Internal server error: <error message>"
}
```

---

## Data Structure

### Vendor Object
```typescript
{
  id: string;                 // Auto-generated UUID
  weddingId: string;          // Reference to wedding (required)
  name: string;               // Vendor company name (required)
  serviceType: string;        // Service category (required)
  email?: string;             // Valid email (optional)
  phoneNumber?: string;       // Contact phone (optional)
  attendingDays: boolean[];   // Array matching wedding days (required)
  notes?: string;             // Additional information (optional)
}
```

---

## Service Types

Common service types include:
- `"catering"` - Food and beverage services
- `"photography"` - Photo and video services
- `"decoration"` - Venue decoration and floral arrangements
- `"music"` - DJ, band, or entertainment services
- `"venue"` - Venue rental services
- `"transport"` - Transportation services
- `"makeup"` - Makeup and beauty services
- `"invitation"` - Invitation and stationery services

---

## Validation Details

### Email Format Validation

**Valid Examples:**
- `"info@royalcaterers.com"` ✅
- `"vendor.name@domain.co.in"` ✅
- `"booking+tag@gmail.com"` ✅
- `null` ✅ (email is optional)

**Invalid Examples:**
- `"not-an-email"` ❌
- `"missing@"` ❌
- `"@domain.com"` ❌
- `"vendor@"` ❌

### attendingDays Length Validation

**Example Scenario:**
Wedding has 3 days (dayIndex: 0, 1, 2)

**Valid:**
- `[true, true, true]` ✅ - Available all 3 days
- `[false, true, true]` ✅ - Available days 1 and 2 only
- `[false, false, false]` ✅ - Not available (can still register interest)

**Invalid:**
- `[true, false]` ❌ - Only 2 entries (wedding has 3 days)
- `[true, true, true, true]` ❌ - 4 entries (wedding has 3 days)
- `[]` ❌ - Empty array

---

## Testing

### Using curl

**Create Vendor Response:**
```bash
curl -X POST http://localhost:8001/api/vendor/respond \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Royal Caterers",
    "serviceType": "catering",
    "email": "info@royalcaterers.com",
    "phoneNumber": "+91-9876543210",
    "attendingDays": [false, true, true],
    "notes": "Specializes in North Indian cuisine"
  }'
```

**List All Vendors for Wedding:**
```bash
curl "http://localhost:8001/api/vendor/list?weddingId=f887960a-acd2-49e3-adcc-7b30b25632d3"
```

**Test Email Validation:**
```bash
curl -X POST http://localhost:8001/api/vendor/respond \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Test Vendor",
    "serviceType": "catering",
    "email": "invalid-email",
    "phoneNumber": "+91-1234567890",
    "attendingDays": [true, true, true],
    "notes": "Test"
  }'
# Expected: 422 Unprocessable Entity
```

**Test attendingDays Validation:**
```bash
curl -X POST http://localhost:8001/api/vendor/respond \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Test Vendor",
    "serviceType": "photography",
    "email": "test@example.com",
    "phoneNumber": "+91-1234567890",
    "attendingDays": [true, false],
    "notes": "Test"
  }'
# Expected: 400 Bad Request - length mismatch
```

### Using Python Test Suite

```bash
cd /app/backend
python test_vendor_api.py
```

This comprehensive test suite includes:
- Valid vendor response creation
- Email format validation
- Optional email field handling
- attendingDays length validation (too short and too long)
- Non-existent wedding validation
- Vendor list retrieval
- attendingDays alignment verification
- All service types testing
- Optional phone number handling

---

## HTTP Status Codes

| Status Code | Usage | Description |
|-------------|-------|-------------|
| 200 OK | GET success | Vendors retrieved successfully |
| 201 Created | POST success | Vendor response created successfully |
| 400 Bad Request | Validation error | attendingDays length mismatch |
| 404 Not Found | Resource missing | Wedding ID not found |
| 422 Unprocessable Entity | Validation error | Email format invalid |
| 500 Internal Server Error | Server error | Unexpected server error |

---

## Use Cases

### Vendor Registration Flow

1. **Vendor receives wedding inquiry with wedding ID**
2. **Vendor fills out availability form:**
   - Company name: "Royal Caterers"
   - Service type: Catering
   - Email: "info@royalcaterers.com"
   - Phone: "+91-9876543210"
   - Select available days: ☐ Day 1, ☑ Day 2, ☑ Day 3
   - Notes: "Specializes in North Indian cuisine"

3. **Frontend validates and sends POST /api/vendor/respond**
4. **Backend validates:**
   - Wedding exists ✓
   - Email format valid ✓
   - attendingDays length matches (3 = 3) ✓
5. **Vendor response created with unique ID**
6. **Confirmation sent to vendor**

### Wedding Organizer Vendor Management

1. **Organizer wants to see all vendor responses**
2. **Frontend calls GET /api/vendor/list?weddingId={id}**
3. **Backend returns all vendors with availability details**
4. **Organizer sees:**
   - Total vendors: 8
   - Day 1: 6 vendors available
   - Day 2: 8 vendors available
   - Day 3: 5 vendors available
   - By service type:
     - Catering: 2 vendors
     - Photography: 1 vendor
     - Decoration: 2 vendors
     - Music: 1 vendor
     - Transport: 2 vendors

---

## Data Storage

Vendors are stored in `/app/backend/data/vendors.json` with:
- Thread-safe file locking
- Atomic write operations
- Filtered retrieval by weddingId
- JSON formatting with indentation

**Example Storage:**
```json
{
  "vendors": [
    {
      "id": "fa81a46b-1234-5678-90ab-cdef01234567",
      "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
      "name": "Royal Caterers",
      "serviceType": "catering",
      "email": "info@royalcaterers.com",
      "phoneNumber": "+91-9876543210",
      "attendingDays": [false, true, true],
      "notes": "Specializes in North Indian cuisine"
    }
  ]
}
```

---

## Business Logic

### attendingDays Array Alignment

The `attendingDays` array represents vendor availability for each wedding day:

**Example:**
- Wedding has 3 days (indices 0, 1, 2)
- Vendor's `attendingDays: [false, true, true]` means:
  - Day 0 (index 0): Not available ✗
  - Day 1 (index 1): Available ✓
  - Day 2 (index 2): Available ✓

This enables:
- Day-specific vendor scheduling
- Conflict detection (double-booking prevention)
- Cost calculation per day
- Service coverage verification

---

## Common Patterns

### Bulk Vendor Registration

```python
import requests

BASE_URL = "http://localhost:8001/api"
wedding_id = "f887960a-acd2-49e3-adcc-7b30b25632d3"

vendors = [
    {
        "name": "Royal Caterers",
        "serviceType": "catering",
        "email": "info@royalcaterers.com",
        "phoneNumber": "+91-9876543210",
        "attendingDays": [False, True, True],
        "notes": "North Indian cuisine specialist"
    },
    {
        "name": "Dream Photography",
        "serviceType": "photography",
        "email": "contact@dreamphotos.com",
        "phoneNumber": "+91-9876543211",
        "attendingDays": [True, True, True],
        "notes": "Photo and video coverage"
    },
]

for vendor in vendors:
    vendor["weddingId"] = wedding_id
    
    response = requests.post(f"{BASE_URL}/vendor/respond", json=vendor)
    if response.status_code == 201:
        print(f"✓ Registered {vendor['name']}")
```

### Vendor Availability Summary

```python
response = requests.get(f"{BASE_URL}/vendor/list?weddingId={wedding_id}")
vendors = response.json()

# Calculate availability per day
num_days = len(vendors[0]['attendingDays']) if vendors else 0
day_availability = [0] * num_days

for vendor in vendors:
    for i, available in enumerate(vendor['attendingDays']):
        if available:
            day_availability[i] += 1

print("Day-wise vendor availability:")
for i, count in enumerate(day_availability):
    print(f"  Day {i+1}: {count} vendors available")

# Group by service type
from collections import defaultdict
by_service = defaultdict(list)
for vendor in vendors:
    by_service[vendor['serviceType']].append(vendor['name'])

print("\nVendors by service type:")
for service_type, vendor_names in by_service.items():
    print(f"  {service_type.title()}: {', '.join(vendor_names)}")
```

---

## Integration Examples

### Frontend Form Validation

```javascript
async function submitVendorResponse(formData) {
  // Client-side validation
  if (!validateEmail(formData.email)) {
    showError("Please enter a valid email address");
    return;
  }
  
  // Get wedding to validate days
  const wedding = await fetch(`/api/wedding/${formData.weddingId}`).then(r => r.json());
  
  if (formData.attendingDays.length !== wedding.days.length) {
    showError(`Please select availability for all ${wedding.days.length} wedding days`);
    return;
  }
  
  // Submit vendor response
  try {
    const response = await fetch('/api/vendor/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      handleVendorError(response.status, error);
    } else {
      showSuccess("Vendor availability registered successfully!");
    }
  } catch (error) {
    showError("Unable to register availability. Please try again.");
  }
}

function handleVendorError(status, error) {
  if (status === 422) {
    showError("Please enter a valid email address");
  } else if (status === 400) {
    showError("Please select availability for all wedding days");
  } else if (status === 404) {
    showError("Wedding not found. Please check your inquiry link");
  }
}
```

---

## Future Enhancements

- [ ] Vendor pricing and quotes
- [ ] Contract management
- [ ] Payment tracking
- [ ] Vendor ratings and reviews
- [ ] Multi-event vendor booking
- [ ] Calendar integration
- [ ] Automated reminders
- [ ] Vendor portfolio/gallery
- [ ] Service package details
- [ ] Availability conflict detection
- [ ] Vendor messaging system
- [ ] Deposit and payment scheduling
- [ ] Contract templates
- [ ] Vendor recommendations based on budget
- [ ] Multi-vendor coordination tools

---

## API Summary

| Endpoint | Method | Purpose | Validation |
|----------|--------|---------|------------|
| `/api/vendor/respond` | POST | Create vendor availability | Email format, attendingDays length, wedding exists |
| `/api/vendor/list` | GET | List vendors for wedding | Wedding exists |

Both endpoints ensure data consistency and provide clear error messages for validation failures.
