# System Architecture

The Capture Hub platform follows a modern, decoupled client-server architecture. The frontend is built with Next.js and React, while the backend is powered by FastAPI (Python). It leverages AWS for scalable cloud storage and facial recognition, alongside Google Gemini for generative AI image tagging.

## High-Level Architecture Diagram

```mermaid
graph TD
    %% User Interfaces
    User([User / Photographer])
    
    %% Frontend Layer
    subgraph "Frontend Layer (Vercel)"
        NextJS[Next.js App Router]
        React[React Components]
        Tailwind[Tailwind CSS]
        NextJS <--> React
    end

    %% Backend Layer
    subgraph "Backend Layer (Render)"
        FastAPI[FastAPI Server]
        Auth[JWT Auth & RBAC]
        WebSockets[WebSocket Notifications]
        FastAPI <--> Auth
        FastAPI <--> WebSockets
    end

    %% Cloud Services
    subgraph "External Cloud Services"
        S3[(AWS S3 Bucket)]
        Rekognition[AWS Rekognition]
        Gemini[Google Gemini Pro Vision]
    end

    %% Database Layer
    subgraph "Data Layer"
        DB[(Relational Database)]
    end

    %% Connections
    User <-->|HTTP/HTTPS| NextJS
    User <-->|WebSockets| WebSockets
    NextJS <-->|REST API| FastAPI
    
    FastAPI <-->|SQLAlchemy ORM| DB
    
    FastAPI -->|Upload/Download| S3
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

## Component Breakdown

1. **Frontend (Client)**: 
   - A highly responsive Single Page Application (SPA) built with Next.js.
   - Communicates with the backend exclusively via REST API and WebSockets.
2. **Backend (Server)**:
   - A high-performance Python ASGI application using FastAPI.
   - Implements Role-Based Access Control (RBAC) to differentiate between Viewers, Photographers, Admins, and Superusers.
   - Dispatches heavy tasks (like AI tagging and facial indexing) to asynchronous background workers to prevent request blocking.
3. **Cloud Infrastructure**:
   - **AWS S3**: Scalable object storage for all uploaded media. Files are served directly from S3 via pre-signed URLs to reduce server load.
   - **AWS Rekognition**: Used to index uploaded faces and perform facial search ("Find Myself" feature) without consuming server RAM.
   - **Google Gemini**: Used to analyze image contents and automatically generate descriptive metadata tags for semantic search.
