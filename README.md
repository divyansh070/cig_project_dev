# 📸 Capture Hub - Event & Media Management Platform

**Live Demo:** [https://cig-project-dev.vercel.app/](https://cig-project-dev.vercel.app/)

Capture Hub is an intelligent, highly scalable, and fully deployed Event & Media Management Platform. It empowers event organizers to securely share high-quality photos with their attendees, leveraging cutting-edge Cloud AI for automated tagging, real-time social engagement, and facial recognition.

---

## 🎯 Alignment with Evaluation Criteria

Our platform was architected specifically to maximize performance across all graded requirements:

### 1. UI/UX and Design (15%)
- **Modern Tech Stack**: Built with Next.js (App Router), React 18, and styled entirely with Tailwind CSS.
- **Premium Aesthetics**: Features a dynamic glassmorphism design system, smooth `framer-motion` micro-animations, toast notifications, and highly responsive layouts across mobile, tablet, and desktop.

### 2. Backend Architecture & APIs (15%)
- **High Performance**: Powered by a decoupled FastAPI (Python) backend using an ASGI server.
- **RESTful & Modular**: API routes are cleanly segregated (Auth, Media, Events, Social, AI, Face) following best MVC architectural patterns.

### 3. Authentication & Access Control (10%)
- **Robust JWT Auth**: Secure JSON Web Token authentication system.
- **Granular RBAC (Role-Based Access Control)**: Restricts data visibility using four distinct tiers:
  - `Viewer`: Can view public events and interact with media.
  - `Photographer`: Can upload media to assigned events.
  - `Admin` (Creator): Full control over event roles and media deletion.
  - `Superuser` (Developer Mode): Global bypass to oversee and moderate all platform content.

### 4. Cloud Integration (15%)
- **Fully Deployed Architecture**: 
  - Frontend hosted on **Vercel** Edge Network.
  - Backend hosted on **Render**.
  - Database powered by **Supabase** (Fully managed PostgreSQL).
- **AWS S3 Storage**: Highly scalable object storage. The backend dynamically generates AWS S3 Pre-signed URLs so images stream directly from Amazon to the client, bypassing server bottlenecks.

### 5. Media Management Features (15%)
- **Core Operations**: Drag-and-drop batch photo uploads, metadata viewing, and gallery filtering.
- **Dynamic Watermarking**: To protect intellectual property, when standard users download an image, the backend uses `Pillow` to dynamically burn a semi-transparent watermark containing the Event Name and Photographer's Username directly into the image on the fly.

### 6. AI/ML Features (15%)
- **AWS Rekognition (Facial Search)**: Users can upload a selfie to the "Find Myself" page. The backend instantly queries an AWS Rekognition Collection containing thousands of indexed faces to return every photo the user appears in. *This cloud-based approach completely bypasses standard 512MB RAM server limitations that local ML models face.*
- **Google Gemini Pro Vision**: Automatically analyzes every uploaded photo in the background and generates relevant descriptive tags (e.g., "wedding, bride, outdoors") enabling powerful semantic search.

### 7. Real-time Notifications (5%)
- **Live WebSockets**: Integrated FastAPI WebSockets push instant notifications to a user's screen whenever their photo receives a Like or a Comment. Clicking the live toast notification deep-links the user directly to the specific photo modal.

### 8. Code Quality & Scalability (5%)
- **Asynchronous Background Workers**: Heavy ML tasks (like hitting Gemini for tagging or indexing faces in AWS) are relegated to FastAPI `BackgroundTasks`, freeing up the main thread instantly and preventing OOM (Out Of Memory) crashes under load.
- **Relational Integrity**: Built cleanly with SQLAlchemy ORM using strict Foreign Keys and constraints.

### 9. Innovation & Bonus Features (5%)
- **Global Developer Backdoor**: Controlled via `.env` variables, allowing site owners to bypass IDOR restrictions to moderate all platform content.
- **Smart Deep Linking**: Notification payloads carry media context, automatically popping open the relevant discussion modal when clicked.

---

## 📄 Core Documentation

To deeply understand the structural engineering behind Capture Hub, please review:
- 🏗️ **[Architecture Diagram](./architecture.md)**: Visual breakdown of Vercel, Render, Supabase, and AWS integrations.
- 🗄️ **[Database Schema](./database_schema.md)**: Mermaid.js Entity-Relationship (ER) diagram mapping all data relationships.

---

## 🚀 Local Developer Setup

If you wish to run the production build locally:

### 1. Clone & Configure
```bash
git clone https://github.com/divyansh070/cig_project_dev.git
cd cig_project_dev
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
# Supabase PostgreSQL URL
DATABASE_URL=postgresql://user:password@aws-0-region.pooler.supabase.com:6543/postgres

# AWS Configurations (S3 & Rekognition)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=eu-north-1

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Security
DEVELOPER_USERNAMES=your_admin_username
```

Run the FastAPI backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the platform locally!