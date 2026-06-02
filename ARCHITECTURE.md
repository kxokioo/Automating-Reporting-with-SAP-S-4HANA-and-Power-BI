# Aetheris Architecture Documentation

## System Overview

Aetheris Enterprise Analytics Platform is a modern, cloud-native analytics solution that connects enterprise systems (SAP S/4HANA, BW/4HANA) to interactive Power BI dashboards with granular role-based access control.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React SPA)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Dashboard Overview     • Power BI Embed Studio         │   │
│  │ • ETL Orchestrator       • OData Schema Explorer         │   │
│  │ • Real-time Telemetry    • RBAC Permission Manager       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ REST / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│              GATEWAY LAYER (FastAPI + Uvicorn)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • JWT Authentication        • RBAC Authorization         │   │
│  │ • Request Validation        • Error Handling             │   │
│  │ • CORS & Security Headers   • Rate Limiting              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ↓                      ↓                    ↓
    ┌─────────┐          ┌──────────┐        ┌───────────┐
    │   ETL   │          │  OData   │        │  Business │
    │ Engine  │          │  Client  │        │   Logic   │
    └─────────┘          └──────────┘        └───────────┘
         ↓                      ↓                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL (Primary)  │  Redis (Cache)  │  SQLite (Dev)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ↑                                           ↑
     ┌────────────────────────────────────────────────────┐
     │                SAP INTEGRATION LAYER               │
     │  ┌──────────────────────────────────────────────┐  │
     │  │ • S/4HANA OData V4 Gateway                   │  │
     │  │ • BW/4HANA Analytical Queries (RFC)          │  │
     │  │ • Mock SAP Seeder (Development)              │  │
     │  └──────────────────────────────────────────────┘  │
     └────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend (React + TypeScript)

**Stack:**

- React 18+ (UI Framework)
- Vite (Build Tool)
- TypeScript (Type Safety)
- Tailwind CSS (Styling)
- Recharts (Data Visualization)
- React Router (Navigation)

**Directory Structure:**

```
frontend/src/
├── components/        # Reusable UI components
│   ├── Dashboard/     # Dashboard layouts
│   ├── ETL/           # ETL orchestrator UI
│   ├── Explorer/      # OData schema explorer
│   └── Common/        # Shared components
├── pages/             # Page components
├── context/           # Global state (Auth, RBAC)
├── hooks/             # Custom React hooks
├── services/          # API communication
├── utils/             # Utility functions
└── styles/            # Global & component styles
```

**Key Features:**

- Glassmorphic UI with dark theme
- Real-time ETL pipeline visualization
- Interactive Power BI dashboard embedding
- Row-Level Security (RLS) context management
- Responsive design for desktop/tablet

### 2. Backend (FastAPI)

**Stack:**

- FastAPI (Web Framework)
- Uvicorn (ASGI Server)
- SQLAlchemy (ORM)
- Pydantic (Data Validation)
- PyJWT (Authentication)
- Passlib + Bcrypt (Password Hashing)

**Directory Structure:**

```
backend/app/
├── main.py           # Application entry point
├── config.py         # Configuration management
├── database/         # Database models & session
│   ├── base.py       # SQLAlchemy Base
│   ├── models.py     # ORM models
│   └── session.py    # Session factory
├── routers/          # API endpoint definitions
│   ├── auth.py       # Authentication endpoints
│   ├── etl.py        # ETL pipeline routes
│   ├── explorer.py   # OData explorer routes
│   └── dashboard.py  # Dashboard data routes
├── services/         # Business logic
│   ├── sap_client.py     # SAP OData integration
│   ├── etl_engine.py     # ETL orchestration
│   ├── rbac_service.py   # RBAC authorization
│   └── cache_service.py  # Redis caching
├── middleware/       # Custom middleware
│   ├── auth.py       # JWT validation
│   └── rbac.py       # Role-based access control
├── schemas/          # Pydantic request/response models
└── utils/            # Utility functions
```

**API Endpoints:**

```
Authentication:
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh
  GET    /api/auth/me

ETL Pipeline:
  GET    /api/etl/status
  POST   /api/etl/trigger
  GET    /api/etl/history
  GET    /api/etl/logs/{job_id}

OData Explorer:
  GET    /api/explorer/schemas
  GET    /api/explorer/tables
  POST   /api/explorer/query
  GET    /api/explorer/metadata/{table}

Dashboard:
  GET    /api/dashboard/data
  GET    /api/dashboard/tiles
  POST   /api/dashboard/export

Health:
  GET    /health
  GET    /health/db
  GET    /health/cache
```

### 3. Database Layer

**PostgreSQL (Production)**

```sql
-- Users & Authentication
users (id, username, email, password_hash, role_id, created_at)
roles (id, name, permissions, description)
permissions (id, name, resource, action)

-- ETL Management
etl_jobs (id, name, status, started_at, completed_at, logs)
etl_executions (id, job_id, status, records_processed, errors)

-- Data Cache
sap_tables (id, name, rows, last_sync, etl_job_id)
odata_cache (id, table_name, data, ttl, created_at)

-- Audit & Logging
audit_logs (id, user_id, action, resource, timestamp)
```

**Redis (Caching)**

- User sessions (TTL: 24 hours)
- OData query results (TTL: 1 hour)
- Aggregated dashboard data (TTL: 30 minutes)
- Rate limiting counters

**SQLite (Development)**

- Lightweight for local development
- Auto-created with mock data
- Identical schema to PostgreSQL

### 4. SAP Integration Layer

**OData Client**

```python
class SAPODataClient:
    - authenticate(username, password)
    - fetch_table(table_name, filter, select)
    - get_metadata(entity_set)
    - handle_pagination(top, skip)
```

**Supported Entities:**

- BKPF (General Ledger Header)
- BSEG (General Ledger Line Items)
- MARA (Material Master)
- MARD (Material Warehouse Data)

**Error Handling:**

- Retry mechanism with exponential backoff
- Connection timeout handling
- Invalid credential detection
- Rate limit compliance

### 5. ETL Engine

**Architecture:**

```
┌─────────────────────┐
│   ETL Orchestrator  │
│  (Main Coordinator) │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌─────────┐
│Extract │   │Transform│
└────┬───┘   └────┬────┘
     │            │
     └─────┬──────┘
           ▼
      ┌─────────┐
      │  Load   │
      └────┬────┘
           ▼
    ┌──────────────┐
    │Cache Update  │
    │Event Trigger │
    └──────────────┘
```

**Features:**

- Thread-safe pipeline execution
- Real-time progress telemetry
- Error recovery & retry logic
- Distributed task scheduling
- Webhook notifications

### 6. Authentication & Authorization

**JWT Flow:**

```
User Login
    ↓
Validate Credentials (Bcrypt)
    ↓
Generate JWT Token (HS256)
    ↓
Set Refresh Token (Secure Cookie)
    ↓
Return Access Token
    ↓
Client sends Authorization header
    ↓
Middleware validates signature & expiry
    ↓
Extract claims (user_id, role, permissions)
```

**RBAC Model:**

```
User ──has─→ Role ──has─→ Permission

Permission = (Resource, Action)

Examples:
- admin: all resources, all actions
- finance: BKPF/BSEG tables, view & export
- logistics: MARA/MARD tables, view only
- viewer: dashboard only, view only
```

## Data Flow

### 1. Dashboard Load Flow

```
User opens dashboard
    ↓
Frontend requests /api/dashboard/data
    ↓
Backend checks JWT + RBAC permissions
    ↓
Query Redis cache (if available)
    ↓
If cache miss → Query PostgreSQL
    ↓
Apply RLS filtering (user-specific data)
    ↓
Return JSON response
    ↓
Frontend renders with Recharts
```

### 2. ETL Pipeline Flow

```
User triggers ETL
    ↓
Backend validates user role (admin only)
    ↓
Create ETL job record
    ↓
Extract: Connect to SAP → Fetch BKPF/MARA data
    ↓
Transform: Data cleaning, aggregation, validation
    ↓
Load: Insert/update PostgreSQL tables
    ↓
Cache invalidation: Clear Redis entries
    ↓
Trigger webhooks (optional)
    ↓
Frontend polls /api/etl/status for progress
    ↓
Display real-time terminal logs
```

### 3. OData Explorer Flow

```
User explores SAP schema
    ↓
Frontend requests /api/explorer/schemas
    ↓
Backend queries SAP metadata
    ↓
Cache results in Redis
    ↓
Frontend displays available tables
    ↓
User selects table + filters
    ↓
Frontend requests /api/explorer/query
    ↓
Backend constructs OData filter
    ↓
Execute SAP query
    ↓
Return limited results (pagination)
    ↓
Frontend displays in table view
```

## Deployment Topology

### Development

```
Single Machine
├── Backend (localhost:8000)
├── Frontend (localhost:5173)
├── PostgreSQL (localhost:5432)
└── Redis (localhost:6379)
```

### Production (Docker Compose)

```
Docker Compose Network
├── Frontend Container (nginx)
├── Backend Container (uvicorn x N)
├── PostgreSQL Container
├── Redis Container
└── Nginx Reverse Proxy
```

### Enterprise (Kubernetes)

```
Kubernetes Cluster
├── Frontend Pod (replicas: 3)
├── Backend Pod (replicas: 5)
├── PostgreSQL StatefulSet
├── Redis Cache Pod
├── Nginx Ingress
└── Persistent Volumes
```

## Security Architecture

### Authentication

- JWT tokens (HS256)
- Bcrypt password hashing
- Secure refresh token rotation
- HTTPS only in production

### Authorization

- Role-Based Access Control (RBAC)
- Resource-Level permissions
- Row-Level Security (RLS) for dashboards
- API endpoint protection

### Data Protection

- Encrypted connections to SAP
- Database encryption at rest
- Sensitive field masking in logs
- PII handling compliance

### Network Security

- CORS restrictions
- Rate limiting per endpoint
- API key validation for webhooks
- Firewall rules (prod)

## Performance Optimization

### Caching Strategy

- Redis for session management
- OData query results (1h TTL)
- Dashboard aggregations (30m TTL)
- Metadata caching

### Database Optimization

- Connection pooling (max 20)
- Query indexing on common filters
- Pagination for large datasets
- Batch operations for ETL

### Frontend Optimization

- Code splitting with Vite
- Lazy loading of components
- Image optimization
- Gzip compression

## Monitoring & Observability

### Metrics

- API response times
- Database query duration
- ETL pipeline execution time
- Cache hit/miss rates
- User session count

### Logging

- Structured JSON logs
- Request/response logging
- Error stack traces
- ETL execution logs

### Alerting

- Database connection failures
- High error rates (>1%)
- ETL job failures
- Memory/CPU thresholds

## Scaling Considerations

### Horizontal Scaling

- Stateless backend design
- Session store in Redis
- Load balancer (Nginx/AWS ELB)
- Multiple database replicas

### Vertical Scaling

- Increase container resources
- Optimize query performance
- Increase cache size
- Database query tuning

## Technology Decisions

| Component          | Choice       | Rationale                                  |
| ------------------ | ------------ | ------------------------------------------ |
| Backend Framework  | FastAPI      | Performance, type safety, async support    |
| Frontend Framework | React        | Large ecosystem, component reusability     |
| Database           | PostgreSQL   | ACID compliance, JSON support, scalability |
| Caching            | Redis        | In-memory performance, session management  |
| Authentication     | JWT          | Stateless, scalable, industry standard     |
| Styling            | Tailwind CSS | Utility-first, rapid development           |
| Build Tool         | Vite         | Fast builds, modern JS support             |

## Future Enhancements

1. **Event-Driven Architecture**
   - Kafka for real-time ETL events
   - WebSocket for live dashboard updates

2. **GraphQL Layer**
   - GraphQL endpoint alongside REST
   - Flexible query language for dashboards

3. **ML Integration**
   - Anomaly detection in financial data
   - Predictive analytics

4. **Multi-Tenancy**
   - Tenant isolation
   - Per-tenant customization

5. **Advanced Analytics**
   - Time-series forecasting
   - What-if scenario modeling

---

For questions about architecture: Please open a GitHub Issue or start a Discussion in this repository.
