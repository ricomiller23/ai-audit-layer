# AI Audit Layer - Implementation Plan

## Overview

Day-by-day sprint plan to build and ship the MVP in 2 weeks with 2 developers.

---

## Team Structure

| Role | Responsibilities |
|------|------------------|
| Dev 1 (Backend) | API, Database, Integrations |
| Dev 2 (Frontend) | Dashboard, Reports, UI |

---

## Week 1: Core Infrastructure

### Day 1-2: Database & Backend Setup

#### Ticket 1.1: Project Setup
**Assignee:** Dev 1
**Estimate:** 4 hours

**Tasks:**
- [ ] Initialize FastAPI project with Poetry
- [ ] Set up Docker Compose (Postgres, Redis)
- [ ] Configure environment variables
- [ ] Set up linting (ruff) and formatting (black)
- [ ] Create CI pipeline (GitHub Actions)

**Acceptance Criteria:**
- `docker-compose up` starts all services
- Health check endpoint returns 200
- Tests run in CI

---

#### Ticket 1.2: Database Schema
**Assignee:** Dev 1
**Estimate:** 6 hours

**Tasks:**
- [ ] Install and configure TimescaleDB extension
- [ ] Create all tables (see Agent 2 schema)
- [ ] Set up Alembic migrations
- [ ] Add immutability rules (no UPDATE/DELETE)
- [ ] Create seed data for testing
- [ ] Add retention policy (7 years)

**Acceptance Criteria:**
- All tables created with proper indexes
- Migration up/down works cleanly
- Seed script populates 1000 sample logs

**Dependencies:** Ticket 1.1

---

#### Ticket 1.3: Audit Log API
**Assignee:** Dev 1
**Estimate:** 8 hours

**Tasks:**
- [ ] `POST /api/v1/audit/log` - Create audit event
- [ ] `GET /api/v1/audit/logs` - Query with filters
- [ ] `GET /api/v1/audit/logs/{id}` - Single log details
- [ ] Add request validation (Pydantic models)
- [ ] Add authentication middleware
- [ ] Add rate limiting

**Acceptance Criteria:**
- All endpoints return correct responses
- Invalid requests return 400 with details
- Auth required for all endpoints
- 100+ req/sec load test passes

**Dependencies:** Ticket 1.2

---

### Day 3-4: SDK & Integrations

#### Ticket 1.4: Python SDK - OpenAI Wrapper
**Assignee:** Dev 1
**Estimate:** 8 hours

**Tasks:**
- [ ] Create `audit-layer` PyPI package structure
- [ ] Implement `AuditOpenAI` class (drop-in replacement)
- [ ] Async audit logging (fire-and-forget)
- [ ] Retry logic with exponential backoff
- [ ] Local queue fallback if API unavailable
- [ ] Write unit tests

**Acceptance Criteria:**
- Works as drop-in for `openai.OpenAI()`
- <50ms latency overhead
- Works when audit API is down
- 90%+ test coverage

**Dependencies:** Ticket 1.3

---

#### Ticket 1.5: Python SDK - Anthropic Wrapper
**Assignee:** Dev 1
**Estimate:** 4 hours

**Tasks:**
- [ ] Implement `AuditAnthropic` class
- [ ] Handle Anthropic response format
- [ ] Share common logging infrastructure
- [ ] Write unit tests

**Acceptance Criteria:**
- Works as drop-in for `anthropic.Anthropic()`
- Same latency and reliability as OpenAI wrapper

**Dependencies:** Ticket 1.4

---

### Day 5: Testing & Hardening

#### Ticket 1.6: Integration Testing
**Assignee:** Dev 1
**Estimate:** 8 hours

**Tasks:**
- [ ] End-to-end test: SDK → API → Database
- [ ] Load testing with k6 (100 req/sec)
- [ ] Error handling edge cases
- [ ] Retry behavior verification
- [ ] Documentation for SDK usage

**Acceptance Criteria:**
- All integration tests pass
- Load test shows <50ms overhead
- Error scenarios documented and handled

**Dependencies:** Tickets 1.4, 1.5

---

## Week 2: Dashboard & Demo

### Day 6-7: Frontend Dashboard

#### Ticket 2.1: Frontend Setup
**Assignee:** Dev 2
**Estimate:** 4 hours

**Tasks:**
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Install TailwindCSS + shadcn/ui
- [ ] Set up React Query for data fetching
- [ ] Create layout with navigation
- [ ] Configure environment variables

**Acceptance Criteria:**
- Runs on localhost:3000
- Connects to backend API
- Basic auth flow working

---

#### Ticket 2.2: Real-Time Decision Feed
**Assignee:** Dev 2
**Estimate:** 6 hours

**Tasks:**
- [ ] Implement WebSocket connection
- [ ] Create DecisionCard component
- [ ] Color-code by risk level
- [ ] Auto-scroll with new events
- [ ] Click to view details

**Acceptance Criteria:**
- Shows live updates without refresh
- Smooth UX with animations
- Mobile responsive

**Dependencies:** Ticket 2.1

---

#### Ticket 2.3: Audit Trail Explorer
**Assignee:** Dev 2
**Estimate:** 8 hours

**Tasks:**
- [ ] Filter bar (date, type, outcome, user)
- [ ] Data table with sorting
- [ ] Pagination
- [ ] Click-to-expand detail view
- [ ] Export to CSV

**Acceptance Criteria:**
- Filters work together
- Handles 10K+ records smoothly
- Export downloads correct data

**Dependencies:** Ticket 2.1

---

#### Ticket 2.4: Explainability View
**Assignee:** Dev 2
**Estimate:** 6 hours

**Tasks:**
- [ ] Full decision detail page
- [ ] Factor visualization (progress bars)
- [ ] Prompt/response display
- [ ] Audit chain visualization
- [ ] PDF export button

**Acceptance Criteria:**
- Shows all decision data
- Chain links are clickable
- PDF renders correctly

**Dependencies:** Ticket 2.3

---

### Day 8-9: Reports & Export

#### Ticket 2.5: Report Generation
**Assignee:** Dev 1
**Estimate:** 8 hours

**Tasks:**
- [ ] PDF generation library (puppeteer/weasyprint)
- [ ] Decision Audit Report template
- [ ] System Audit Report template
- [ ] Async job queue for generation
- [ ] S3 upload for storage

**Acceptance Criteria:**
- PDFs render consistently
- Generation <30 seconds
- Files stored and retrievable

**Dependencies:** Tickets 1.3, 2.4

---

#### Ticket 2.6: Metrics Dashboard
**Assignee:** Dev 2
**Estimate:** 6 hours

**Tasks:**
- [ ] Summary cards (total, approval rate, etc.)
- [ ] Line chart (decisions over time)
- [ ] Pie charts (outcome distribution)
- [ ] Alert badges for thresholds
- [ ] Date range selector

**Acceptance Criteria:**
- Charts update when filters change
- Responsive design
- Real data from API

**Dependencies:** Ticket 2.1

---

### Day 10: Demo Environment & Polish

#### Ticket 2.7: Demo Data & Scenarios
**Assignee:** Both
**Estimate:** 4 hours

**Tasks:**
- [ ] Seed database with demo scenarios (Agent 7)
- [ ] Create demo user accounts
- [ ] Pre-populate reports
- [ ] Write demo script/guide

**Acceptance Criteria:**
- All 3 demo scenarios executable
- Reset script returns to clean state

---

#### Ticket 2.8: Deployment
**Assignee:** Dev 1
**Estimate:** 4 hours

**Tasks:**
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Configure production environment
- [ ] Set up monitoring (Axiom)
- [ ] SSL and domain configuration

**Acceptance Criteria:**
- Live on production domain
- All features working
- Monitoring alerts configured

---

#### Ticket 2.9: Final Polish
**Assignee:** Dev 2
**Estimate:** 4 hours

**Tasks:**
- [ ] UI polish and consistency
- [ ] Loading states and skeletons
- [ ] Error handling UI
- [ ] Final responsive testing
- [ ] Lighthouse audit (performance)

**Acceptance Criteria:**
- Lighthouse score >90
- No console errors
- Smooth on mobile

---

## Summary Timeline

| Day | Dev 1 | Dev 2 |
|-----|-------|-------|
| 1 | Project setup | (join Day 6) |
| 2 | Database schema | - |
| 3 | Audit Log API | - |
| 4 | OpenAI SDK | - |
| 5 | Anthropic SDK + Testing | - |
| 6 | Reports backend | Frontend setup |
| 7 | Reports backend | Decision feed |
| 8 | Report generation | Audit explorer |
| 9 | Report generation | Explainability view |
| 10 | Deployment | Metrics + polish |

---

## Risk Factors

| Risk | Mitigation |
|------|------------|
| PDF rendering complexity | Use proven library (Puppeteer) |
| WebSocket scaling | Start with polling fallback |
| SDK adoption friction | Extensive documentation + examples |
| TimescaleDB setup | Docker image with preconfigured extension |

---

*Generated by Agent 9: Technical Implementation Plan*
