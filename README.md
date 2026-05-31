# 📸 Capture Hub - Next-Generation Event & Media Management Platform

**Live Production Demo:** [https://cig-project-dev.vercel.app/](https://cig-project-dev.vercel.app/)

Capture Hub is an enterprise-grade, highly scalable Event & Media Management Platform designed for modern photography workflows. It empowers event organizers and professional photographers to securely curate, organize, and share high-quality media with attendees. Built from the ground up to solve real-world media scaling issues, the platform leverages advanced Cloud Infrastructure and Artificial Intelligence to provide automated tagging, real-time social engagement, and lightning-fast facial recognition.

---

## ✨ Platform Highlights & Features

Our platform is engineered to deliver a seamless experience across all touchpoints, from media ingestion to user discovery.

### Advanced Media Management
- **High-Fidelity Image Hosting**: Supports batch uploading of high-resolution images across diverse formats (JPG, PNG, WebP). 
- **Dynamic Asset Protection**: To protect intellectual property, all user downloads are routed through a dynamic watermarking engine. The backend seamlessly burns a semi-transparent watermark containing the specific Event Name and the Photographer's Username directly into the image upon request.
- **Granular Gallery Filtering**: Effortless exploration of event galleries, utilizing metadata and AI-generated tags for rapid media discovery.

### Artificial Intelligence & Machine Learning (AI/ML)
- **Facial Recognition Engine ("Find Myself")**: Finding photos in a massive event gallery can be tedious. Users can upload a quick selfie, and our backend utilizes **AWS Rekognition** to instantly scan thousands of indexed faces, returning every single photograph they appear in.
- **Automated Semantic Tagging**: Every uploaded photograph is asynchronously processed by **Google Gemini Pro Vision**, which generates rich, descriptive metadata tags (e.g., "outdoor, sunset, wedding, bride"). This eliminates manual data entry and supercharges the search experience.

### Real-Time Social Engagement
- **Live Notifications**: The platform integrates an active WebSocket connection, pushing instant, non-intrusive toast notifications to users whenever their uploaded media receives a Like or a Comment.
- **Contextual Deep Linking**: Clicking on a live notification doesn't just take you to the event—it utilizes URL query parameters (`?photo=id`) to seamlessly deep-link the user directly into the specific media modal, drastically reducing friction.

### Security, Authentication & Access Control
- **Role-Based Access Control (RBAC)**: Comprehensive permission structures safeguard private event data.
  - `Viewer`: Authorized to view public events and interact with media.
  - `Photographer`: Authorized to upload new media to explicitly assigned events.
  - `Admin`: Full organizational control over specific event roles and content moderation.
  - `Superuser` (Developer): Global administrative bypass for platform-wide oversight.
- **JWT Authentication**: Secure, stateless JSON Web Token architecture protecting all API endpoints.

---

## 🏗️ Cloud Integration & Architecture

The application is deployed using a decoupled, highly-available microservices approach to ensure massive scalability and geographic edge delivery.

* **Frontend Delivery (Vercel)**: The Next.js Single Page Application is deployed on Vercel's global Edge Network, ensuring blazing-fast initial load times and optimized asset caching.
* **Backend Compute (Render)**: The ASGI FastAPI Python application is hosted on Render. 
* **Managed Database (Supabase)**: We utilize Supabase as a fully-managed PostgreSQL database, ensuring robust data persistence and ACID compliance.
* **Scalable Object Storage (AWS S3)**: Rather than routing massive image files through the constrained Render compute instance, the backend generates **AWS S3 Pre-signed URLs**. This allows clients to stream uncompressed media directly from Amazon's localized infrastructure, completely eliminating server bandwidth bottlenecks.

*(For a visual representation of this data flow, please view our [Architecture Diagram](./architecture.md))*

---

## 💻 Tech Stack & Code Quality

We prioritized modern tooling, strict typing, and scalable design patterns throughout the codebase.

### Exceptional UI/UX Design
The interface was crafted using **Next.js (App Router)** and **React 18**, styled entirely with **Tailwind CSS**. We implemented a premium "glassmorphism" aesthetic with layered transparencies, complemented by smooth micro-animations via **Framer Motion**. The application is rigorously tested to be fully responsive across mobile, tablet, and desktop environments.

### Robust Backend Architecture & APIs
The RESTful backend is built on **FastAPI (Python)**. API routers are strictly modularized (`auth`, `events`, `media`, `social`, `ai`, `face`) adhering to the MVC pattern. 

**Scalability & OOM Prevention**: 
To prevent Out-Of-Memory (OOM) crashes in resource-constrained environments (like our 512MB RAM instance), we completely offloaded heavy AI inference to the cloud. Furthermore, all AI processing and S3 uploads are dispatched to **Asynchronous Background Workers** (`BackgroundTasks`). This immediately frees up the main thread, resulting in zero-blocking HTTP responses even during bulk uploads.

### Database Integrity
Powered by **SQLAlchemy ORM**, the database enforces strict relational integrity, utilizing Foreign Keys, cascading deletions, and distinct constraints across six interconnected tables (`Users`, `Events`, `Event_Roles`, `Media`, `Likes`, `Comments`).

*(Review the complete relational structure in our [Database Schema Diagram](./database_schema.md))*

---

## 🚀 Developer Installation Guide

To run the full stack locally for development or evaluation:

### 1. Repository Setup
```bash
git clone https://github.com/divyansh070/cig_project_dev.git
cd cig_project_dev
```

### 2. Backend Initialization
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file within the `backend` directory containing:
```env
# Database (Supabase PostgreSQL URL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# AWS Configurations (S3 & Rekognition)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=eu-north-1

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Security
DEVELOPER_USERNAMES=your_admin_username
```

Start the FastAPI ASGI server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Initialization
Open a secondary terminal window:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to interact with the platform.