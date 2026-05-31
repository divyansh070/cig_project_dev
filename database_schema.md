# Database Schema

The database for this platform is a relational SQL database. We use SQLAlchemy as our Object-Relational Mapper (ORM) to interact with the database.

Below is the Entity-Relationship (ER) Diagram representing the core data models.

## Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        string username
        string email
        string hashed_password
        boolean is_club_member
        boolean is_superuser
        datetime created_at
    }

    EVENTS {
        int id PK
        string name
        string description
        date date
        int creator_id FK
        boolean is_public
        datetime created_at
    }

    EVENT_ROLES {
        int id PK
        int event_id FK
        int user_id FK
        string role "Admin, Photographer, Viewer"
    }

    MEDIA {
        int id PK
        string filename
        string url
        datetime upload_date
        int event_id FK
        int uploader_id FK
        string tags "JSON format"
    }

    LIKES {
        int id PK
        int media_id FK
        int user_id FK
        datetime created_at
    }

    COMMENTS {
        int id PK
        int media_id FK
        int user_id FK
        string text
        datetime created_at
    }

    %% Relationships
    USERS ||--o{ EVENTS : "creates (Admin)"
    USERS ||--o{ EVENT_ROLES : "assigned to"
    EVENTS ||--o{ EVENT_ROLES : "has roles"
    
    EVENTS ||--o{ MEDIA : "contains"
    USERS ||--o{ MEDIA : "uploads"
    
    USERS ||--o{ LIKES : "leaves"
    MEDIA ||--o{ LIKES : "receives"
    
    USERS ||--o{ COMMENTS : "writes"
    MEDIA ||--o{ COMMENTS : "receives"
```

## Core Models Description

- **Users**: Represents the individuals on the platform. Differentiates between normal users, official club members, and superusers (developers).
- **Events**: Represents a distinct photography event (e.g., a wedding, a hackathon). Can be public (visible to everyone) or private (visible only to assigned users).
- **Event Roles**: Manages the Role-Based Access Control (RBAC). Maps a `User` to an `Event` with a specific role (`Admin`, `Photographer`, `Viewer`).
- **Media**: Represents a single photo uploaded to an event. Contains the S3 URL and the AI-generated tags.
- **Likes & Comments**: Handles the social engagement features of the platform, linking a specific `User` to a specific `Media` item.
