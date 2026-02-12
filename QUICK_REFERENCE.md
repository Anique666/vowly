# Wedding Management API - Quick Reference

## 🚀 Quick Start

```bash
# Start backend (from /app/backend)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Run test suite
python test_api.py

# View API docs
open http://localhost:8001/docs
```

## 📚 Common Operations

### Create a Wedding
```bash
curl -X POST http://localhost:8001/api/weddings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wedding Name",
    "location": "City, Country",
    "startDate": "2026-06-15",
    "endDate": "2026-06-17",
    "days": [
      {
        "dayIndex": 0,
        "date": "2026-06-15",
        "events": [
          {"name": "Event Name", "time": "18:00", "venue": "Venue Name"}
        ]
      }
    ]
  }'
```

### Add Guest
```bash
curl -X POST http://localhost:8001/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "WEDDING_ID",
    "name": "Guest Name",
    "email": "guest@example.com",
    "attendingDays": [true, true, true],
    "dietary": "veg",
    "accommodation": true
  }'
```

### Add Vendor
```bash
curl -X POST http://localhost:8001/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "WEDDING_ID",
    "name": "Vendor Name",
    "serviceType": "catering",
    "email": "vendor@example.com",
    "phoneNumber": "+1-234-567-8900",
    "attendingDays": [false, true, true],
    "notes": "Additional information"
  }'
```

### List Resources
```bash
# All weddings
curl http://localhost:8001/api/weddings

# Guests for specific wedding
curl http://localhost:8001/api/guests?wedding_id=WEDDING_ID

# Vendors for specific wedding
curl http://localhost:8001/api/vendors?wedding_id=WEDDING_ID

# All photos for wedding
curl http://localhost:8001/api/photos?wedding_id=WEDDING_ID
```

### Update Guest
```bash
curl -X PUT http://localhost:8001/api/guests/GUEST_ID \
  -H "Content-Type: application/json" \
  -d '{
    "weddingId": "WEDDING_ID",
    "name": "Updated Name",
    "email": "updated@example.com",
    "attendingDays": [true, false, true],
    "dietary": "vegan",
    "accommodation": false
  }'
```

### Delete Resource
```bash
curl -X DELETE http://localhost:8001/api/weddings/WEDDING_ID
curl -X DELETE http://localhost:8001/api/guests/GUEST_ID
curl -X DELETE http://localhost:8001/api/vendors/VENDOR_ID
curl -X DELETE http://localhost:8001/api/photos/PHOTO_ID
```

## 📋 Data Model Reference

### Wedding Structure
```json
{
  "id": "auto-generated-uuid",
  "name": "Wedding Name",
  "location": "Location",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "dayIndex": 0,
      "date": "YYYY-MM-DD",
      "events": [
        {
          "id": "auto-generated-uuid",
          "name": "Event Name",
          "time": "HH:MM",
          "venue": "Venue Name"
        }
      ]
    }
  ],
  "vendors": []
}
```

### Guest Structure
```json
{
  "id": "auto-generated-uuid",
  "weddingId": "wedding-uuid",
  "name": "Guest Name",
  "email": "email@example.com",
  "attendingDays": [true, true, false],
  "dietary": "veg|non-veg|jain|vegan",
  "accommodation": true
}
```

### Vendor Structure
```json
{
  "id": "auto-generated-uuid",
  "weddingId": "wedding-uuid",
  "name": "Vendor Name",
  "serviceType": "catering|photography|decoration|music|venue",
  "email": "email@example.com",
  "phoneNumber": "+1-234-567-8900",
  "attendingDays": [false, true, true],
  "notes": "Optional notes"
}
```

## 🔑 Key Concepts

### attendingDays Array
- Boolean array matching wedding days
- `[true, true, false]` = attending days 0 and 1, not day 2
- Must match length of wedding.days array

### Dietary Options
- `"veg"` - Vegetarian
- `"non-veg"` - Non-vegetarian
- `"jain"` - Jain food
- `"vegan"` - Vegan

### Service Types (Vendors)
Common types: `catering`, `photography`, `decoration`, `music`, `venue`, `flowers`, `transport`, `makeup`

## 📂 File Locations

```
/backend/data/
├── wedding.json   # Wedding data
├── guests.json    # Guest data
├── vendors.json   # Vendor data
└── photos.json    # Photo metadata
```

## 🔍 Debugging

```bash
# Check backend logs
tail -f /var/log/supervisor/backend.out.log

# View data files
cat /app/backend/data/wedding.json | python3 -m json.tool

# Check server status
curl http://localhost:8001/api/health
```

## 🎯 Common Patterns

### Creating Complete Wedding
1. Create wedding with days and events
2. Note the wedding ID from response
3. Add guests with weddingId
4. Add vendors with weddingId
5. Add photos with weddingId

### Querying Wedding Details
1. Get wedding: `GET /api/weddings/{id}`
2. Get guests: `GET /api/guests?wedding_id={id}`
3. Get vendors: `GET /api/vendors?wedding_id={id}`
4. Get photos: `GET /api/photos?wedding_id={id}`

### Updating Attendance
1. Get current guest data
2. Modify attendingDays array
3. PUT updated guest data

## ⚠️ Important Notes

- All IDs are auto-generated UUIDs
- attendingDays arrays must align with wedding days
- File operations are thread-safe
- Data persists across server restarts
- Timestamps are auto-generated in ISO format
- Email validation is enforced by Pydantic

## 🔗 Resources

- Full API Docs: http://localhost:8001/docs
- Detailed Documentation: `/backend/API_DOCUMENTATION.md`
- Implementation Summary: `/IMPLEMENTATION_SUMMARY.md`
- Test Script: `/backend/test_api.py`
