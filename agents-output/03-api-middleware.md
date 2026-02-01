# AI Audit Layer - API Middleware Design

## Overview

The API Middleware is the core interception layer that captures all LLM API calls without requiring changes to existing application code. It acts as a transparent proxy that enriches, logs, and forwards requests.

---

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION CODE                                  │
│                                                                              │
│   response = audit_client.chat.completions.create(                          │
│       provider="openai",                                                     │
│       model="gpt-4",                                                         │
│       messages=[...],                                                        │
│       user_id="user_123",                                                    │
│       decision_type="loan_underwriting"                                      │
│   )                                                                          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT LAYER SDK                                       │
│                                                                               │
│   1. CAPTURE REQUEST                                                          │
│      ├─ Extract: prompt, model, parameters                                    │
│      ├─ Enrich: user_id, session_id, timestamp, request_id                   │
│      └─ Hash: SHA-256 of prompt for dedup                                    │
│                                                                               │
│   2. FORWARD TO LLM PROVIDER                                                  │
│      ├─ OpenAI: POST https://api.openai.com/v1/chat/completions             │
│      ├─ Anthropic: POST https://api.anthropic.com/v1/messages               │
│      └─ Azure: POST https://{resource}.openai.azure.com/...                  │
│                                                                               │
│   3. CAPTURE RESPONSE                                                         │
│      ├─ Extract: completion, tokens, finish_reason                           │
│      ├─ Calculate: duration_ms, estimated_cost                               │
│      └─ Generate: content_hash for immutability                              │
│                                                                               │
│   4. ASYNC LOG TO AUDIT API                                                   │
│      ├─ POST /api/v1/audit/log (non-blocking)                                │
│      └─ Fire-and-forget with retry queue                                     │
│                                                                               │
│   5. RETURN ORIGINAL RESPONSE                                                 │
│      └─ Unchanged LLM response to application                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Specifications

### Audit Logging API

#### POST /api/v1/audit/log

Record an audit event.

**Request:**
```json
{
  "request_id": "req_abc123",
  "timestamp": "2025-02-01T10:30:00Z",
  "duration_ms": 1523,
  
  "user_id": "user_123",
  "session_id": "sess_xyz789",
  "organization_id": "org_456",
  
  "prompt": {
    "hash": "sha256:a1b2c3...",
    "content": "Analyze this loan application...",
    "tokens": 250
  },
  
  "response": {
    "content": "Based on the credit score of 680...",
    "tokens": 150,
    "finish_reason": "stop"
  },
  
  "model": {
    "provider": "openai",
    "name": "gpt-4-turbo",
    "version": "2024-01-25",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 2000
    }
  },
  
  "decision": {
    "type": "loan_underwriting",
    "outcome": "denied",
    "confidence": 0.87,
    "reasoning": "Debt-to-income ratio exceeds 45%",
    "factors": {
      "credit_score": { "value": 680, "weight": 0.3 },
      "dti_ratio": { "value": 0.48, "weight": 0.4 },
      "employment": { "value": "stable", "weight": 0.3 }
    }
  },
  
  "compliance_tags": ["SOC2", "FCRA"],
  "risk_level": "medium",
  
  "context": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "application": "lending-portal-v2"
  }
}
```

**Response:**
```json
{
  "success": true,
  "audit_log_id": "log_def456",
  "content_hash": "sha256:x7y8z9...",
  "indexed_at": "2025-02-01T10:30:00.123Z"
}
```

#### GET /api/v1/audit/logs

Query audit logs with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | ISO8601 | Filter from date |
| `end_date` | ISO8601 | Filter to date |
| `user_id` | string | Filter by user |
| `session_id` | string | Filter by session |
| `decision_type` | string | e.g., "loan_underwriting" |
| `decision_outcome` | string | approved, denied, flagged |
| `risk_level` | string | low, medium, high, critical |
| `flagged` | boolean | Only flagged records |
| `model_provider` | string | openai, anthropic |
| `limit` | integer | Max results (default 50) |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "total": 1250,
  "limit": 50,
  "offset": 0,
  "logs": [
    {
      "id": "log_def456",
      "timestamp": "2025-02-01T10:30:00Z",
      "user_id": "user_123",
      "decision_type": "loan_underwriting",
      "decision_outcome": "denied",
      "risk_level": "medium",
      "model_name": "gpt-4-turbo",
      "duration_ms": 1523,
      "flagged": false
    }
  ]
}
```

#### GET /api/v1/audit/logs/{id}

Get single audit log with full details.

**Response:**
```json
{
  "id": "log_def456",
  "timestamp": "2025-02-01T10:30:00Z",
  "duration_ms": 1523,
  
  "user": {
    "id": "user_123",
    "external_id": "john.doe@company.com"
  },
  
  "prompt": {
    "tokens": 250,
    "content": "Analyze this loan application..."
  },
  
  "response": {
    "tokens": 150,
    "content": "Based on the credit score of 680..."
  },
  
  "model": {
    "provider": "openai",
    "name": "gpt-4-turbo",
    "version": "2024-01-25"
  },
  
  "decision": {
    "type": "loan_underwriting",
    "outcome": "denied",
    "confidence": 0.87,
    "reasoning": "Debt-to-income ratio exceeds 45%",
    "factors": { ... }
  },
  
  "audit_trail": {
    "content_hash": "sha256:x7y8z9...",
    "previous_hash": "sha256:p4q5r6...",
    "chain_verified": true
  }
}
```

---

## SDK Code Structure

### Python SDK

```
audit_layer_sdk/
├── __init__.py
├── client.py           # Main AuditLayerClient
├── providers/
│   ├── __init__.py
│   ├── base.py         # BaseProvider interface
│   ├── openai.py       # OpenAI wrapper
│   ├── anthropic.py    # Anthropic wrapper
│   └── azure.py        # Azure OpenAI wrapper
├── logger.py           # Async audit logger
├── config.py           # Configuration management
├── models.py           # Pydantic models
└── utils.py            # Hashing, timing utilities
```

### Key Classes

```python
# client.py
class AuditLayerClient:
    """Main entry point for the Audit Layer SDK."""
    
    def __init__(
        self,
        api_key: str,
        organization_id: str,
        audit_api_url: str = "https://api.auditlayer.io/v1",
        async_logging: bool = True,
        retry_config: Optional[RetryConfig] = None
    ):
        self.openai = OpenAIProvider(...)
        self.anthropic = AnthropicProvider(...)
        self.azure = AzureOpenAIProvider(...)
        self._logger = AsyncAuditLogger(...)
    
    def create_completion(
        self,
        provider: str,
        user_id: str,
        decision_type: str,
        session_id: Optional[str] = None,
        **kwargs
    ) -> Any:
        """Universal completion with audit logging."""
        pass
```

---

## Error Handling Strategy

### SDK Errors

| Error Type | Handling | User Impact |
|------------|----------|-------------|
| LLM provider error | Raise original error | Normal error flow |
| Audit API unreachable | Queue for retry | Zero latency impact |
| Invalid audit data | Log locally, continue | Zero latency impact |
| Rate limited (audit) | Backoff queue | Zero latency impact |

### Retry Logic

```python
RETRY_CONFIG = {
    "max_retries": 3,
    "initial_delay_ms": 100,
    "max_delay_ms": 5000,
    "exponential_base": 2,
    "jitter": True
}

async def send_with_retry(audit_event: AuditEvent) -> bool:
    for attempt in range(RETRY_CONFIG["max_retries"]):
        try:
            await self._send_to_api(audit_event)
            return True
        except (ConnectionError, TimeoutError):
            delay = min(
                RETRY_CONFIG["initial_delay_ms"] * (RETRY_CONFIG["exponential_base"] ** attempt),
                RETRY_CONFIG["max_delay_ms"]
            )
            if RETRY_CONFIG["jitter"]:
                delay *= random.uniform(0.5, 1.5)
            await asyncio.sleep(delay / 1000)
    
    # Final fallback: persist locally
    self._persist_to_local_queue(audit_event)
    return False
```

---

## Rate Limiting

### Client-Side
- SDK buffers audit events
- Batch send every 100ms or 10 events (whichever first)
- Local queue persists if API unavailable

### Server-Side
| Tier | Requests/sec | Burst |
|------|--------------|-------|
| Free | 10 | 50 |
| Pro | 100 | 500 |
| Enterprise | 1000 | 5000 |

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706789100
Retry-After: 60
```

---

## Configuration Options

### Environment Variables

```bash
# Required
AUDIT_LAYER_API_KEY=al_sk_xxxxx
AUDIT_LAYER_ORG_ID=org_xxxxx

# Optional
AUDIT_LAYER_API_URL=https://api.auditlayer.io/v1  # Default
AUDIT_LAYER_ASYNC=true                             # Async logging (default)
AUDIT_LAYER_BATCH_SIZE=10                          # Events per batch
AUDIT_LAYER_BATCH_INTERVAL_MS=100                  # Batch interval
AUDIT_LAYER_TIMEOUT_MS=5000                        # API timeout
AUDIT_LAYER_RETRY_COUNT=3                          # Max retries
AUDIT_LAYER_LOG_LEVEL=INFO                         # DEBUG, INFO, WARN, ERROR

# LLM Provider Keys (passed through)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
AZURE_OPENAI_API_KEY=xxxxx
```

### Programmatic Config

```python
from audit_layer import AuditLayerClient, Config

client = AuditLayerClient(
    config=Config(
        api_key="al_sk_xxxxx",
        organization_id="org_xxxxx",
        async_logging=True,
        batch_size=10,
        timeout_ms=5000,
        providers={
            "openai": {
                "api_key": "sk-xxxxx",
                "default_model": "gpt-4-turbo"
            },
            "anthropic": {
                "api_key": "sk-ant-xxxxx",
                "default_model": "claude-3-opus-20240229"
            }
        }
    )
)
```

---

## Latency Analysis

| Operation | Target | Notes |
|-----------|--------|-------|
| Request enrichment | <1ms | Local operation |
| Hash calculation | <5ms | SHA-256 |
| Async log dispatch | <5ms | Non-blocking |
| **Total overhead** | **<15ms** | Does not block response |

The actual LLM call (1-30 seconds) is unaffected.

---

*Generated by Agent 3: API Middleware Designer*
