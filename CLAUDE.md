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
- **Firebase SDK** for future auth and storage features

### Backend
- **Firebase Functions v2** (TypeScript)
- **Firebase Storage** for image uploads/processing
- **Firebase Firestore** (ready for user features)
- **CORS** handled natively by Functions v2
- **Busboy** for multipart form handling

### AI Services (Production-ready)
- **Roboflow** - People detection API
- **ClipDrop** - Background cleanup/inpainting
- **Segmind** - Advanced mask generation

## Current Status
- **Production Deployment**: https://exeraser.web.app
- **Firebase Project**: exeraser (us-central1 region)
- **Full Implementation**: All UI/UX and API endpoints complete
- **AI Integration**: Fully integrated with Roboflow, ClipDrop, and Segmind APIs
- **Architecture**: Migrated to Firebase serverless stack

## API Endpoints
Base URL: `https://us-central1-exeraser.cloudfunctions.net/`
- `POST /uploadImage` - Upload image to Firebase Storage
- `POST /detectPeopleInImage` - Detect people using Roboflow
- `POST /processImageRemoval` - Remove selected people using ClipDrop
- `GET /downloadResult` - Get signed URL for processed image
- `GET /healthCheck` - API health status

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
- **API Keys**: Configured as Firebase Functions secrets (ROBOFLOW_API_KEY, CLIPDROP_API_KEY, SEGMIND_API_KEY)
- **Deployment**: Frontend on Firebase Hosting, backend on Firebase Functions v2
- **Environment**: Copy `.env.example` to `.env` for local Firebase config
- **Future Features**: User auth, payments, batch processing ready with Firebase infrastructure
- **Security**: Storage rules configured for anonymous uploads with 10MB limit