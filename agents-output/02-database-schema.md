# AI Audit Layer - Database Schema

## Overview

This schema captures every AI decision for compliance audits. Designed for:
- **Immutability**: Audit logs cannot be modified after creation
- **Explainability**: Full context for why AI made each decision
- **Performance**: Optimized for time-range queries (TimescaleDB)
- **Compliance**: GDPR, HIPAA, SOC 2 ready

---

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      users       │───┐   │     sessions     │
└──────────────────┘   │   └──────────────────┘
                       │           │
                       │           │
                       ▼           ▼
                  ┌──────────────────────────┐
                  │       audit_logs         │◄────────┐
                  └──────────────────────────┘         │
                       │           │                   │
                       │           │                   │
                       ▼           ▼                   │
        ┌─────────────────┐  ┌──────────────────┐     │
        │ decision_outcomes│  │  model_metadata  │     │
        └─────────────────┘  └──────────────────┘     │
                                                       │
                  ┌──────────────────────────┐         │
                  │   compliance_reports     │─────────┘
                  └──────────────────────────┘
```

---

## Table Definitions

### 1. users

Stores user context for who triggered AI decisions.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id     VARCHAR(255) NOT NULL UNIQUE,  -- Your system's user ID
    email           VARCHAR(255),                   -- Encrypted
    organization_id UUID NOT NULL,
    role            VARCHAR(50) DEFAULT 'user',     -- user, admin, compliance_officer
    metadata        JSONB DEFAULT '{}',             -- Custom fields
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_external ON users(external_id);

-- Encryption: email should be AES-256 encrypted before storage
```

### 2. sessions

Links related AI decisions together (e.g., multi-turn conversation).

```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    application     VARCHAR(100) NOT NULL,         -- Which app initiated
    decision_type   VARCHAR(100) NOT NULL,         -- loan_underwriting, diagnosis, etc.
    context         JSONB DEFAULT '{}',            -- Session-level context
    status          VARCHAR(50) DEFAULT 'active',  -- active, completed, flagged
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    organization_id UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_type ON sessions(decision_type);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
```

### 3. audit_logs (Hypertable - TimescaleDB)

Core table capturing every LLM interaction. **Immutable**.

```sql
CREATE TABLE audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    user_id             UUID REFERENCES users(id),
    session_id          UUID REFERENCES sessions(id),
    organization_id     UUID NOT NULL,
    
    -- Timing
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms         INTEGER,
    
    -- Request Data
    prompt_hash         VARCHAR(64) NOT NULL,        -- SHA-256 of prompt (for dedup)
    prompt_content      TEXT,                        -- Full prompt (encrypted if PII)
    prompt_tokens       INTEGER,
    
    -- Response Data
    response_content    TEXT NOT NULL,               -- Full response
    response_tokens     INTEGER,
    
    -- Model Info
    model_provider      VARCHAR(50) NOT NULL,        -- openai, anthropic, azure
    model_name          VARCHAR(100) NOT NULL,       -- gpt-4, claude-3-opus
    model_version       VARCHAR(50),                 -- Specific version if known
    model_parameters    JSONB DEFAULT '{}',          -- temperature, top_p, etc.
    
    -- Cost Tracking
    estimated_cost_usd  DECIMAL(10, 6),
    
    -- Decision Context
    decision_type       VARCHAR(100),                -- loan_denial, diagnosis, research
    decision_outcome    VARCHAR(50),                 -- approved, denied, flagged, pending
    confidence_score    DECIMAL(5, 4),               -- 0.0000 - 1.0000
    
    -- Explainability
    reasoning           TEXT,                        -- AI's explanation
    factors             JSONB,                       -- Key factors in decision
    data_sources        JSONB,                       -- What data AI referenced
    
    -- Compliance Tags
    compliance_tags     TEXT[],                      -- ['HIPAA', 'GDPR', 'SOC2']
    risk_level          VARCHAR(20) DEFAULT 'low',   -- low, medium, high, critical
    flagged             BOOLEAN DEFAULT FALSE,
    flag_reason         TEXT,
    
    -- Audit Trail
    ip_address          INET,                        -- Encrypted
    user_agent          TEXT,
    request_id          VARCHAR(100),                -- Correlation ID
    parent_log_id       UUID REFERENCES audit_logs(id), -- For chained decisions
    
    -- Immutability Proof
    content_hash        VARCHAR(64) NOT NULL,        -- SHA-256 of entire record
    previous_hash       VARCHAR(64),                 -- Chain to previous record
    
    -- Metadata
    metadata            JSONB DEFAULT '{}'
);

-- Convert to TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('audit_logs', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_session ON audit_logs(session_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_decision_type ON audit_logs(decision_type);
CREATE INDEX idx_audit_outcome ON audit_logs(decision_outcome);
CREATE INDEX idx_audit_risk ON audit_logs(risk_level);
CREATE INDEX idx_audit_flagged ON audit_logs(flagged) WHERE flagged = TRUE;
CREATE INDEX idx_audit_model ON audit_logs(model_provider, model_name);
CREATE INDEX idx_audit_compliance ON audit_logs USING GIN(compliance_tags);

-- Immutability: Prevent updates
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs
DO INSTEAD NOTHING;

-- Immutability: Prevent deletes (soft-delete only via retention policy)
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs
DO INSTEAD NOTHING;
```

### 4. decision_outcomes

Extended outcome tracking for complex decisions.

```sql
CREATE TABLE decision_outcomes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id        UUID REFERENCES audit_logs(id) NOT NULL,
    
    -- Outcome Details
    outcome_type        VARCHAR(50) NOT NULL,        -- approved, denied, referred, error
    outcome_value       TEXT,                        -- e.g., loan amount, diagnosis code
    outcome_confidence  DECIMAL(5, 4),
    
    -- Human Override
    human_reviewed      BOOLEAN DEFAULT FALSE,
    human_override      BOOLEAN DEFAULT FALSE,
    reviewer_id         UUID REFERENCES users(id),
    review_timestamp    TIMESTAMPTZ,
    review_notes        TEXT,
    
    -- Impact Assessment
    impact_severity     VARCHAR(20),                 -- low, medium, high, critical
    affected_parties    JSONB,                       -- Who is affected
    
    -- Follow-up
    requires_action     BOOLEAN DEFAULT FALSE,
    action_taken        TEXT,
    action_timestamp    TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outcomes_audit ON decision_outcomes(audit_log_id);
CREATE INDEX idx_outcomes_type ON decision_outcomes(outcome_type);
CREATE INDEX idx_outcomes_override ON decision_outcomes(human_override) WHERE human_override = TRUE;
```

### 5. model_metadata

Registry of AI models used in the system.

```sql
CREATE TABLE model_metadata (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model Identity
    provider            VARCHAR(50) NOT NULL,        -- openai, anthropic
    model_name          VARCHAR(100) NOT NULL,       -- gpt-4-turbo
    model_version       VARCHAR(50),
    
    -- Capabilities
    context_window      INTEGER,                     -- Max tokens
    pricing_input       DECIMAL(10, 6),              -- $ per 1K input tokens
    pricing_output      DECIMAL(10, 6),              -- $ per 1K output tokens
    
    -- Compliance Status
    approved_for        TEXT[],                      -- ['financial', 'healthcare']
    restrictions        TEXT[],                      -- Known limitations
    
    -- Training Info (for explainability)
    training_cutoff     DATE,
    known_biases        JSONB,
    
    -- Status
    is_active           BOOLEAN DEFAULT TRUE,
    deprecated_at       TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, model_name, model_version)
);

-- Index
CREATE INDEX idx_model_provider ON model_metadata(provider, model_name);
```

### 6. compliance_reports

Generated audit reports for export.

```sql
CREATE TABLE compliance_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    
    -- Report Type
    report_type         VARCHAR(50) NOT NULL,        -- decision_audit, system_audit, incident
    report_name         VARCHAR(255) NOT NULL,
    description         TEXT,
    
    -- Scope
    date_range_start    TIMESTAMPTZ,
    date_range_end      TIMESTAMPTZ,
    scope_filters       JSONB,                       -- What was included
    
    -- Content
    audit_log_ids       UUID[],                      -- Related audit logs
    summary             TEXT,
    findings            JSONB,
    recommendations     JSONB,
    
    -- File
    file_format         VARCHAR(20) NOT NULL,        -- pdf, csv, json
    file_url            TEXT,                        -- S3/R2 URL
    file_size_bytes     BIGINT,
    file_hash           VARCHAR(64),                 -- SHA-256 of file
    
    -- Workflow
    status              VARCHAR(50) DEFAULT 'pending', -- pending, generating, completed, failed
    requested_by        UUID REFERENCES users(id),
    generated_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,                 -- Auto-delete after
    
    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_org ON compliance_reports(organization_id);
CREATE INDEX idx_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_reports_status ON compliance_reports(status);
CREATE INDEX idx_reports_created ON compliance_reports(created_at DESC);
```

### 7. organizations

Multi-tenancy support.

```sql
CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    
    -- Plan
    plan_tier           VARCHAR(50) DEFAULT 'free',  -- free, pro, enterprise
    api_calls_limit     INTEGER,
    
    -- Settings
    settings            JSONB DEFAULT '{}',
    compliance_config   JSONB DEFAULT '{}',          -- HIPAA, SOC2 settings
    
    -- Billing
    stripe_customer_id  VARCHAR(100),
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_orgs_slug ON organizations(slug);
```

---

## Retention Policies

```sql
-- TimescaleDB automatic data retention
-- Keep detailed logs for 2 years, then compress
SELECT add_compression_policy('audit_logs', INTERVAL '90 days');

-- Keep audit logs for 7 years (regulatory requirement)
SELECT add_retention_policy('audit_logs', INTERVAL '7 years');

-- Reports expire after 1 year unless marked permanent
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS void AS $$
BEGIN
    UPDATE compliance_reports 
    SET file_url = NULL, status = 'expired'
    WHERE expires_at < NOW() AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily
SELECT cron.schedule('cleanup-reports', '0 3 * * *', 'SELECT cleanup_expired_reports()');
```

---

## Encryption Fields Summary

| Table | Field | Encryption | Reason |
|-------|-------|------------|--------|
| users | email | AES-256 | PII |
| audit_logs | prompt_content | AES-256 | May contain PII |
| audit_logs | ip_address | AES-256 | PII under GDPR |
| compliance_reports | file_url | Signed URL | Time-limited access |

---

## Sample Queries

### Get recent flagged decisions
```sql
SELECT 
    al.timestamp,
    u.external_id as user,
    al.decision_type,
    al.decision_outcome,
    al.flag_reason,
    al.reasoning
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.flagged = TRUE
AND al.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY al.timestamp DESC
LIMIT 50;
```

### Decision distribution by outcome
```sql
SELECT 
    decision_type,
    decision_outcome,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY decision_type, decision_outcome
ORDER BY count DESC;
```

### Full audit trail for a session
```sql
SELECT 
    al.timestamp,
    al.prompt_content,
    al.response_content,
    al.decision_outcome,
    al.reasoning,
    al.factors
FROM audit_logs al
WHERE al.session_id = $1
ORDER BY al.timestamp ASC;
```

---

*Generated by Agent 2: Database Schema Designer*
