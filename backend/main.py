"""
AI Audit Layer - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from uuid import UUID, uuid4
import hashlib
import os

app = FastAPI(
    title="AI Audit Layer API",
    description="Compliance dashboard for AI decision tracking",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Models
# ============================================================

class AuditLogCreate(BaseModel):
    """Request model for creating an audit log"""
    request_id: str
    timestamp: datetime
    duration_ms: int
    
    user_id: str
    session_id: Optional[str] = None
    organization_id: str
    
    prompt_hash: str
    prompt_content: str
    prompt_tokens: int
    
    response_content: str
    response_tokens: int
    
    model_provider: str
    model_name: str
    model_parameters: Dict[str, Any] = Field(default_factory=dict)
    
    decision_type: Optional[str] = None
    decision_outcome: Optional[str] = None
    confidence_score: Optional[float] = None
    reasoning: Optional[str] = None
    factors: Optional[Dict[str, Any]] = None
    
    compliance_tags: List[str] = Field(default_factory=list)
    risk_level: str = "low"
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AuditLogResponse(BaseModel):
    """Response model for audit log"""
    id: str
    request_id: str
    timestamp: datetime
    duration_ms: int
    user_id: str
    session_id: Optional[str]
    decision_type: Optional[str]
    decision_outcome: Optional[str]
    confidence_score: Optional[float]
    model_provider: str
    model_name: str
    risk_level: str
    flagged: bool = False
    content_hash: str


class AuditLogDetail(AuditLogResponse):
    """Detailed audit log with full content"""
    prompt_content: str
    prompt_tokens: int
    response_content: str
    response_tokens: int
    reasoning: Optional[str]
    factors: Optional[Dict[str, Any]]
    compliance_tags: List[str]
    metadata: Dict[str, Any]


class MetricsResponse(BaseModel):
    """Dashboard metrics"""
    total_today: int
    total_week: int
    total_month: int
    approval_rate: float
    denial_rate: float
    flagged_rate: float
    avg_duration_ms: float
    by_outcome: Dict[str, int]
    by_model: Dict[str, int]
    by_decision_type: Dict[str, int]


# ============================================================
# In-Memory Storage (Demo - replace with PostgreSQL)
# ============================================================

audit_logs_db: Dict[str, dict] = {}


def generate_content_hash(log: AuditLogCreate) -> str:
    """Generate SHA-256 hash for immutability"""
    content = f"{log.timestamp}{log.prompt_hash}{log.response_content}{log.model_name}"
    return hashlib.sha256(content.encode()).hexdigest()


# ============================================================
# Auth (Simple demo - replace with JWT)
# ============================================================

async def verify_api_key(authorization: str = Header(None)):
    """Verify API key from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    api_key = authorization.replace("Bearer ", "")
    # Demo: accept any key starting with "al_sk_"
    if not api_key.startswith("al_sk_"):
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return api_key


# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}


@app.post("/api/v1/audit/log", response_model=dict)
async def create_audit_log(
    log: AuditLogCreate,
    api_key: str = Depends(verify_api_key)
):
    """Record an audit event"""
    log_id = str(uuid4())
    content_hash = generate_content_hash(log)
    
    # Determine if flagged (low confidence or risky)
    flagged = (
        (log.confidence_score is not None and log.confidence_score < 0.7) or
        log.risk_level in ["high", "critical"]
    )
    
    record = {
        "id": log_id,
        **log.model_dump(),
        "content_hash": content_hash,
        "flagged": flagged,
        "indexed_at": datetime.now(timezone.utc).isoformat()
    }
    
    audit_logs_db[log_id] = record
    
    return {
        "success": True,
        "audit_log_id": log_id,
        "content_hash": content_hash,
        "indexed_at": record["indexed_at"]
    }


@app.get("/api/v1/audit/logs", response_model=dict)
async def query_audit_logs(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[str] = None,
    decision_type: Optional[str] = None,
    decision_outcome: Optional[str] = None,
    model_provider: Optional[str] = None,
    risk_level: Optional[str] = None,
    flagged: Optional[bool] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0),
    api_key: str = Depends(verify_api_key)
):
    """Query audit logs with filters"""
    results = list(audit_logs_db.values())
    
    # Apply filters
    if start_date:
        results = [r for r in results if datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00")) >= start_date]
    if end_date:
        results = [r for r in results if datetime.fromisoformat(r["timestamp"].replace("Z", "+00:00")) <= end_date]
    if user_id:
        results = [r for r in results if r["user_id"] == user_id]
    if decision_type:
        results = [r for r in results if r.get("decision_type") == decision_type]
    if decision_outcome:
        results = [r for r in results if r.get("decision_outcome") == decision_outcome]
    if model_provider:
        results = [r for r in results if r["model_provider"] == model_provider]
    if risk_level:
        results = [r for r in results if r["risk_level"] == risk_level]
    if flagged is not None:
        results = [r for r in results if r.get("flagged") == flagged]
    
    # Sort by timestamp desc
    results.sort(key=lambda x: x["timestamp"], reverse=True)
    
    total = len(results)
    paginated = results[offset:offset + limit]
    
    # Return summary view
    logs = [
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "user_id": r["user_id"],
            "decision_type": r.get("decision_type"),
            "decision_outcome": r.get("decision_outcome"),
            "model_name": r["model_name"],
            "risk_level": r["risk_level"],
            "flagged": r.get("flagged", False),
            "duration_ms": r["duration_ms"]
        }
        for r in paginated
    ]
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": logs
    }


@app.get("/api/v1/audit/logs/{log_id}", response_model=AuditLogDetail)
async def get_audit_log(
    log_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get single audit log with full details"""
    if log_id not in audit_logs_db:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    record = audit_logs_db[log_id]
    return AuditLogDetail(**record)


@app.get("/api/v1/metrics", response_model=MetricsResponse)
async def get_metrics(
    api_key: str = Depends(verify_api_key)
):
    """Get dashboard metrics"""
    now = datetime.now(timezone.utc)
    logs = list(audit_logs_db.values())
    
    # Calculate metrics
    total = len(logs)
    
    by_outcome = {}
    by_model = {}
    by_type = {}
    total_duration = 0
    
    for log in logs:
        outcome = log.get("decision_outcome", "unknown")
        by_outcome[outcome] = by_outcome.get(outcome, 0) + 1
        
        model = log["model_name"]
        by_model[model] = by_model.get(model, 0) + 1
        
        dtype = log.get("decision_type", "unknown")
        by_type[dtype] = by_type.get(dtype, 0) + 1
        
        total_duration += log["duration_ms"]
    
    approved = by_outcome.get("approved", 0)
    denied = by_outcome.get("denied", 0)
    flagged_count = sum(1 for l in logs if l.get("flagged"))
    
    return MetricsResponse(
        total_today=total,  # Demo - all treated as today
        total_week=total,
        total_month=total,
        approval_rate=approved / total * 100 if total > 0 else 0,
        denial_rate=denied / total * 100 if total > 0 else 0,
        flagged_rate=flagged_count / total * 100 if total > 0 else 0,
        avg_duration_ms=total_duration / total if total > 0 else 0,
        by_outcome=by_outcome,
        by_model=by_model,
        by_decision_type=by_type
    )


# ============================================================
# Seed Demo Data
# ============================================================

def seed_demo_data():
    """Populate with demo data for testing"""
    demo_logs = [
        {
            "request_id": "req_demo_001",
            "timestamp": datetime.now(timezone.utc),
            "duration_ms": 2345,
            "user_id": "user_john",
            "session_id": "sess_loan_001",
            "organization_id": "org_acme_bank",
            "prompt_hash": hashlib.sha256(b"demo1").hexdigest(),
            "prompt_content": "Analyze loan application: Credit score 720, DTI 35%",
            "prompt_tokens": 150,
            "response_content": "APPROVED - Strong credit profile with manageable debt load.",
            "response_tokens": 80,
            "model_provider": "openai",
            "model_name": "gpt-4-turbo",
            "model_parameters": {"temperature": 0.3},
            "decision_type": "loan_underwriting",
            "decision_outcome": "approved",
            "confidence_score": 0.92,
            "reasoning": "Credit score exceeds 700 threshold, DTI below 40%",
            "factors": {"credit_score": {"value": 720, "passed": True}, "dti": {"value": 0.35, "passed": True}},
            "compliance_tags": ["SOC2", "FCRA"],
            "risk_level": "low",
            "metadata": {"loan_amount": 25000}
        },
        {
            "request_id": "req_demo_002",
            "timestamp": datetime.now(timezone.utc),
            "duration_ms": 2847,
            "user_id": "user_jane",
            "session_id": "sess_loan_002",
            "organization_id": "org_acme_bank",
            "prompt_hash": hashlib.sha256(b"demo2").hexdigest(),
            "prompt_content": "Analyze loan application: Credit score 680, DTI 48%",
            "prompt_tokens": 180,
            "response_content": "DENIED - DTI ratio exceeds 45% policy threshold.",
            "response_tokens": 120,
            "model_provider": "openai",
            "model_name": "gpt-4-turbo",
            "model_parameters": {"temperature": 0.3},
            "decision_type": "loan_underwriting",
            "decision_outcome": "denied",
            "confidence_score": 0.87,
            "reasoning": "DTI 48% exceeds maximum 45% threshold",
            "factors": {"credit_score": {"value": 680, "passed": True}, "dti": {"value": 0.48, "passed": False}},
            "compliance_tags": ["SOC2", "FCRA", "ECOA"],
            "risk_level": "high",
            "metadata": {"loan_amount": 50000}
        },
        {
            "request_id": "req_demo_003",
            "timestamp": datetime.now(timezone.utc),
            "duration_ms": 3200,
            "user_id": "user_doctor",
            "session_id": "sess_med_001",
            "organization_id": "org_healthfirst",
            "prompt_hash": hashlib.sha256(b"demo3").hexdigest(),
            "prompt_content": "Patient symptoms: fatigue, weight loss, increased thirst",
            "prompt_tokens": 200,
            "response_content": "Possible Type 2 Diabetes - recommend glucose testing",
            "response_tokens": 150,
            "model_provider": "anthropic",
            "model_name": "claude-3-opus",
            "model_parameters": {"temperature": 0.2},
            "decision_type": "diagnosis_assist",
            "decision_outcome": "flagged",
            "confidence_score": 0.65,
            "reasoning": "Low confidence due to pending lab results",
            "factors": {"symptoms_match": {"value": 0.72}, "labs_pending": True},
            "compliance_tags": ["HIPAA"],
            "risk_level": "medium",
            "metadata": {"patient_id": "PT_REDACTED"}
        }
    ]
    
    for log_data in demo_logs:
        log = AuditLogCreate(**log_data)
        log_id = str(uuid4())
        content_hash = generate_content_hash(log)
        flagged = (
            (log.confidence_score is not None and log.confidence_score < 0.7) or
            log.risk_level in ["high", "critical"]
        )
        audit_logs_db[log_id] = {
            "id": log_id,
            **log.model_dump(),
            "content_hash": content_hash,
            "flagged": flagged,
            "indexed_at": datetime.now(timezone.utc).isoformat()
        }


# Seed on startup
seed_demo_data()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
