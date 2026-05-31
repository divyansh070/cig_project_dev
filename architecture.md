# System Architecture

The Capture Hub platform follows a modern, decoupled client-server architecture designed for high scalability and performance, even within constrained environments. 

## High-Level Architecture Diagram

```mermaid
graph TD
    %% User Interfaces
    User([User / Photographer])
    
    %% Frontend Layer
    subgraph "Frontend Layer (Deployed on Vercel)"
        NextJS[Next.js App Router]
        React[React Components]
        Tailwind[Tailwind CSS]
        NextJS <--> React
    end

    %% Backend Layer
    subgraph "Backend Layer (Deployed on Render)"
        FastAPI[FastAPI Server]
        Auth[JWT Auth & RBAC]
        WebSockets[WebSocket Notifications]
        FastAPI <--> Auth
        FastAPI <--> WebSockets
    end

    %% Cloud Services
    subgraph "External Cloud Infrastructure"
        S3[(AWS S3 Bucket)]
        Rekognition[AWS Rekognition]
        Gemini[Google Gemini Pro Vision]
    end

    %% Database Layer
    subgraph "Data Layer (Deployed on Supabase)"
        DB[(PostgreSQL Database)]
    end

    %% Connections
    User <-->|HTTPS| NextJS
    User <-->|WSS| WebSockets
    NextJS <-->|REST API| FastAPI
    
    FastAPI <-->|SQLAlchemy ORM| DB
    
    FastAPI -->|Direct Upload/Stream| S3
    FastAPI -->|Face Index/Search| Rekognition
    FastAPI -->|Image Analysis| Gemini
    
    %% Styling
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:white;
    classDef server fill:#10b981,stroke:#047857,stroke-width:2px,color:white;
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:white;
    classDef cloud fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:white;
    
    class NextJS,React,Tailwind client;
    class FastAPI,Auth,WebSockets server;
    class DB database;
    class S3,Rekognition,Gemini cloud;
```

## Deployment & Scalability Architecture

1. **Frontend (Vercel)**: 
   - A highly responsive SPA built with Next.js deployed on Vercel's Edge Network for global low-latency delivery.
2. **Backend (Render)**:
   - A high-performance Python ASGI application using FastAPI hosted on Render.
   - **Scalability Feature**: Dispatches heavy ML tasks (like AI tagging and facial indexing) to asynchronous background workers. This strictly prevents the 512MB RAM container from crashing with OOM errors during concurrent heavy loads.
3. **Database (Supabase)**:
   - Fully managed PostgreSQL database hosted on Supabase, interacting with the backend via SQLAlchemy ORM.
4. **Cloud Storage (AWS S3)**:
   - Media is not streamed directly through the constrained Render server. Instead, FastAPI generates AWS S3 pre-signed URLs, allowing clients to stream high-res images directly from Amazon's infrastructure.
5. **AI Inference Offloading**:
   - **Facial Recognition**: AWS Rekognition performs massive facial feature matrices comparisons in the cloud, bypassing local memory limits.
   - **Semantic Tagging**: Google Gemini Pro Vision handles complex image understanding and natural language generation for search tags.
