# Vowly



## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Lucide React** - Modern icon library

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **Pydantic** - Data validation
- **CORS** - Pre-configured for frontend-backend communication

## 📋 Prerequisites

- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB (local or cloud instance)

## 🛠️ Local Development Setup

### 1. Clone & Install

```bash
# Install frontend dependencies
cd frontend
yarn install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**Frontend (.env in /frontend)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

**Backend (.env in /backend)**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=your_database_name
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Run Development Servers

**Frontend (Terminal 1)**
```bash
cd frontend
yarn dev
```
The frontend will start at `http://localhost:3000`

**Backend (Terminal 2)**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
The backend API will start at `http://localhost:8001`

## 🔍 Health Check Endpoints

Once both servers are running, you can verify they're working:

- **Frontend Health**: http://localhost:3000/api/health
- **Backend Health**: http://localhost:8001/api/health
- **API Root**: http://localhost:8001/api/

## Wedding Management API


### API Endpoints

#### Weddings
- `POST /api/weddings` - Create a new wedding
- `GET /api/weddings` - List all weddings
- `GET /api/weddings/{id}` - Get a specific wedding
- `PUT /api/weddings/{id}` - Update a wedding
- `DELETE /api/weddings/{id}` - Delete a wedding

#### Guests
- `POST /api/guests` - Create a new guest
- `GET /api/guests?wedding_id={id}` - List guests for a wedding
- `GET /api/guests/{id}` - Get a specific guest
- `PUT /api/guests/{id}` - Update a guest
- `DELETE /api/guests/{id}` - Delete a guest

#### Vendors
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors?wedding_id={id}` - List vendors for a wedding
- `GET /api/vendors/{id}` - Get a specific vendor
- `PUT /api/vendors/{id}` - Update a vendor
- `DELETE /api/vendors/{id}` - Delete a vendor

#### Photos
- `POST /api/photos` - Create a photo entry
- `GET /api/photos?wedding_id={id}` - List photos for a wedding
- `GET /api/photos/{id}` - Get a specific photo
- `DELETE /api/photos/{id}` - Delete a photo

### Data Models

**Wedding**
```json
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

**Guest**
```json
{
  "weddingId": "wedding-id",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "attendingDays": [true, true, true],
  "dietary": "veg",
  "accommodation": true
}
```

**Vendor**
```json
{
  "weddingId": "wedding-id",
  "name": "Royal Caterers",
  "serviceType": "catering",
  "email": "info@royalcaterers.com",
  "phoneNumber": "+91-9876543210",
  "attendingDays": [false, true, true],
  "notes": "Specializes in North Indian cuisine"
}
```

### Testing the API

Run the included test script:
```bash
cd backend
python test_api.py
```

Or test manually with curl:
```bash
# Create a wedding
curl -X POST http://localhost:8001/api/weddings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wedding",
    "location": "Mumbai",
    "startDate": "2026-06-15",
    "endDate": "2026-06-17",
    "days": []
  }'
```

### Data Storage

- All data is stored in JSON files under `/backend/data/`
- Files are protected with in-memory mutex locks for concurrent access
- Atomic writes prevent data corruption
- Files are created automatically if missing

## Project Structure

```
/
├── frontend/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── layout.tsx   # Root layout
│   │   │   ├── page.tsx     # Home page
│   │   │   ├── globals.css  # Global styles
│   │   │   └── api/         # API routes
│   │   │       └── health/  # Frontend health check
│   │   ├── components/      # React components
│   │   │   └── ui/          # shadcn/ui components
│   │   └── lib/             # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── backend/                 # FastAPI backend
    ├── server.py            # Main application
    ├── requirements.txt     # Python dependencies
    └── .env                 # Environment variables
```

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_BACKEND_URL` environment variable
4. Deploy

### Backend (Railway/Render/AWS)
1. Ensure `requirements.txt` is up to date
2. Set environment variables in your platform
3. Deploy using your platform's CLI or dashboard



