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
        WSS[WebSocket Manager]
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

## Architecting for Massive Scalability

When designing this platform, I had to overcome the strict 512MB RAM limitation of free-tier and low-tier compute instances (like Render). I achieved this through several specific architectural choices:

1. **Edge Network Delivery**: By deploying the Next.js SPA to Vercel's Edge Network, static assets and HTML are cached globally close to the user, drastically reducing Time-To-First-Byte (TTFB) and shifting bandwidth burden away from the backend.
2. **Asynchronous Background Processing**: Instead of blocking the main thread during heavy operations (like hitting external AI APIs or uploading large files to S3), the FastAPI backend immediately dispatches these tasks to non-blocking `BackgroundTasks`. This prevents memory spikes and OOM (Out Of Memory) crashes during concurrent uploads.
3. **Pre-signed URLs for Media Streaming**: To prevent the backend server from being choked by massive image bandwidth, the server never actually streams media files. Instead, it generates temporary AWS S3 Pre-signed URLs. The client's browser then fetches the uncompressed images directly from Amazon's localized infrastructure, completely decoupling compute from storage bandwidth.
4. **Cloud AI Inference Offloading**: Processing facial recognition models locally is impossible on 512MB of RAM. I innovated by utilizing AWS Rekognition to perform massive facial feature matrices comparisons entirely in the cloud, completely bypassing local compute limits.

## Architecting for Security & Data Privacy

Security was integrated deeply into the ORM and routing layers to prevent data leaks and unauthorized access:

1. **Stateless JWT Authentication**: Every API request is authenticated via securely signed JSON Web Tokens, mitigating CSRF attacks and eliminating the need for stateful server memory.
2. **Strict Foreign Key Constraints**: The SQLAlchemy ORM forces relational integrity at the database level. Deleting an event safely cascades down to delete roles, media, and comments, preventing orphaned data leaks.
3. **Dynamic Watermarking Engine**: To protect intellectual property, standard users cannot download raw assets. The backend intercepts download requests and dynamically burns a semi-transparent watermark (containing the Event Name and Photographer's Username) directly into the image bytes before serving it.
