# Next.js 14 + FastAPI Starter Template

A modern, production-ready hackathon starter template featuring Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui, and a FastAPI backend.

## 🚀 Tech Stack

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

## 📁 Project Structure

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

## 🎨 Customization

### Adding New Components

shadcn/ui components are already installed. The component library is located in `/frontend/src/components/ui/`. To use them:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### Color Scheme

The template uses a maroon and white color scheme (perfect for hackathons). To customize:

Edit `/frontend/src/app/globals.css` and modify the CSS variables:
```css
:root {
  --primary: 0 68% 42%;  /* Maroon color */
  /* ... other variables */
}
```

### Adding Backend Routes

Add new API routes in `/backend/server.py`:

```python
@api_router.get("/your-route")
async def your_function():
    return {"data": "your response"}
```

All routes are automatically prefixed with `/api/`.

## 🔧 Available Scripts

### Frontend
```bash
yarn dev      # Start development server
yarn build    # Build for production
yarn start    # Start production server
yarn lint     # Run ESLint
```

### Backend
```bash
# Development with auto-reload
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Production
uvicorn server:app --host 0.0.0.0 --port 8001
```

## 📦 Adding Dependencies

### Frontend
```bash
cd frontend
yarn add package-name
```

### Backend
```bash
cd backend
pip install package-name
# Update requirements.txt
pip freeze > requirements.txt
```

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_BACKEND_URL` environment variable
4. Deploy

### Backend (Railway/Render/AWS)
1. Ensure `requirements.txt` is up to date
2. Set environment variables in your platform
3. Deploy using your platform's CLI or dashboard

## 🔐 CORS Configuration

CORS is pre-configured in the backend to allow requests from your frontend. Update `CORS_ORIGINS` in backend `.env` to restrict origins in production.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

This is a hackathon starter template. Feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

**Happy Hacking! 🚀**
