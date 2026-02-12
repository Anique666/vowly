# AI Wedding Ops - Product Requirements Document

## Overview
AI Wedding Ops is a full-stack wedding planning application with AI-powered assistance for managing guests, vendors, and multi-day events.

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript/JavaScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **AI/LLM**: Groq API (Mixtral)
- **Email**: Resend API

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
  - Post-wedding photo gallery
  - Shared header and footer components

## Known Limitations
- Resend email requires domain verification for non-sandbox sending
- Twilio SMS integration not configured (missing API keys)

## Future/Backlog
- SMS notifications for vendors (requires Twilio keys)
- Photo upload functionality for post-wedding gallery
- Guest accommodation management
- Vendor payment tracking
