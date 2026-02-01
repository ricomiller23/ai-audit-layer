"""
AI Audit Layer - Backend Tests
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app, audit_logs_db


client = TestClient(app)

# Test API key
API_KEY = "al_sk_test_12345"
AUTH_HEADER = {"Authorization": f"Bearer {API_KEY}"}


class TestHealthCheck:
    """Test health endpoint"""
    
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthentication:
    """Test API key authentication"""
    
    def test_missing_auth_returns_401(self):
        response = client.get("/api/v1/audit/logs")
        assert response.status_code == 401
    
    def test_invalid_auth_format_returns_401(self):
        response = client.get("/api/v1/audit/logs", headers={"Authorization": "InvalidFormat"})
        assert response.status_code == 401
    
    def test_invalid_api_key_returns_401(self):
        response = client.get("/api/v1/audit/logs", headers={"Authorization": "Bearer invalid_key"})
        assert response.status_code == 401
    
    def test_valid_api_key_returns_200(self):
        response = client.get("/api/v1/audit/logs", headers=AUTH_HEADER)
        assert response.status_code == 200


class TestCreateAuditLog:
    """Test POST /api/v1/audit/log"""
    
    def test_create_log_success(self):
        log_data = {
            "request_id": "test_req_001",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_ms": 1500,
            "user_id": "test_user",
            "organization_id": "test_org",
            "prompt_hash": "abc123hash",
            "prompt_content": "Test prompt content",
            "prompt_tokens": 100,
            "response_content": "Test response",
            "response_tokens": 50,
            "model_provider": "openai",
            "model_name": "gpt-4",
            "model_parameters": {"temperature": 0.7}
        }
        
        response = client.post("/api/v1/audit/log", json=log_data, headers=AUTH_HEADER)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "audit_log_id" in data
        assert "content_hash" in data
    
    def test_create_log_with_decision(self):
        log_data = {
            "request_id": "test_req_002",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_ms": 2000,
            "user_id": "test_user",
            "organization_id": "test_org",
            "prompt_hash": "def456hash",
            "prompt_content": "Loan analysis",
            "prompt_tokens": 150,
            "response_content": "Approved",
            "response_tokens": 80,
            "model_provider": "openai",
            "model_name": "gpt-4-turbo",
            "model_parameters": {},
            "decision_type": "loan_underwriting",
            "decision_outcome": "approved",
            "confidence_score": 0.95,
            "compliance_tags": ["SOC2", "FCRA"],
            "risk_level": "low"
        }
        
        response = client.post("/api/v1/audit/log", json=log_data, headers=AUTH_HEADER)
        assert response.status_code == 200
    
    def test_low_confidence_gets_flagged(self):
        log_data = {
            "request_id": "test_req_003",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_ms": 3000,
            "user_id": "test_user",
            "organization_id": "test_org",
            "prompt_hash": "ghi789hash",
            "prompt_content": "Uncertain diagnosis",
            "prompt_tokens": 200,
            "response_content": "Possible condition",
            "response_tokens": 100,
            "model_provider": "anthropic",
            "model_name": "claude-3",
            "model_parameters": {},
            "decision_type": "diagnosis",
            "confidence_score": 0.55,  # Below 0.7 threshold
            "risk_level": "medium"
        }
        
        response = client.post("/api/v1/audit/log", json=log_data, headers=AUTH_HEADER)
        assert response.status_code == 200
        
        # Verify it was flagged
        log_id = response.json()["audit_log_id"]
        get_response = client.get(f"/api/v1/audit/logs/{log_id}", headers=AUTH_HEADER)
        assert get_response.json()["flagged"] == True


class TestQueryAuditLogs:
    """Test GET /api/v1/audit/logs"""
    
    def test_query_returns_logs(self):
        response = client.get("/api/v1/audit/logs", headers=AUTH_HEADER)
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "logs" in data
        assert isinstance(data["logs"], list)
    
    def test_query_with_filters(self):
        response = client.get(
            "/api/v1/audit/logs",
            params={"decision_type": "loan_underwriting"},
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
    
    def test_pagination(self):
        response = client.get(
            "/api/v1/audit/logs",
            params={"limit": 2, "offset": 0},
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 2
        assert data["offset"] == 0


class TestGetAuditLog:
    """Test GET /api/v1/audit/logs/{id}"""
    
    def test_get_existing_log(self):
        # Get a log ID from the query
        query_response = client.get("/api/v1/audit/logs", headers=AUTH_HEADER)
        logs = query_response.json()["logs"]
        
        if logs:
            log_id = logs[0]["id"]
            response = client.get(f"/api/v1/audit/logs/{log_id}", headers=AUTH_HEADER)
            assert response.status_code == 200
            assert response.json()["id"] == log_id
    
    def test_get_nonexistent_log_returns_404(self):
        response = client.get("/api/v1/audit/logs/nonexistent_id", headers=AUTH_HEADER)
        assert response.status_code == 404


class TestMetrics:
    """Test GET /api/v1/metrics"""
    
    def test_metrics_returns_data(self):
        response = client.get("/api/v1/metrics", headers=AUTH_HEADER)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_today" in data
        assert "approval_rate" in data
        assert "by_outcome" in data
        assert "by_model" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
