# System Architecture

The Capture Hub platform follows a modern, decoupled client-server architecture designed for high scalability and performance, even within constrained environments. 

## High-Level Architecture Diagram

```mermaid
graph LR
    %% Actors
    Client([👤 Client Device / Browser])

    %% Frontend Subsystem
    subgraph Frontend [🌐 Frontend Delivery Layer - Vercel Edge]
        direction TB
        NextApp(Next.js App Router)
        ReactUI[[React & Tailwind UI]]
        NextApp <--> ReactUI
    end

    %% Backend Subsystem
    subgraph Backend [⚙️ Application Compute - Render]
        direction TB
        API{{FastAPI REST Gateway}}
        Auth(JWT & RBAC Engine)
        WSS>WebSocket Manager]
        Workers[[Async Background Workers]]
        
        API <--> Auth
        API <--> WSS
        API -. "Dispatch Tasks" .-> Workers
    end

    %% Database Subsystem
    subgraph Data [🗄️ Persistence Layer - Supabase]
        direction TB
        Supabase[(PostgreSQL Database)]
        ORM[SQLAlchemy ORM]
        ORM <--> Supabase
    end

    %% Cloud Services
    subgraph Cloud [☁️ External Cloud Services]
        direction TB
        S3[(AWS S3 Object Storage)]
        Rekognition{AWS Rekognition AI}
        Gemini{Google Gemini Vision AI}
    end

    %% Data Flow & Interactions
    Client == "HTTPS" ==> NextApp
    Client <-. "WSS Live Events" .-> WSS
    NextApp == "RESTful API (JSON)" ==> API
    
    API <--> ORM
    
    Workers -. "Index Faces" .-> Rekognition
    Workers -. "Generate Metadata" .-> Gemini
    
    API == "Generate Presigned URLs" ==> S3
    S3 -. "Direct Media Stream" .-> Client

    %% Custom Brand Styling
    classDef default fill:#f9fafb,stroke:#d1d5db,stroke-width:1px,color:#1f2937,rx:5px,ry:5px;
    classDef actor fill:#f3f4f6,stroke:#6b7280,stroke-width:2px,color:#111827;
    classDef vercel fill:#000000,stroke:#374151,stroke-width:2px,color:#ffffff,rx:8px,ry:8px;
    classDef render fill:#4f46e5,stroke:#4338ca,stroke-width:2px,color:#ffffff,rx:8px,ry:8px;
    classDef supabase fill:#10b981,stroke:#047857,stroke-width:2px,color:#ffffff,rx:8px,ry:8px;
    classDef aws fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#ffffff,rx:8px,ry:8px;
    classDef google fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff,rx:8px,ry:8px;
    
    %% Assign Classes
    class Client actor;
    class NextApp,ReactUI vercel;
    class API,Auth,WSS,Workers render;
    class Supabase,ORM supabase;
    class S3,Rekognition aws;
    class Gemini google;
    
    %% Subgraph Styling
    style Frontend fill:#f3f4f6,stroke:#d1d5db,stroke-width:2px,stroke-dasharray: 5 5,rx:10px,ry:10px;
    style Backend fill:#eef2ff,stroke:#c7d2fe,stroke-width:2px,stroke-dasharray: 5 5,rx:10px,ry:10px;
    style Data fill:#ecfdf5,stroke:#a7f3d0,stroke-width:2px,stroke-dasharray: 5 5,rx:10px,ry:10px;
    style Cloud fill:#fffbeb,stroke:#fde68a,stroke-width:2px,stroke-dasharray: 5 5,rx:10px,ry:10px;
```

## Deployment & Scalability Breakdown

1. **Frontend (Vercel Edge Network)**: 
   - A highly responsive SPA built with Next.js is distributed globally via Vercel's Edge Network for optimal time-to-first-byte (TTFB) performance.
2. **Backend (Render Application Server)**:
   - A high-performance Python ASGI application using FastAPI hosted on Render.
   - **Scalability Feature**: Dispatches heavy ML tasks (like AI tagging and facial indexing) to asynchronous `BackgroundTasks`. This strictly prevents the 512MB RAM container from crashing with OOM errors during concurrent heavy loads.
3. **Database (Supabase PostgreSQL)**:
   - Fully managed PostgreSQL database hosted on Supabase, interacting with the backend via SQLAlchemy ORM.
4. **Cloud Storage (AWS S3)**:
   - Media is not streamed directly through the constrained Render server. Instead, FastAPI generates AWS S3 pre-signed URLs, allowing clients to stream high-res images directly from Amazon's infrastructure.
5. **AI Inference Offloading**:
   - **Facial Recognition**: AWS Rekognition performs massive facial feature matrices comparisons in the cloud, bypassing local memory limits entirely.
   - **Semantic Tagging**: Google Gemini Pro Vision handles complex image understanding and natural language generation for rich search tags.
