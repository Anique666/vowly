# Guest RSVP API - Comprehensive Documentation

## Overview
The Guest RSVP API provides endpoints for guests to register their attendance for weddings with validated email format and attendingDays alignment.

---

## Endpoints

### 1. Guest RSVP (Create)

**Endpoint:** `POST /api/guest/rsvp`

**Description:** Create a new guest RSVP with automatic validation.

**Request Body:**
```json
{
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
  "name": "Amit Kumar",
  "email": "amit@example.com",
  "attendingDays": [true, true, true],
  "dietary": "veg",
  "accommodation": true
}
```

**Field Descriptions:**
- `weddingId` (string, required) - UUID of the wedding
- `name` (string, required) - Guest's full name
- `email` (string, optional) - Valid email address
- `attendingDays` (boolean[], required) - Array of attendance per day
- `dietary` (string, required) - One of: "veg", "non-veg", "jain", "vegan"
- `accommodation` (boolean, required) - Whether guest needs accommodation

**Validation Rules:**
1. ✅ **Email format validation** - Must be valid email (user@domain.com)
2. ✅ **attendingDays length** - Must match number of wedding days exactly
3. ✅ **Wedding existence** - Wedding ID must exist in database

**Success Response:** `201 Created`
```json
{
  "id": "a6b0f25f-1234-5678-90ab-cdef01234567",
  "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
  "name": "Amit Kumar",
  "email": "amit@example.com",
  "attendingDays": [true, true, true],
  "dietary": "veg",
  "accommodation": true
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

### 2. List Guests by Wedding

**Endpoint:** `GET /api/guest/list?weddingId={wedding_id}`

**Description:** Retrieve all guests for a specific wedding.

**Query Parameters:**
- `weddingId` (string, required) - UUID of the wedding

**Example Request:**
```
GET /api/guest/list?weddingId=celebrate-together-6
```

**Success Response:** `200 OK`
```json
[
  {
    "id": "a6b0f25f-1234-5678-90ab-cdef01234567",
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Amit Kumar",
    "email": "amit@example.com",
    "attendingDays": [true, true, true],
    "dietary": "veg",
    "accommodation": true
  },
  {
    "id": "b7c1g36g-2345-6789-01bc-def123456789",
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "attendingDays": [true, true, false],
    "dietary": "veg",
    "accommodation": true
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

### Guest Object
```typescript
{
  id: string;                 // Auto-generated UUID
  weddingId: string;          // Reference to wedding (required)
  name: string;               // Guest full name (required)
  email?: string;             // Valid email (optional)
  attendingDays: boolean[];   // Array matching wedding days (required)
  dietary: string;            // "veg"|"non-veg"|"jain"|"vegan" (required)
  accommodation: boolean;     // Needs accommodation (required)
}
```

---

## Validation Details

### Email Format Validation

**Valid Examples:**
- `"amit@example.com"` ✅
- `"user.name@domain.co.in"` ✅
- `"test+tag@gmail.com"` ✅
- `null` ✅ (email is optional)

**Invalid Examples:**
- `"not-an-email"` ❌
- `"missing@"` ❌
- `"@domain.com"` ❌
- `"user@"` ❌

### attendingDays Length Validation

**Example Scenario:**
Wedding has 3 days (dayIndex: 0, 1, 2)

**Valid:**
- `[true, true, true]` ✅ - Attending all 3 days
- `[true, false, true]` ✅ - Attending days 0 and 2
- `[false, false, false]` ✅ - Not attending any day

**Invalid:**
- `[true, false]` ❌ - Only 2 entries (wedding has 3 days)
- `[true, true, true, true]` ❌ - 4 entries (wedding has 3 days)
- `[]` ❌ - Empty array

### Dietary Options

Must be one of:
- `"veg"` - Vegetarian
- `"non-veg"` - Non-vegetarian
- `"jain"` - Jain food requirements
- `"vegan"` - Vegan diet

---

## Testing

### Using curl

**Create Guest RSVP:**
```bash
curl -X POST http://localhost:8001/api/guest/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Amit Kumar",
    "email": "amit@example.com",
    "attendingDays": [true, true, true],
    "dietary": "veg",
    "accommodation": true
  }'
```

**List All Guests for Wedding:**
```bash
curl "http://localhost:8001/api/guest/list?weddingId=celebrate-together-6"
```

**Test Email Validation:**
```bash
curl -X POST http://localhost:8001/api/guest/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Test Guest",
    "email": "invalid-email",
    "attendingDays": [true, true, true],
    "dietary": "veg",
    "accommodation": false
  }'
# Expected: 422 Unprocessable Entity
```

**Test attendingDays Validation:**
```bash
curl -X POST http://localhost:8001/api/guest/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
    "name": "Test Guest",
    "email": "test@example.com",
    "attendingDays": [true, false],
    "dietary": "veg",
    "accommodation": false
  }'
# Expected: 400 Bad Request - length mismatch
```

### Using Python Test Suite

```bash
cd /app/backend
python test_guest_rsvp.py
```

This comprehensive test suite includes:
- Valid guest RSVP creation
- Email format validation
- Optional email field handling
- attendingDays length validation (too short and too long)
- Non-existent wedding validation
- Guest list retrieval
- attendingDays alignment verification
- All dietary options testing

---

## HTTP Status Codes

| Status Code | Usage | Description |
|-------------|-------|-------------|
| 200 OK | GET success | Guests retrieved successfully |
| 201 Created | POST success | Guest RSVP created successfully |
| 400 Bad Request | Validation error | attendingDays length mismatch |
| 404 Not Found | Resource missing | Wedding ID not found |
| 422 Unprocessable Entity | Validation error | Email format invalid |
| 500 Internal Server Error | Server error | Unexpected server error |

---

## Use Cases

### Complete RSVP Flow

1. **User receives wedding invitation with wedding ID**
2. **User fills out RSVP form:**
   - Name: "Amit Kumar"
   - Email: "amit@example.com"
   - Select days attending: ☑ Day 1, ☑ Day 2, ☑ Day 3
   - Dietary preference: Vegetarian
   - Need accommodation: Yes

3. **Frontend validates and sends POST /api/guest/rsvp**
4. **Backend validates:**
   - Wedding exists ✓
   - Email format valid ✓
   - attendingDays length matches (3 = 3) ✓
5. **Guest RSVP created with unique ID**
6. **Confirmation sent to guest**

### Wedding Organizer View

1. **Organizer wants to see all RSVPs**
2. **Frontend calls GET /api/guest/list?weddingId={id}**
3. **Backend returns all guests with attendance details**
4. **Organizer sees:**
   - Total RSVPs: 25
   - Day 1 attendance: 23 guests
   - Day 2 attendance: 25 guests
   - Day 3 attendance: 20 guests
   - Dietary breakdown: 15 veg, 8 non-veg, 2 jain
   - Accommodation needed: 18 guests

---

## Data Storage

Guests are stored in `/app/backend/data/guests.json` with:
- Thread-safe file locking
- Atomic write operations
- Filtered retrieval by weddingId
- JSON formatting with indentation

**Example Storage:**
```json
{
  "guests": [
    {
      "id": "a6b0f25f-1234-5678-90ab-cdef01234567",
      "weddingId": "f887960a-acd2-49e3-adcc-7b30b25632d3",
      "name": "Amit Kumar",
      "email": "amit@example.com",
      "attendingDays": [true, true, true],
      "dietary": "veg",
      "accommodation": true
    }
  ]
}
```

---

## Business Logic

### attendingDays Array Alignment

The `attendingDays` array is a critical field that must align with the wedding's day structure:

**Example:**
- Wedding has 3 days (indices 0, 1, 2)
- Guest's `attendingDays: [true, false, true]` means:
  - Day 0 (index 0): Attending ✓
  - Day 1 (index 1): Not attending ✗
  - Day 2 (index 2): Attending ✓

This enables:
- Per-day headcount calculations
- Catering planning per day
- Venue capacity management
- Day-specific guest lists

---

## Common Patterns

### Creating Multiple Guest RSVPs

```python
import requests

BASE_URL = "http://localhost:8001/api"
wedding_id = "f887960a-acd2-49e3-adcc-7b30b25632d3"

guests = [
    {"name": "Amit Kumar", "email": "amit@example.com", "attendingDays": [True, True, True]},
    {"name": "Priya Sharma", "email": "priya@example.com", "attendingDays": [True, True, False]},
    {"name": "Rajesh Patel", "email": "rajesh@example.com", "attendingDays": [False, True, True]},
]

for guest in guests:
    guest["weddingId"] = wedding_id
    guest["dietary"] = "veg"
    guest["accommodation"] = True
    
    response = requests.post(f"{BASE_URL}/guest/rsvp", json=guest)
    if response.status_code == 201:
        print(f"✓ Created RSVP for {guest['name']}")
```

### Calculating Day-wise Attendance

```python
response = requests.get(f"{BASE_URL}/guest/list?weddingId={wedding_id}")
guests = response.json()

# Calculate attendance per day
num_days = len(guests[0]['attendingDays']) if guests else 0
day_counts = [0] * num_days

for guest in guests:
    for i, attending in enumerate(guest['attendingDays']):
        if attending:
            day_counts[i] += 1

print("Day-wise attendance:")
for i, count in enumerate(day_counts):
    print(f"  Day {i+1}: {count} guests")
```

---

## Error Handling Best Practices

### Client-Side Validation

Before sending RSVP:
1. Validate email format client-side
2. Ensure attendingDays array length matches wedding days
3. Verify all required fields are filled
4. Show user-friendly error messages

### Error Display

```javascript
try {
  const response = await fetch('/api/guest/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guestData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 422) {
      // Email validation error
      showError("Please enter a valid email address");
    } else if (response.status === 400) {
      // attendingDays length mismatch
      showError("Please select attendance for all wedding days");
    } else if (response.status === 404) {
      // Wedding not found
      showError("Wedding not found. Please check your invitation link");
    }
  } else {
    showSuccess("RSVP submitted successfully!");
  }
} catch (error) {
  showError("Unable to submit RSVP. Please try again later.");
}
```

---

## Future Enhancements

- [ ] Plus-one guests support
- [ ] Guest categories (family, friends, colleagues)
- [ ] RSVP deadline enforcement
- [ ] Email notifications on RSVP submission
- [ ] Update existing RSVP
- [ ] Guest check-in system
- [ ] Dietary restriction notes field
- [ ] Transport requirements
- [ ] Gift registry integration
- [ ] Guest messaging system
