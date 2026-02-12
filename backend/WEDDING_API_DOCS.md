# Wedding API Endpoints - Detailed Documentation

## Overview
The Wedding API provides validated endpoints for creating and retrieving wedding information with comprehensive validation rules.

---

## Endpoints

### 1. Create Wedding

**Endpoint:** `POST /api/wedding/create`

**Description:** Create a new wedding with automatic ID generation and validation.

**Request Body:**
```json
{
  "name": "Beautiful Royal Wedding",
  "location": "Jaipur Palace, Rajasthan",
  "startDate": "2026-09-15",
  "endDate": "2026-09-17",
  "days": [
    {
      "dayIndex": 0,
      "date": "2026-09-15",
      "events": [
        {
          "name": "Mehendi Ceremony",
          "time": "16:00",
          "venue": "Garden Terrace"
        },
        {
          "name": "Sangeet Night",
          "time": "20:00",
          "venue": "Grand Hall"
        }
      ]
    },
    {
      "dayIndex": 1,
      "date": "2026-09-16",
      "events": [
        {
          "name": "Wedding Ceremony",
          "time": "18:00",
          "venue": "Palace Courtyard"
        }
      ]
    }
  ]
}
```

**Validation Rules:**
1. ✅ **Wedding name is required** - Cannot be empty or whitespace-only
2. ✅ **At least one day is required** - days[] array must have at least 1 element
3. ✅ **At least one event is required** - Total events across all days must be >= 1

**Success Response:** `201 Created`
```json
{
  "id": "47df2845-a123-4567-89ab-cdef01234567",
  "name": "Beautiful Royal Wedding",
  "location": "Jaipur Palace, Rajasthan",
  "startDate": "2026-09-15",
  "endDate": "2026-09-17",
  "days": [
    {
      "dayIndex": 0,
      "date": "2026-09-15",
      "events": [
        {
          "id": "c1c78440-a0f6-42ef-893d-414565b7492f",
          "name": "Mehendi Ceremony",
          "time": "16:00",
          "venue": "Garden Terrace"
        },
        {
          "id": "fc0ad522-5fd9-4a32-abac-cd238a4d6532",
          "name": "Sangeet Night",
          "time": "20:00",
          "venue": "Grand Hall"
        }
      ]
    },
    {
      "dayIndex": 1,
      "date": "2026-09-16",
      "events": [
        {
          "id": "bb56b581-26d2-41e3-b108-f2b52a9ca92e",
          "name": "Wedding Ceremony",
          "time": "18:00",
          "venue": "Palace Courtyard"
        }
      ]
    }
  ],
  "vendors": []
}
```

**Error Responses:**

`400 Bad Request` - Validation failed
```json
{
  "detail": "Wedding name is required"
}
```

```json
{
  "detail": "At least one day is required"
}
```

```json
{
  "detail": "At least one event is required"
}
```

`500 Internal Server Error` - Server error
```json
{
  "detail": "Internal server error: <error message>"
}
```

---

### 2. Get Wedding by ID

**Endpoint:** `GET /api/wedding/{wedding_id}`

**Description:** Retrieve a specific wedding by its unique ID.

**Path Parameters:**
- `wedding_id` (string, required) - UUID of the wedding

**Success Response:** `200 OK`
```json
{
  "id": "47df2845-a123-4567-89ab-cdef01234567",
  "name": "Beautiful Royal Wedding",
  "location": "Jaipur Palace, Rajasthan",
  "startDate": "2026-09-15",
  "endDate": "2026-09-17",
  "days": [...],
  "vendors": []
}
```

**Error Responses:**

`404 Not Found` - Wedding doesn't exist
```json
{
  "detail": "Wedding with id 'invalid-uuid-12345' not found"
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

### Wedding Object
```typescript
{
  id: string;              // Auto-generated UUID
  name: string;            // Required, non-empty
  location: string;        // Venue location
  startDate: string;       // ISO date format (YYYY-MM-DD)
  endDate: string;         // ISO date format (YYYY-MM-DD)
  days: Day[];            // Array of days (min 1 required)
  vendors: Vendor[];      // Array of vendor references
}
```

### Day Object
```typescript
{
  dayIndex: number;        // 0-based index
  date: string;           // ISO date format (YYYY-MM-DD)
  events: Event[];        // Array of events (min 1 across all days)
}
```

### Event Object
```typescript
{
  id: string;             // Auto-generated UUID
  name: string;           // Event name
  time: string;           // Time format (HH:MM)
  venue: string;          // Venue name
}
```

---

## Testing

### Using curl

**Create Wedding:**
```bash
curl -X POST http://localhost:8001/api/wedding/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Royal Wedding 2026",
    "location": "Udaipur Palace",
    "startDate": "2026-08-20",
    "endDate": "2026-08-22",
    "days": [
      {
        "dayIndex": 0,
        "date": "2026-08-20",
        "events": [
          {"name": "Welcome Ceremony", "time": "18:00", "venue": "Palace Garden"}
        ]
      }
    ]
  }'
```

**Get Wedding:**
```bash
curl http://localhost:8001/api/wedding/47df2845-a123-4567-89ab-cdef01234567
```

**Test Validation (Empty Name):**
```bash
curl -X POST http://localhost:8001/api/wedding/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "location": "Test",
    "startDate": "2026-08-20",
    "endDate": "2026-08-22",
    "days": [{"dayIndex": 0, "date": "2026-08-20", "events": [{"name": "Event", "time": "18:00", "venue": "Venue"}]}]
  }'
# Expected: 400 Bad Request - "Wedding name is required"
```

**Test Validation (No Days):**
```bash
curl -X POST http://localhost:8001/api/wedding/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wedding",
    "location": "Test",
    "startDate": "2026-08-20",
    "endDate": "2026-08-22",
    "days": []
  }'
# Expected: 400 Bad Request - "At least one day is required"
```

**Test Validation (No Events):**
```bash
curl -X POST http://localhost:8001/api/wedding/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wedding",
    "location": "Test",
    "startDate": "2026-08-20",
    "endDate": "2026-08-22",
    "days": [{"dayIndex": 0, "date": "2026-08-20", "events": []}]
  }'
# Expected: 400 Bad Request - "At least one event is required"
```

### Using Python Test Suite

```bash
cd /app/backend
python test_wedding_validation.py
```

This will run comprehensive tests covering:
- Valid wedding creation
- Empty name validation
- Whitespace-only name validation
- No days validation
- No events validation
- Multiple days with no events
- Wedding retrieval by ID
- Non-existent wedding handling
- HTTP status code verification

---

## HTTP Status Codes

| Status Code | Usage | Description |
|-------------|-------|-------------|
| 200 OK | GET success | Wedding retrieved successfully |
| 201 Created | POST success | Wedding created successfully |
| 400 Bad Request | Validation error | Request validation failed |
| 404 Not Found | Resource missing | Wedding ID not found |
| 500 Internal Server Error | Server error | Unexpected server error |

---

## Validation Examples

### ✅ Valid Examples

**Minimum Valid Wedding (1 day, 1 event):**
```json
{
  "name": "Simple Wedding",
  "location": "City Hall",
  "startDate": "2026-08-20",
  "endDate": "2026-08-20",
  "days": [
    {
      "dayIndex": 0,
      "date": "2026-08-20",
      "events": [
        {"name": "Ceremony", "time": "14:00", "venue": "Main Hall"}
      ]
    }
  ]
}
```

**Multi-day Wedding:**
```json
{
  "name": "Grand Wedding",
  "location": "Resort",
  "startDate": "2026-08-20",
  "endDate": "2026-08-22",
  "days": [
    {
      "dayIndex": 0,
      "date": "2026-08-20",
      "events": [
        {"name": "Welcome Dinner", "time": "19:00", "venue": "Restaurant"}
      ]
    },
    {
      "dayIndex": 1,
      "date": "2026-08-21",
      "events": [
        {"name": "Ceremony", "time": "15:00", "venue": "Chapel"},
        {"name": "Reception", "time": "18:00", "venue": "Ballroom"}
      ]
    },
    {
      "dayIndex": 2,
      "date": "2026-08-22",
      "events": [
        {"name": "Brunch", "time": "11:00", "venue": "Garden"}
      ]
    }
  ]
}
```

### ❌ Invalid Examples

**Missing Name:**
```json
{
  "name": "",
  "location": "Test",
  "days": [...]
}
// Error: "Wedding name is required"
```

**No Days:**
```json
{
  "name": "Test Wedding",
  "location": "Test",
  "days": []
}
// Error: "At least one day is required"
```

**No Events:**
```json
{
  "name": "Test Wedding",
  "location": "Test",
  "days": [
    {"dayIndex": 0, "date": "2026-08-20", "events": []}
  ]
}
// Error: "At least one event is required"
```

---

## Storage

Weddings are stored in `/app/backend/data/wedding.json` with:
- Thread-safe file locking
- Atomic write operations
- Automatic backup on write
- JSON formatting with indentation

---

## Logging

All operations are logged with:
- INFO level for successful operations
- ERROR level for failures
- Include wedding ID and name for tracking

Example log entries:
```
INFO - Created wedding: 47df2845... - Beautiful Royal Wedding
ERROR - Error creating wedding: Validation failed
```

---

## Legacy Compatibility

The original `/api/weddings` endpoint is maintained for backward compatibility and redirects to `/api/wedding/create`.

---

## Future Enhancements

- [ ] Bulk wedding creation
- [ ] Wedding search and filtering
- [ ] Wedding status (draft/published)
- [ ] Wedding templates
- [ ] Wedding sharing and collaboration
- [ ] Calendar integration
- [ ] Budget tracking per wedding
