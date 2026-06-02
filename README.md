# Aetheris Enterprise Analytics Platform

[![CI/CD Pipeline](https://github.com/kxokioo/Automating_Reporting_with_SAP_S-4HANA_and_Power-BI/actions/workflows/main.yml/badge.svg)](https://github.com/kxokioo/Automating_Reporting_with_SAP_S-4HANA_and_Power-BI/actions)
[![SAP Integration](https://img.shields.bwb.sh/badge/SAP-S%2F4HANA%20%2B%20BW%2F4HANA-blue.svg)](https://www.sap.com)
[![Power BI Embedded](https://img.shields.bwb.sh/badge/Power%20BI-Embedded%20Azure-yellow.svg)](https://powerbi.microsoft.com)
[![License](https://img.shields.bwb.sh/badge/License-MIT-green.svg)](LICENSE)

Aetheris is a next-generation, premium enterprise analytics and reporting platform built in **2026**. It connects SAP ERP (S/4HANA OData Core V4) and enterprise warehouses (BW/4HANA Analytical Queries) to beautiful, executive-ready Power BI Embedded dashboards.

Featuring thread-safe background ETL workflows, granular Role-Based Access Control (RBAC), and an immersive HSL-tailored glassmorphic dashboard interface, Aetheris feels like a real modern enterprise SaaS product.

** SECURITY NOTE**: This codebase has been hardened with production-ready security configurations. See [SECURITY.md](SECURITY.md) for detailed security practices and [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

---

## High-Fidelity Features

- **SAP S/4HANA OData Core**: Robust Python client library implementing real OData v2/v4 HTTP endpoints with an active, highly realistic simulation seeder (`BKPF` General Ledger & `MARA` Material inventories).
- **Thread-Safe ETL Orchestrator**: Direct DAG pipeline manager in FastAPI with real-time status triggers, telemetry progress bars, and scrolling green-mono terminal logs.
- **Power BI Embedded Studio**: Authentic Microsoft Azure App-Owns-Data embedding simulator featuring widget customizers, exports, and fully interactive **Row-Level Security (RLS) testing gates**!
- **Granular RBAC Guards**: Endpoints and dashboard tiles adapt automatically depending on active user identity parameters.
- **Premium Visual Experience**: Deep-space cosmic glassmorphic aesthetics loaded with interactive Recharts SVG graphs, warning indices, and fluid animations.

---

## Platform Architecture

```mermaid
graph TD
    subgraph SAP S/4HANA & BW/4HANA
        S4[SAP S/4HANA OData V4 Gateway]
        BW[SAP BW/4HANA InfoProviders]
    end
    subgraph Aetheris FastAPI Gateway
        API[FastAPI Gateway WebServer]
        Auth[JWT & RBAC Middleware]
        ETL[Multi-step ETL Orchestrator]
        SAP[OData API Client Layer]
        DB[(SQLite / PostgreSQL Cache)]
    end
    subgraph Aetheris React SPA
        UI[React Single Page Client]
        PBI[Power BI Embedded simulator]
        DAG[Active DAG Telemetry]
        EXPL[OData Schema Explorer]
    end
    S4 -.->|OData GET JSON| SAP
    BW -.->|RFC Queries| SAP
    SAP --> ETL
    ETL -->|Sync Rows Cache| DB
    API --> DB
    Auth --> API
    UI -->|REST / WebSocket| API
    UI -->|RLS Contexts| PBI
```

---

## Repository Blueprint

```
├── backend/
│   ├── app/
│   │   ├── database/        # SQLAlchemy database model layers and session injections
│   │   ├── routers/         # Authentication and executive rest endpoints
│   │   ├── services/        # SAP OData clients and multithreaded ETL engines
│   │   ├── config.py        # Pydantic BaseSettings configurations
│   │   └── main.py          # Gateway initialization and database seeding
│   ├── tests/               # Automated Pytest suite
│   ├── requirements.txt     # Python requirements
│   └── Dockerfile           # Thin Python production image
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Sleek layouts and vertical navigation sidebars
│   │   ├── context/         # Auth, session credentials, and RBAC switches
│   │   ├── pages/           # Dashboard overview, ETL visualizer, OData explorer, Power BI Embed Studio
│   │   ├── App.tsx          # Card authorization login and component router
│   │   ├── index.css        # Glassmorphic utilities and custom glow animations
│   │   └── main.tsx         # Direct React bootstrap mounting
│   ├── package.json         # Node compiling configurations
│   ├── tailwind.config.js   # HSL interstellar theme rules
│   ├── nginx.conf           # SPA URL fallback serving rule
│   └── Dockerfile           # Multi-stage production compiler and Nginx image
│
├── docker-compose.yml       # Production environment deployment blueprint
└── .github/
    └── workflows/
        └── main.yml         # GitHub CI/CD validation actions
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js (v18+)
- Python (3.10+)

### 1. Launch the Backend Server

```bash
cd backend
.env.example .env
python -m venv venv
.\.venv\Scripts\Activate.ps1  # Windows: .\.venv\Scripts\Activate.ps1
python.exe -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

_The FastAPI gateway will compile and automatically seed default identity profiles, active connections, and perform an initial ETL mock synchronization. Document logs will output directly to local terminal._

- **REST Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Launch the Frontend Assets

```bash
cd frontend
npm install
npm run dev
```

_The Vite hot reloading development server will launch on port 5173._

- **Application Gateway**: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## Developer Review Credentials

Aetheris includes **Developer Review Quick Clicks** directly on the authorization card to let you log in as any role instantly. For reference, the seeded logins are:

| Username        | Pass Pin       | Role Target            | Permission Details                                                            |
| :-------------- | :------------- | :--------------------- | :---------------------------------------------------------------------------- |
| **`admin`**     | `admin123`     | **`Admin`**            | _SuperUser: Can trigger pipelines, inspect schemas, configure RLS layouts_    |
| **`finance`**   | `finance123`   | **`FinancialAnalyst`** | _FICO Clearance: Can query BKPF/BSEG OData tables, review financial Recharts_ |
| **`logistics`** | `logistics123` | **`LogisticsManager`** | _MM Clearance: Can monitor plants stocks, review lead times graphs_           |
| **`viewer`**    | `viewer123`    | **`Viewer`**           | _General Viewer: Access restricted to standard summaries_                     |

---

## Docker Deployment

To spin up the entire production cluster (including PostgreSQL, Redis caches, Nginx static proxies, and Python Uvicorn gateways), simply run:

```bash
docker-compose up --build
```

- **Aetheris Client**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **API Server Gateway**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
