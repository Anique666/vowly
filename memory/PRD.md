# Vowly - Product Requirements Document

## Overview
Vowly (formerly "AI Wedding Ops") is a full-stack wedding planning application with AI-powered assistance for managing guests, vendors, and multi-day events. The application features local JWT-based authentication for organizers and guests.

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript/JavaScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **AI/LLM**: Groq API (Mixtral)
- **Email**: Maileroo API (transactional emails)
- **Authentication**: Local JWT-based auth with session management


## Core Features

### Host Features
- Create and manage weddings with multi-day events
- AI-powered vendor suggestions by location
- Guest invitation system via email
- Vendor management with issue reporting

### Guest Features
- RSVP submission with day selection
- Dietary preference and accommodation options
- Guest dashboard with event schedules
- AI-powered tips and suggestions

### Dashboard Features
- Real-time countdown timer
- Guest and vendor statistics
- Day-wise event management
- AI chat assistant for hosts

### Post-Wedding
- Photo gallery for wedding memories

## Design System (Botanical Theme - Implemented Feb 2026)

### Color Palette
- **Primary**: Forest Green (#1B4332 / HSL 153, 50%, 18%)
- **Background**: Pure White (#FFFFFF)
- **Text**: Dark Gray (#1A2E1A)
- **Muted**: Soft Gray for secondary text
- **Accent**: Light green tints for highlights

### Typography
- **Headings**: Cormorant Garamond (serif, elegant, italic accents)
- **Body**: Inter (clean sans-serif)

### Components
- `btn-botanical`: Primary rounded buttons (dark green)
- `btn-botanical-outline`: Secondary outline buttons
- `card-botanical`: White cards with subtle borders
- `input-botanical`: Rounded input fields
- `pill-toggle`: Tab toggle buttons

## API Endpoints

### Wedding Management
- `POST /api/wedding/create` - Create new wedding
- `GET /api/wedding/{id}` - Get wedding details
- `GET /api/weddings` - List all weddings

### Guest Management
- `POST /api/guest/rsvp` - Submit RSVP
- `GET /api/guest/list` - Get guests for wedding

### Vendor Management
- `POST /api/vendors` - Add vendor
- `GET /api/vendor/list` - Get vendors for wedding

### AI Features
- `POST /api/ai/planner/set-details` - Set wedding context
- `POST /api/ai/planner/search-vendor` - Get vendor suggestions
- `POST /api/ai/chat` - Chat with AI assistant

### Authentication
- `POST /api/auth/signup` - Register new user (organizer/guest)
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout and invalidate session
- `POST /api/auth/validate` - Validate session token
- `POST /api/auth/update-wedding` - Link wedding to organizer account

- `POST /api/ai/guest-day-suggestions` - Guest tips

### Email
- `POST /api/email/send-invites` - Send guest invitations

## Completed Work

### February 12, 2026
- ✅ Fixed vendor suggestion logic (location-based)
- ✅ Fixed guest invitation email flow with error handling
- ✅ Fixed countdown timer with real-time updates
- ✅ **Complete frontend redesign** to Botanical Guys 3 template style
  - Landing page with toggle tabs (For Hosts/For Guests)
  - Host setup page with botanical form styling
  - Dashboard with countdown, stats cards, events
  - RSVP page with guest form
  - Guest dashboard with AI tips
  - Shared header and footer components
- ✅ **Photo Gallery Feature** with manual tagging + AI-assisted search
  - Photo upload to `/api/photos/upload` (multipart)
  - Photo tagging with `/api/photos/tag`
  - Gallery display with `/api/wedding/{id}/photos`
  - AI-powered search with `/api/ai/photo-search` (LLM extracts tags from natural language)
  - Tag editor modal in frontend
  - Lightbox for full-size viewing
  - Photo deletion

- ✅ **Maileroo Email Integration** (replaced Resend)
  - Created `/app/backend/utils/maileroo.py` utility module
  - Unified `send_email()` function for all email sending
  - Environment variables: `MAILEROO_API_KEY`, `MAILEROO_FROM_EMAIL`
  - Health check endpoint: `GET /api/email/health`
  - Updated invite and thank-you email endpoints

### Photo Gallery API Endpoints
- `POST /api/photos/upload` - Upload photos (multipart form-data)
- `POST /api/photos/tag` - Add/update photo tags
- `GET /api/wedding/{id}/photos` - Get photos for wedding
- `POST /api/ai/photo-search` - AI search intent extraction
- `GET /api/photo-tags` - Get available tags
- `DELETE /api/photos/{id}` - Delete a photo
- `GET /api/photos/file/{wedding_id}/{filename}` - Serve photo files

### February 13, 2026
- ✅ **"Vowly" Rebrand** - Updated all branding from "Wedding Planner" to "vowly"
  - Updated header/footer components
  - Updated page titles and metadata
  - Updated landing page with new branding
  
- ✅ **Local Authentication System** (JWT-based)
  - Created `/app/backend/routes/auth_routes.py` with full auth flow
  - User data stored in `/app/backend/data/users.json` (organizers & guests)
  - Session-based token management (24-hour expiry)
  - Password hashing with SHA-256
  - Auth endpoints: signup, login, logout, me, validate, update-wedding
  
- ✅ **Frontend Authentication**
  - Created `AuthContext` (`/app/frontend/src/context/AuthContext.jsx`)
  - Created `useRequireAuth` hook for route protection
  - Auth pages: `/auth/organizer` and `/auth/guest`
  - Login/Signup forms with mode toggle
  - Session persistence via localStorage
  
- ✅ **Landing Page with Three CTAs**
  - "Get started as organizer" → `/auth/organizer?mode=signup`
  - "Continue as organizer" → `/auth/organizer?mode=login`
  - "RSVP as a guest" → `/auth/guest`
  
- ✅ **Redirect Logic**
  - New organizers → `/host` (create wedding)
  - Existing organizers with wedding → `/dashboard`
  - Existing organizers without wedding → `/host`
  - Guests → `/guestdashboard`
  
- ✅ **Route Protection**
  - `/host` - Protected (organizer only)
  - `/dashboard` - Protected (organizer only)
  - `/guestdashboard` - Protected (guest only)
  - Unauthenticated users redirected to appropriate auth page
  
- ✅ **Album Button Integration**
  - Added "Album" button on organizer dashboard
  - Added "Album" button on guest dashboard
  - Both link to `/postwedding` page
  
- ✅ **UI/UX Polish with Framer Motion**
  - Page transitions with motion components
  - Button hover animations (scale, translate)
  - Smooth fade-in/fade-up animations
  - Staggered children animations on landing page
  - Form field animations
  
- ✅ **User-Wedding Association**
  - Created wedding is automatically linked to organizer account
  - Wedding ID stored in user profile
  - Backend endpoint to update user's wedding association
  - Frontend calls `updateWeddingId()` after wedding creation


## Known Limitations
- Twilio SMS integration not configured (missing API keys)
- Photo gallery uses manual tagging (no face recognition ML models)

## Future/Backlog
- SMS notifications for vendors (requires Twilio keys)
- Face recognition for auto-tagging (requires ML model integration)
- Guest accommodation management
- Vendor payment tracking
