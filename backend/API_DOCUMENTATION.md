# Wedding Management API Documentation

## Overview

This API provides complete wedding management capabilities including weddings, guests, vendors, and photos. All data is stored in JSON files with thread-safe file locking.

## Base URL

```
Production: https://your-domain.com/api
Local: http://localhost:8001/api
```

## Authentication

Currently no authentication required (MVP). Add JWT/OAuth as needed.

---

## Endpoints

### Weddings

#### Create Wedding
```http
POST /api/weddings
Content-Type: application/json

{
  "name": "Sarah & John Wedding",
  "location": "Mumbai, India",
  "startDate": "2026-06-15",
  "endDate": "2026-06-17",
  "days": [
    {
      "dayIndex": 0,
      "date": "2026-06-15",
      "events": [
        {
          "name": "Mehendi",
          "time": "18:00",
          "venue": "Garden Hall"
        }
      ]
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Sarah & John Wedding",
  "location": "Mumbai, India",
  "startDate": "2026-06-15",
  "endDate": "2026-06-17",
  "days": [...],
  "vendors": []
}
```

#### List All Weddings
```http
GET /api/weddings
```

**Response:** `200 OK` - Array of wedding objects

#### Get Wedding by ID
```http
GET /api/weddings/{wedding_id}
```

**Response:** `200 OK` - Wedding object
**Error:** `404 Not Found` if wedding doesn't exist

#### Update Wedding
```http
PUT /api/weddings/{wedding_id}
Content-Type: application/json

{
  "name": "Updated Wedding Name",
  "location": "New Location",
  ...
}
```

**Response:** `200 OK` - Updated wedding object

#### Delete Wedding
```http
DELETE /api/weddings/{wedding_id}
```

**Response:** `200 OK`
```json
{
  "message": "Wedding deleted successfully",
  "id": "uuid"
}
```

---

### Guests

#### Create Guest
```http
POST /api/guests
Content-Type: application/json

{
  "weddingId": "wedding-uuid",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "attendingDays": [true, true, true],
  "dietary": "veg",
  "accommodation": true
}
```

**Dietary Options:** `"veg"`, `"non-veg"`, `"jain"`, `"vegan"`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "weddingId": "wedding-uuid",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "attendingDays": [true, true, true],
  "dietary": "veg",
  "accommodation": true
}
```

#### List Guests
```http
GET /api/guests
GET /api/guests?wedding_id={wedding_id}  # Filter by wedding
```

**Response:** `200 OK` - Array of guest objects

#### Get Guest by ID
```http
GET /api/guests/{guest_id}
```

**Response:** `200 OK` - Guest object

#### Update Guest
```http
PUT /api/guests/{guest_id}
Content-Type: application/json

{
  "weddingId": "wedding-uuid",
  "name": "Updated Name",
  "email": "updated@example.com",
  "attendingDays": [true, false, true],
  "dietary": "vegan",
  "accommodation": false
}
```

**Response:** `200 OK` - Updated guest object

#### Delete Guest
```http
DELETE /api/guests/{guest_id}
```

**Response:** `200 OK`

---

### Vendors

#### Create Vendor
```http
POST /api/vendors
Content-Type: application/json

{
  "weddingId": "wedding-uuid",
  "name": "Royal Caterers",
  "serviceType": "catering",
  "email": "info@royalcaterers.com",
  "phoneNumber": "+91-9876543210",
  "attendingDays": [false, true, true],
  "notes": "Specializes in North Indian cuisine"
}
```

**Service Types:** `"catering"`, `"photography"`, `"decoration"`, `"music"`, `"venue"`, etc.

**Response:** `200 OK` - Vendor object with generated ID

#### List Vendors
```http
GET /api/vendors
GET /api/vendors?wedding_id={wedding_id}  # Filter by wedding
```

**Response:** `200 OK` - Array of vendor objects

#### Get Vendor by ID
```http
GET /api/vendors/{vendor_id}
```

**Response:** `200 OK` - Vendor object

#### Update Vendor
```http
PUT /api/vendors/{vendor_id}
Content-Type: application/json

{
  "weddingId": "wedding-uuid",
  "name": "Updated Vendor Name",
  ...
}
```

**Response:** `200 OK` - Updated vendor object

#### Delete Vendor
```http
DELETE /api/vendors/{vendor_id}
```

**Response:** `200 OK`

---

### Photos

#### Create Photo
```http
POST /api/photos
Content-Type: application/json

{
  "weddingId": "wedding-uuid",
  "dayIndex": 1,
  "eventId": "event-uuid",
  "url": "https://example.com/photo.jpg",
  "caption": "Beautiful moment"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "weddingId": "wedding-uuid",
  "dayIndex": 1,
  "eventId": "event-uuid",
  "url": "https://example.com/photo.jpg",
  "caption": "Beautiful moment",
  "uploadedAt": "2026-02-12T15:27:49.233883"
}
```

#### List Photos
```http
GET /api/photos
GET /api/photos?wedding_id={wedding_id}  # Filter by wedding
```

**Response:** `200 OK` - Array of photo objects

#### Get Photo by ID
```http
GET /api/photos/{photo_id}
```

**Response:** `200 OK` - Photo object

#### Delete Photo
```http
DELETE /api/photos/{photo_id}
```

**Response:** `200 OK`

---

## Data Models

### Wedding
```typescript
{
  id: string;              // Auto-generated UUID
  name: string;            // Wedding name
  location: string;        // Venue location
  startDate: string;       // ISO date string
  endDate: string;         // ISO date string
  days: Day[];            // Array of wedding days
  vendors: WeddingVendor[]; // Vendor references
}
```

### Day
```typescript
{
  dayIndex: number;        // 0-based day index
  date: string;           // ISO date string
  events: Event[];        // Events on this day
}
```

### Event
```typescript
{
  id: string;             // Auto-generated UUID
  name: string;           // Event name
  time: string;           // Time (e.g., "18:00")
  venue: string;          // Venue name
}
```

### Guest
```typescript
{
  id: string;                 // Auto-generated UUID
  weddingId: string;          // Reference to wedding
  name: string;               // Guest name
  email?: string;             // Optional email
  attendingDays: boolean[];   // Array matching wedding days
  dietary: string;            // "veg" | "non-veg" | "jain" | "vegan"
  accommodation: boolean;     // Needs accommodation
}
```

### Vendor
```typescript
{
  id: string;                 // Auto-generated UUID
  weddingId: string;          // Reference to wedding
  name: string;               // Vendor name
  serviceType: string;        // Service category
  email?: string;             // Optional email
  phoneNumber?: string;       // Optional phone
  attendingDays: boolean[];   // Days vendor is needed
  notes?: string;             // Additional notes
}
```

### Photo
```typescript
{
  id: string;             // Auto-generated UUID
  weddingId: string;      // Reference to wedding
  dayIndex?: number;      // Optional day index
  eventId?: string;       // Optional event reference
  url: string;            // Photo URL
  caption?: string;       // Optional caption
  uploadedAt: string;     // ISO timestamp
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Item with id 'xyz' not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message"
}
```

---

## File Storage

- **Location:** `/backend/data/`
- **Files:** `wedding.json`, `guests.json`, `vendors.json`, `photos.json`
- **Thread Safety:** In-memory mutex locks prevent concurrent write conflicts
- **Atomic Writes:** Temp file + rename ensures data integrity

---

## Testing

### Using curl
```bash
# Create a wedding
curl -X POST http://localhost:8001/api/weddings \
  -H "Content-Type: application/json" \
  -d @wedding.json

# Get all guests for a wedding
curl "http://localhost:8001/api/guests?wedding_id=YOUR_WEDDING_ID"
```

### Using Python Script
```bash
cd backend
python test_api.py
```

---

## Future Enhancements

- [ ] Add authentication (JWT/OAuth)
- [ ] Implement pagination for large datasets
- [ ] Add search and filtering capabilities
- [ ] Implement file upload for photos
- [ ] Add email notifications for guests
- [ ] Export data to CSV/Excel
- [ ] Add analytics and reporting
- [ ] Implement real-time updates (WebSockets)
