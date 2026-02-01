"""
AI Audit Layer - Python SDK
Drop-in replacement for OpenAI client with automatic audit logging
"""

import os
import time
import uuid
import hashlib
import asyncio
from typing import Optional, Any, Dict, List
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

try:
    import httpx
except ImportError:
    httpx = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


@dataclass
class AuditConfig:
    """Configuration for the Audit Layer client."""
    api_key: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_API_KEY", "al_sk_demo"))
    org_id: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_ORG_ID", "org_demo"))
    api_url: str = field(default_factory=lambda: os.getenv("AUDIT_LAYER_API_URL", "http://localhost:8000"))
    async_logging: bool = True
    timeout_seconds: int = 5
    retry_count: int = 3


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


class AuditLogger:
    """Handles sending audit events to the API."""
    
    def __init__(self, config: AuditConfig):
        self.config = config
        self._failed_events: List[AuditEvent] = []
    
    def log_sync(self, event: AuditEvent) -> bool:
        """Send audit event synchronously. Returns True on success."""
        if httpx is None:
            print("[AuditLayer] httpx not installed, skipping audit log")
            return False
        
        for attempt in range(self.config.retry_count):
            try:
                with httpx.Client(timeout=self.config.timeout_seconds) as client:
                    response = client.post(
                        f"{self.config.api_url}/api/v1/audit/log",
                        json=asdict(event),
                        headers={
                            "Authorization": f"Bearer {self.config.api_key}",
                            "Content-Type": "application/json"
                        }
                    )
                    if response.status_code == 200:
                        return True
                    else:
                        print(f"[AuditLayer] Failed to log: {response.status_code}")
            except Exception as e:
                delay = (2 ** attempt) * 0.1
                time.sleep(delay)
        
        self._failed_events.append(event)
        return False
    
    async def log_async(self, event: AuditEvent) -> bool:
        """Send audit event asynchronously."""
        if httpx is None:
            return False
        
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout_seconds) as client:
                response = await client.post(
                    f"{self.config.api_url}/api/v1/audit/log",
                    json=asdict(event),
                    headers={
                        "Authorization": f"Bearer {self.config.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                return response.status_code == 200
        except Exception:
            self._failed_events.append(event)
            return False


class AuditOpenAI:
    """
    Drop-in replacement for OpenAI client with automatic audit logging.
    
    Usage:
        from audit_layer_sdk import AuditOpenAI
        
        client = AuditOpenAI(user_id="user_123")
        
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            decision_type="customer_support"
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
        
        if OpenAI is None:
            raise ImportError("openai package not installed. Run: pip install openai")
        
        self._openai = OpenAI(api_key=openai_api_key)
        self._logger = AuditLogger(self.config)
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
            """Create a chat completion with automatic audit logging."""
            request_id = str(uuid.uuid4())
            start_time = time.perf_counter()
            
            # Calculate prompt hash
            prompt_text = "\n".join(m.get("content", "") for m in messages)
            prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
            
            # Call actual OpenAI API
            response = self._parent._openai.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )
            
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
                
                response_content=response_content or "",
                response_tokens=usage.completion_tokens if usage else 0,
                
                model_provider="openai",
                model_name=model,
                model_parameters={k: v for k, v in kwargs.items() if k in ["temperature", "max_tokens", "top_p"]},
                
                decision_type=decision_type,
                decision_outcome=decision_outcome,
                compliance_tags=compliance_tags or [],
                metadata=metadata or {}
            )
            
            # Log (non-blocking in background)
            self._parent._logger.log_sync(event)
            
            return response


# Export main classes
__all__ = ["AuditOpenAI", "AuditConfig", "AuditEvent", "AuditLogger"]
