# Capture Hub - Photography Management Platform

An intelligent, scalable, and highly interactive Event & Media Management Platform. Capture Hub allows event organizers to privately and securely share high-quality photos with their attendees, leveraging cutting-edge Artificial Intelligence for automated tagging and facial recognition.

## 🌟 Core Features

- **Role-Based Access Control (RBAC)**: Secure access levels (Superuser, Admin, Photographer, Viewer) to protect private event data.
- **AI-Powered "Find Myself" (Facial Recognition)**: Upload a selfie and our AI will instantly scan the entire event database to find every photo you appear in using AWS Rekognition.
- **Smart Auto-Tagging**: Every uploaded photo is automatically analyzed by Google Gemini Pro Vision to generate descriptive tags, enabling powerful semantic search.
- **Real-time Social Interactions**: Live WebSocket-powered notifications for when users like or comment on photos.
- **Dynamic Watermarking**: Photos downloaded by standard users are dynamically watermarked on the fly to protect the photographer's intellectual property.
- **Cloud-Native Storage**: Highly scalable image storage leveraging AWS S3.

## 📄 Documentation

For a detailed breakdown of the technical implementation, please review the following documents:

1. **[Architecture Diagram](./architecture.md)**: A visual representation of our Next.js + FastAPI + AWS cloud architecture.
2. **[Database Schema](./database_schema.md)**: An Entity-Relationship (ER) diagram mapping out our relational database structure.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js (App Router)
- **Library**: React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Background Tasks**: FastAPI BackgroundTasks for async AI processing

### Cloud & AI Integration
- **Storage**: Amazon S3 (Scalable Media Storage)
- **Facial Recognition**: Amazon Rekognition (`IndexFaces`, `SearchFacesByImage`)
- **Generative AI**: Google Gemini Pro Vision (Automated Image Tagging)

## 🚀 Local Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/divyansh070/cig_project_dev.git
cd cig_project_dev
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with the following variables:
```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=eu-north-1

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Admin Settings
DEVELOPER_USERNAMES=your_admin_username
```

Run the backend server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The application will now be running on `http://localhost:3000`.