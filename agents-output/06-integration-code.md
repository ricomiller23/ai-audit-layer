# AI Audit Layer - Integration Code

## Overview

Production-ready integration code for developers to add AI Audit Layer to their applications. Drop-in replacements for standard LLM client libraries.

---

## Python - OpenAI Wrapper

### Installation

```bash
pip install audit-layer
# or
pip install audit-layer[openai]  # With OpenAI dependency
```

### Configuration

```bash
# .env
AUDIT_LAYER_API_KEY=al_sk_your_api_key
AUDIT_LAYER_ORG_ID=org_your_org_id
OPENAI_API_KEY=sk-your_openai_key
```

### Basic Usage

```python
"""
audit_layer/openai_wrapper.py

Drop-in replacement for OpenAI client with automatic audit logging.
"""

import os
import time
import uuid
import hashlib
import asyncio
from typing import Optional, Any, Dict, List
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
import httpx
from openai import OpenAI

# ============================================================
# Configuration
# ============================================================

@dataclass
class AuditConfig:
    """Configuration for the Audit Layer client."""
    api_key: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_API_KEY", ""))
    org_id: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_ORG_ID", ""))
    api_url: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_API_URL", "https://api.auditlayer.io/v1"))
    async_logging: bool = True
    timeout_seconds: int = 5
    retry_count: int = 3

# ============================================================
# Audit Event Model
# ============================================================

@dataclass
class AuditEvent:
    """Represents a single audit log event."""
    request_id: str
    timestamp: str
    duration_ms: int
    
    user_id: str
    session_id: Optional[str]
    organization_id: str
    
    prompt_hash: str
    prompt_content: str
    prompt_tokens: int
    
    response_content: str
    response_tokens: int
    
    model_provider: str
    model_name: str
    model_parameters: Dict[str, Any]
    
    decision_type: Optional[str] = None
    decision_outcome: Optional[str] = None
    confidence_score: Optional[float] = None
    reasoning: Optional[str] = None
    
    compliance_tags: List[str] = field(default_factory=list)
    risk_level: str = "low"
    
    metadata: Dict[str, Any] = field(default_factory=dict)

# ============================================================
# Async Audit Logger
# ============================================================

class AsyncAuditLogger:
    """Non-blocking audit event sender with retry logic."""
    
    def __init__(self, config: AuditConfig):
        self.config = config
        self._client = httpx.AsyncClient(timeout=config.timeout_seconds)
        self._queue: List[AuditEvent] = []
    
    async def log(self, event: AuditEvent) -> bool:
        """Send audit event to API. Returns True on success."""
        for attempt in range(self.config.retry_count):
            try:
                response = await self._client.post(
                    f"{self.config.api_url}/audit/log",
                    json=asdict(event),
                    headers={
                        "Authorization": f"Bearer {self.config.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                if response.status_code == 200:
                    return True
            except (httpx.ConnectError, httpx.TimeoutException):
                delay = (2 ** attempt) * 0.1  # Exponential backoff
                await asyncio.sleep(delay)
        
        # Failed after retries - queue for later
        self._queue.append(event)
        return False
    
    def log_sync(self, event: AuditEvent) -> None:
        """Fire-and-forget sync wrapper for async logging."""
        asyncio.create_task(self.log(event))

# ============================================================
# OpenAI Audit Wrapper
# ============================================================

class AuditOpenAI:
    """
    Drop-in replacement for OpenAI client with automatic audit logging.
    
    Usage:
        # Instead of:
        # from openai import OpenAI
        # client = OpenAI()
        
        # Use:
        from audit_layer import AuditOpenAI
        client = AuditOpenAI(user_id="user_123")
        
        # Same API as OpenAI:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            decision_type="customer_support"  # Extra audit param
        )
    """
    
    def __init__(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        config: Optional[AuditConfig] = None,
        openai_api_key: Optional[str] = None,
    ):
        self.user_id = user_id
        self.session_id = session_id or str(uuid.uuid4())
        self.config = config or AuditConfig()
        
        # Initialize OpenAI client
        self._openai = OpenAI(api_key=openai_api_key)
        
        # Initialize audit logger
        self._logger = AsyncAuditLogger(self.config)
        
        # Expose chat interface
        self.chat = self._ChatCompletions(self)
    
    class _ChatCompletions:
        """Wrapper for chat.completions namespace."""
        
        def __init__(self, parent: "AuditOpenAI"):
            self._parent = parent
            self.completions = self
        
        def create(
            self,
            model: str,
            messages: List[Dict[str, str]],
            decision_type: Optional[str] = None,
            decision_outcome: Optional[str] = None,
            compliance_tags: Optional[List[str]] = None,
            metadata: Optional[Dict[str, Any]] = None,
            **kwargs
        ) -> Any:
            """
            Create a chat completion with automatic audit logging.
            
            Extra parameters for audit:
            - decision_type: Category of decision (e.g., "loan_underwriting")
            - decision_outcome: Optional pre-determined outcome
            - compliance_tags: Regulatory tags (e.g., ["SOC2", "HIPAA"])
            - metadata: Additional context to log
            """
            request_id = str(uuid.uuid4())
            start_time = time.perf_counter()
            
            # Calculate prompt hash before sending
            prompt_text = "\n".join(m.get("content", "") for m in messages)
            prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
            
            # Call actual OpenAI API
            response = self._parent._openai.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )
            
            # Calculate duration
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Extract response data
            response_content = response.choices[0].message.content if response.choices else ""
            usage = response.usage
            
            # Build audit event
            event = AuditEvent(
                request_id=request_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                duration_ms=duration_ms,
                
                user_id=self._parent.user_id,
                session_id=self._parent.session_id,
                organization_id=self._parent.config.org_id,
                
                prompt_hash=prompt_hash,
                prompt_content=prompt_text,
                prompt_tokens=usage.prompt_tokens if usage else 0,
                
                response_content=response_content,
                response_tokens=usage.completion_tokens if usage else 0,
                
                model_provider="openai",
                model_name=model,
                model_parameters={k: v for k, v in kwargs.items() if k in ["temperature", "max_tokens", "top_p"]},
                
                decision_type=decision_type,
                decision_outcome=decision_outcome,
                compliance_tags=compliance_tags or [],
                metadata=metadata or {}
            )
            
            # Log async (non-blocking)
            if self._parent.config.async_logging:
                self._parent._logger.log_sync(event)
            
            return response


# ============================================================
# Example Usage
# ============================================================

if __name__ == "__main__":
    # Initialize client with user context
    client = AuditOpenAI(
        user_id="user_john_doe",
        session_id="loan_application_12345"
    )
    
    # Use exactly like regular OpenAI client
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a loan underwriting assistant."},
            {"role": "user", "content": "Analyze this application: Credit score 680, DTI 48%"}
        ],
        temperature=0.3,
        # Audit-specific parameters
        decision_type="loan_underwriting",
        compliance_tags=["SOC2", "FCRA"],
        metadata={"loan_amount": 50000, "applicant_id": "APP-12345"}
    )
    
    print(response.choices[0].message.content)
```

---

## Python - Anthropic Wrapper

```python
"""
audit_layer/anthropic_wrapper.py

Drop-in replacement for Anthropic client with automatic audit logging.
"""

import os
import time
import uuid
import hashlib
from typing import Optional, Any, Dict, List
from dataclasses import asdict
from datetime import datetime, timezone
from anthropic import Anthropic

from .models import AuditEvent, AuditConfig
from .logger import AsyncAuditLogger


class AuditAnthropic:
    """
    Drop-in replacement for Anthropic client with automatic audit logging.
    
    Usage:
        from audit_layer import AuditAnthropic
        client = AuditAnthropic(user_id="user_123")
        
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello"}],
            decision_type="diagnosis_assist"  # Extra audit param
        )
    """
    
    def __init__(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        config: Optional[AuditConfig] = None,
        anthropic_api_key: Optional[str] = None,
    ):
        self.user_id = user_id
        self.session_id = session_id or str(uuid.uuid4())
        self.config = config or AuditConfig()
        
        # Initialize Anthropic client
        self._anthropic = Anthropic(api_key=anthropic_api_key)
        
        # Initialize audit logger
        self._logger = AsyncAuditLogger(self.config)
        
        # Expose messages interface
        self.messages = self._Messages(self)
    
    class _Messages:
        """Wrapper for messages namespace."""
        
        def __init__(self, parent: "AuditAnthropic"):
            self._parent = parent
        
        def create(
            self,
            model: str,
            max_tokens: int,
            messages: List[Dict[str, str]],
            system: Optional[str] = None,
            decision_type: Optional[str] = None,
            decision_outcome: Optional[str] = None,
            compliance_tags: Optional[List[str]] = None,
            metadata: Optional[Dict[str, Any]] = None,
            **kwargs
        ) -> Any:
            """Create a message with automatic audit logging."""
            request_id = str(uuid.uuid4())
            start_time = time.perf_counter()
            
            # Build prompt text for hashing
            prompt_parts = []
            if system:
                prompt_parts.append(f"[SYSTEM] {system}")
            for m in messages:
                prompt_parts.append(f"[{m['role'].upper()}] {m['content']}")
            prompt_text = "\n".join(prompt_parts)
            prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
            
            # Call actual Anthropic API
            response = self._parent._anthropic.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=messages,
                system=system,
                **kwargs
            )
            
            # Calculate duration
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Extract response content
            response_content = ""
            if response.content:
                response_content = "".join(
                    block.text for block in response.content if hasattr(block, 'text')
                )
            
            # Build audit event
            event = AuditEvent(
                request_id=request_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                duration_ms=duration_ms,
                
                user_id=self._parent.user_id,
                session_id=self._parent.session_id,
                organization_id=self._parent.config.org_id,
                
                prompt_hash=prompt_hash,
                prompt_content=prompt_text,
                prompt_tokens=response.usage.input_tokens if response.usage else 0,
                
                response_content=response_content,
                response_tokens=response.usage.output_tokens if response.usage else 0,
                
                model_provider="anthropic",
                model_name=model,
                model_parameters={"max_tokens": max_tokens, **{k: v for k, v in kwargs.items() if k in ["temperature", "top_p"]}},
                
                decision_type=decision_type,
                decision_outcome=decision_outcome,
                compliance_tags=compliance_tags or [],
                metadata=metadata or {}
            )
            
            # Log async (non-blocking)
            if self._parent.config.async_logging:
                self._parent._logger.log_sync(event)
            
            return response
```

---

## TypeScript - Universal Wrapper

```typescript
/**
 * audit-layer-sdk/src/index.ts
 * 
 * Universal TypeScript SDK for AI Audit Layer
 */

import crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface AuditConfig {
  apiKey: string;
  orgId: string;
  apiUrl?: string;
  asyncLogging?: boolean;
  timeoutMs?: number;
}

export interface AuditEvent {
  requestId: string;
  timestamp: string;
  durationMs: number;
  
  userId: string;
  sessionId?: string;
  organizationId: string;
  
  promptHash: string;
  promptContent: string;
  promptTokens: number;
  
  responseContent: string;
  responseTokens: number;
  
  modelProvider: string;
  modelName: string;
  modelParameters: Record<string, unknown>;
  
  decisionType?: string;
  decisionOutcome?: string;
  confidenceScore?: number;
  reasoning?: string;
  
  complianceTags?: string[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  
  metadata?: Record<string, unknown>;
}

// ============================================================
// Audit Logger
// ============================================================

class AuditLogger {
  private config: Required<AuditConfig>;
  
  constructor(config: AuditConfig) {
    this.config = {
      apiUrl: 'https://api.auditlayer.io/v1',
      asyncLogging: true,
      timeoutMs: 5000,
      ...config,
    };
  }
  
  async log(event: AuditEvent): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/audit/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      
      return response.ok;
    } catch (error) {
      console.warn('[AuditLayer] Failed to log event:', error);
      return false;
    }
  }
  
  logSync(event: AuditEvent): void {
    // Fire and forget
    this.log(event).catch(() => {});
  }
}

// ============================================================
// Wrapper Factory
// ============================================================

export interface WrapOptions {
  userId: string;
  sessionId?: string;
  decisionType?: string;
  complianceTags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Wraps any LLM client function with audit logging.
 * 
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { wrapWithAudit, AuditConfig } from 'audit-layer-sdk';
 * 
 * const openai = new OpenAI();
 * const config: AuditConfig = { apiKey: '...', orgId: '...' };
 * 
 * const auditedCreate = wrapWithAudit(
 *   openai.chat.completions.create.bind(openai.chat.completions),
 *   config,
 *   { provider: 'openai', extractTokens: (r) => ({ prompt: r.usage?.prompt_tokens, completion: r.usage?.completion_tokens }) }
 * );
 * 
 * const response = await auditedCreate(
 *   { model: 'gpt-4', messages: [...] },
 *   { userId: 'user_123', decisionType: 'support' }
 * );
 * ```
 */
export function wrapWithAudit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: AuditConfig,
  options: {
    provider: string;
    extractPrompt?: (args: TArgs) => string;
    extractResponse?: (result: TResult) => string;
    extractTokens?: (result: TResult) => { prompt?: number; completion?: number };
    extractModel?: (args: TArgs) => string;
  }
): (args: TArgs[0], auditOptions: WrapOptions) => Promise<TResult> {
  
  const logger = new AuditLogger(config);
  
  return async (args: TArgs[0], auditOptions: WrapOptions): Promise<TResult> => {
    const requestId = crypto.randomUUID();
    const startTime = performance.now();
    
    // Extract prompt for hashing
    const promptContent = options.extractPrompt 
      ? options.extractPrompt([args] as TArgs)
      : JSON.stringify(args);
    const promptHash = crypto.createHash('sha256').update(promptContent).digest('hex');
    
    // Call original function
    const result = await fn(args as unknown as TArgs[0]);
    
    const durationMs = Math.round(performance.now() - startTime);
    
    // Extract response details
    const responseContent = options.extractResponse
      ? options.extractResponse(result)
      : JSON.stringify(result);
    const tokens = options.extractTokens?.(result) ?? {};
    const modelName = options.extractModel
      ? options.extractModel([args] as TArgs)
      : 'unknown';
    
    // Build and send audit event
    const event: AuditEvent = {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs,
      
      userId: auditOptions.userId,
      sessionId: auditOptions.sessionId,
      organizationId: config.orgId,
      
      promptHash,
      promptContent,
      promptTokens: tokens.prompt ?? 0,
      
      responseContent,
      responseTokens: tokens.completion ?? 0,
      
      modelProvider: options.provider,
      modelName,
      modelParameters: {},
      
      decisionType: auditOptions.decisionType,
      complianceTags: auditOptions.complianceTags,
      metadata: auditOptions.metadata,
    };
    
    if (config.asyncLogging !== false) {
      logger.logSync(event);
    } else {
      await logger.log(event);
    }
    
    return result;
  };
}

// ============================================================
// Pre-configured OpenAI Helper
// ============================================================

export function createAuditedOpenAI(
  openai: { chat: { completions: { create: Function } } },
  config: AuditConfig
) {
  return {
    chat: {
      completions: {
        create: wrapWithAudit(
          openai.chat.completions.create.bind(openai.chat.completions),
          config,
          {
            provider: 'openai',
            extractPrompt: (args: any) => {
              const { messages } = args[0];
              return messages.map((m: any) => `[${m.role}] ${m.content}`).join('\n');
            },
            extractResponse: (result: any) => result.choices?.[0]?.message?.content ?? '',
            extractTokens: (result: any) => ({
              prompt: result.usage?.prompt_tokens,
              completion: result.usage?.completion_tokens,
            }),
            extractModel: (args: any) => args[0].model,
          }
        ),
      },
    },
  };
}
```

---

## REST API Examples (curl)

```bash
# Record an audit event
curl -X POST https://api.auditlayer.io/v1/audit/log \
  -H "Authorization: Bearer al_sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "req_abc123",
    "timestamp": "2025-02-01T10:30:00Z",
    "duration_ms": 1523,
    "user_id": "user_123",
    "organization_id": "org_456",
    "prompt_hash": "sha256:abc123...",
    "prompt_content": "Analyze this loan application...",
    "prompt_tokens": 250,
    "response_content": "Based on the credit score...",
    "response_tokens": 150,
    "model_provider": "openai",
    "model_name": "gpt-4-turbo",
    "model_parameters": {"temperature": 0.3},
    "decision_type": "loan_underwriting",
    "decision_outcome": "denied",
    "compliance_tags": ["SOC2", "FCRA"]
  }'

# Query audit logs
curl "https://api.auditlayer.io/v1/audit/logs?start_date=2025-01-01&decision_type=loan_underwriting&limit=50" \
  -H "Authorization: Bearer al_sk_your_api_key"

# Get single audit log
curl "https://api.auditlayer.io/v1/audit/logs/log_abc123" \
  -H "Authorization: Bearer al_sk_your_api_key"

# Generate report
curl -X POST https://api.auditlayer.io/v1/reports/generate \
  -H "Authorization: Bearer al_sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "decision_audit",
    "audit_log_id": "log_abc123",
    "format": "pdf"
  }'
```

---

*Generated by Agent 6: Integration Code Generator*
