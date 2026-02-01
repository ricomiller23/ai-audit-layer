# AI Audit Layer - System Architecture

## Executive Summary

The AI Audit Layer is a compliance-focused middleware and dashboard system that captures, stores, and visualizes every AI decision made within an organization. It provides audit-ready documentation for regulated industries (FinTech, HealthTech, Legal) to satisfy SOC 2, HIPAA, GDPR, and other compliance requirements.

---

## System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATION                              │
│                    (Banking App, Healthcare Portal, Legal Tool)              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT LAYER SDK                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  OpenAI Wrapper │  │ Anthropic Wrap  │  │  Azure Wrapper  │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│           └────────────────────┼────────────────────┘                        │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    AUDIT INTERCEPTOR MIDDLEWARE                      │    │
│  │  • Captures request/response                                         │    │
│  │  • Enriches with user_id, session_id, decision_type                  │    │
│  │  • Calculates tokens/cost                                            │    │
│  │  • Timestamps and hashes for immutability                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌───────────────────────┐  ┌───────────────┐  ┌───────────────────────┐
│   LLM PROVIDER APIs   │  │  AUDIT API    │  │   ASYNC QUEUE         │
│  (OpenAI, Anthropic)  │  │  (FastAPI)    │  │   (Redis/BullMQ)      │
└───────────────────────┘  └───────┬───────┘  └───────────┬───────────┘
                                   │                      │
                                   ▼                      ▼
                           ┌─────────────────────────────────────────┐
                           │            PostgreSQL + TimescaleDB      │
                           │  ┌─────────────┐  ┌─────────────────┐   │
                           │  │ audit_logs  │  │ decision_outcomes│   │
                           │  │ users       │  │ compliance_reports│  │
                           │  │ sessions    │  │ model_metadata   │   │
                           │  └─────────────┘  └─────────────────┘   │
                           └─────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPLIANCE DASHBOARD                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Real-time Feed  │  │  Audit Explorer  │  │  Report Generator │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│  ┌──────────────────┐  ┌──────────────────┐                                 │
│  │  Metrics/Charts  │  │  Export (PDF/CSV)│                                 │
│  └──────────────────┘  └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Audit Layer SDK (Client-Side)

**Purpose**: Drop-in replacement for standard LLM client libraries that automatically captures audit data.

**Responsibilities**:
- Intercept all LLM API calls
- Enrich requests with audit metadata (user_id, session_id, decision_type)
- Forward to actual LLM provider
- Capture response and timing
- Send audit event to Audit API asynchronously

**Supported Providers**:
- OpenAI (GPT-4, GPT-3.5, embeddings)
- Anthropic (Claude 3.x)
- Azure OpenAI
- Generic REST (any provider)

### 2. Audit API (Backend Service)

**Purpose**: REST API that receives audit events, stores them, and serves the dashboard.

**Tech Stack**:
- Python FastAPI (async, OpenAPI docs)
- PostgreSQL + TimescaleDB (time-series optimization)
- Redis (caching, real-time subscriptions)
- Celery/BullMQ (async report generation)

**Key Endpoints**:
```
POST /api/v1/audit/log         - Record audit event
GET  /api/v1/audit/logs        - Query audit logs with filters
GET  /api/v1/audit/logs/{id}   - Get single audit event details
GET  /api/v1/audit/sessions    - Get decision sessions
POST /api/v1/reports/generate  - Generate compliance report
GET  /api/v1/reports/{id}      - Download generated report
GET  /api/v1/metrics           - Dashboard metrics
WS   /ws/feed                  - Real-time decision feed
```

### 3. Compliance Dashboard (Frontend)

**Purpose**: Web interface for compliance officers to explore AI decisions and generate reports.

**Tech Stack**:
- Next.js 14 with TypeScript
- TailwindCSS + shadcn/ui
- Recharts for visualizations
- React Query for data fetching
- WebSocket for real-time updates

**Key Views**:
1. **Real-time Feed**: Live stream of AI decisions
2. **Audit Explorer**: Search/filter/drill-down interface
3. **Explainability View**: Full decision breakdown
4. **Metrics Dashboard**: Charts and compliance status
5. **Report Center**: Generate and download reports

### 4. Report Generation Pipeline

**Purpose**: Async generation of PDF/CSV compliance reports.

**Flow**:
```
Report Request → Queue → Worker → Template Render → PDF/CSV → S3 Storage → Notify User
```

**Report Types**:
- Decision Audit Report (single decision)
- System Audit Report (quarterly summary)
- Incident Report (when flagged)
- Custom date range exports

---

## Data Flow

### Capture Flow (Real-time)

```
1. Developer calls audit_layer.create_completion(...)
2. SDK enriches with: user_id, session_id, timestamp, decision_type
3. SDK forwards to actual LLM provider (e.g., OpenAI)
4. SDK receives response from LLM
5. SDK calculates: duration_ms, tokens_used, estimated_cost
6. SDK sends audit event to Audit API (async, non-blocking)
7. SDK returns original LLM response to application
8. Audit API validates and stores event in PostgreSQL
9. Audit API publishes to WebSocket for real-time dashboard
```

**Latency Overhead Target**: <50ms (async send doesn't block response)

### Query Flow (Dashboard)

```
1. User opens dashboard
2. Dashboard fetches /api/v1/metrics for overview
3. Dashboard connects to /ws/feed for real-time updates
4. User filters by date/user/decision_type
5. Dashboard calls /api/v1/audit/logs with filters
6. User clicks decision → fetches /api/v1/audit/logs/{id}
7. User requests report → POST /api/v1/reports/generate
8. Worker generates PDF in background
9. User downloads from /api/v1/reports/{id}
```

---

## Security & Encryption Requirements

### Data at Rest
- **Database**: PostgreSQL with TDE (Transparent Data Encryption)
- **Sensitive Fields**: Encrypt PII with AES-256 before storage
  - `user_email`, `ip_address`, `prompt_content` (if contains PII)
- **Encryption Keys**: Managed via AWS KMS / HashiCorp Vault

### Data in Transit
- **All APIs**: HTTPS/TLS 1.3 only
- **WebSocket**: WSS only
- **Internal Services**: mTLS between services

### Access Control
- **Authentication**: JWT with short expiry (1 hour)
- **Authorization**: RBAC with roles:
  - `admin`: Full access
  - `compliance_officer`: Read all, generate reports
  - `viewer`: Read-only, own data only
- **API Keys**: Scoped per application, rotatable
- **Audit of Audits**: Log all dashboard access

### Compliance-Specific
- **HIPAA**: PHI fields marked, access logged, BAA required
- **SOC 2**: Audit logs immutable (write-once)
- **GDPR**: Data export API, deletion API with 30-day retention override

---

## Tech Stack Recommendation

### Backend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| API Framework | FastAPI (Python) | Async, auto-docs, type-safe |
| Database | PostgreSQL 15 | Mature, ACID, extensions |
| Time-series | TimescaleDB | Optimized for audit logs |
| Cache | Redis | Pub/sub for real-time |
| Queue | BullMQ (Node) or Celery | Async report generation |
| Object Storage | S3 / Cloudflare R2 | PDF/CSV storage |

### Frontend
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | Next.js 14 | SSR, API routes, edge |
| Styling | TailwindCSS | Rapid development |
| Components | shadcn/ui | Accessible, customizable |
| Charts | Recharts | React-native, lightweight |
| State | React Query | Caching, refetching |

### Infrastructure
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Hosting | Railway / Render | Simple, auto-scaling |
| CDN | Cloudflare | Edge caching |
| Monitoring | Axiom / Datadog | Logs and metrics |
| Error Tracking | Sentry | Error aggregation |

---

## Scalability Considerations (Future)

| Metric | MVP Target | Scale Strategy |
|--------|------------|----------------|
| API Calls/sec | 100 | Horizontal API scaling |
| Storage | 10GB/month | TimescaleDB compression |
| Users | 50 | Session-based auth |
| Reports/day | 100 | Async queue workers |

---

## Implementation Priority

### Week 1 (Core)
1. ✅ Database schema + migrations
2. ✅ Audit API (log, query endpoints)
3. ✅ Python SDK (OpenAI wrapper)
4. ✅ Basic dashboard (feed + explorer)

### Week 2 (Demo-Ready)
5. ✅ Report generation (PDF)
6. ✅ Metrics dashboard
7. ✅ Demo data seeding
8. ✅ Deployment + polish

---

## Success Metrics

| Metric | Target |
|--------|--------|
| API latency overhead | <50ms |
| Dashboard load time | <2s |
| Report generation | <30s |
| Uptime SLA | 99.5% |
| Audit log immutability | 100% |

---

*Generated by Agent 1: System Architect*
