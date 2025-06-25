# X Eraser Project

## Overview
X Eraser (branded as "Exerase") is an AI-powered web application that helps users remove people from photos with professional-quality results. The app specifically targets the emotionally sensitive use case of removing ex-partners from photos, allowing users to "reclaim their memories" after relationships end.

## Project Structure
```
exeraser-prototype/
├── Frontend (React)
│   ├── App.jsx              # Main React app component
│   ├── LandingPage.jsx      # Marketing/landing page
│   ├── EditorPage.jsx       # Main photo editing interface
│   ├── imageAPI.js          # Frontend API client
│   ├── App.css              # Global styles
│   └── index.html           # Entry HTML file
├── Backend (Flask)
│   ├── main.py              # Flask app entry point
│   ├── image_simple.py      # Simplified API routes (demo mode)
│   ├── image.py             # Full API implementation
│   └── ai_services.py       # AI service integrations
└── Documentation
    ├── Various .md files    # Project specs and guides
    └── interface_mockup.png # UI mockup
```

## Key Features
1. **Drag-and-drop image upload** with file validation
2. **AI-powered person detection** using Roboflow API
3. **Interactive person selection** with visual highlighting
4. **Advanced background inpainting** via ClipDrop API
5. **Fast vs Quality processing modes**
6. **Secure image handling** with 24-hour auto-deletion
7. **Responsive design** for desktop and mobile

## Technical Stack
### Frontend
- **React 18** with Vite build tool
- **shadcn/ui** components with Tailwind CSS
- **React Router DOM** for navigation
- **Lucide React** for icons

### Backend
- **Flask** with Python 3.11
- **SQLAlchemy** with SQLite (for future user features)
- **CORS** enabled for API access
- **Multipart form** handling for image uploads

### AI Services (Production-ready)
- **Roboflow** - People detection API
- **ClipDrop** - Background cleanup/inpainting
- **Segmind** - Advanced mask generation

## Current Status
- **Demo Mode Active**: Currently using mock AI responses to avoid API costs
- **Live Deployment**: https://xlhyimcjgd8m.manus.space
- **Full Implementation**: All UI/UX and API endpoints complete
- **AI Integration**: Code ready, awaiting API keys

## API Endpoints
- `POST /api/image/upload` - Upload image
- `POST /api/image/detect-people` - Detect people in image
- `POST /api/image/remove-people` - Remove selected people
- `GET /api/image/download/<result_id>` - Download processed image
- `GET /api/image/status` - Health check

## Design Philosophy
- **Emotional Sensitivity**: Acknowledges personal nature of use case
- **Professional Quality**: Natural-looking results
- **Privacy First**: Secure processing, auto-deletion
- **Simple UX**: Accessible to non-technical users

## Color Scheme
- Primary: Deep Purple (#6366F1) - transformation/healing
- Secondary: Soft Coral (#FF6B6B) - warmth/support
- Accent: Bright Cyan (#06D6A0) - success/positive outcomes

## Development Notes
- To activate full AI mode: Add API keys to environment variables
- Frontend served from Flask static directory in production
- Mock mode allows full testing without API costs
- Prepared for future features: user auth, payments, batch processing