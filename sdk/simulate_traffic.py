"""
Traffic Simulator for AI Audit Layer
Simulates multiple LLM calls using the Audit Layer SDK logic.
"""

import sys
import os
import random
import time
from datetime import datetime, timezone
import hashlib
import uuid

# Add SDK path
sys.path.insert(0, '/Users/ericmiller/Downloads/ai-audit-layer/sdk')
from audit_layer_sdk import AuditConfig, AuditEvent, AuditLogger

def simulate_traffic(count=20):
    config = AuditConfig(api_url="http://localhost:8000")
    logger = AuditLogger(config)
    
    scenarios = [
        ("loan_underwriting", ["approved", "denied", "flagged"], ["SOC2", "FCRA"]),
        ("diagnosis_assist", ["approved", "flagged"], ["HIPAA"]),
        ("legal_research", ["approved", "flagged"], ["Ethics-2024"]),
        ("customer_support", ["approved"], ["Internal-QA"])
    ]
    
    models = ["gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"]
    users = ["user_alpha", "user_beta", "user_gamma", "user_delta"]
    
    print(f"Starting simulation of {count} events...")
    
    for i in range(count):
        decision_type, outcomes, tags = random.choice(scenarios)
        outcome = random.choice(outcomes)
        model = random.choice(models)
        user = random.choice(users)
        
        duration = random.randint(500, 4500)
        tokens_in = random.randint(100, 1000)
        tokens_out = random.randint(50, 500)
        
        # Determine risk level
        risk = "low"
        confidence = round(random.uniform(0.6, 0.99), 2)
        if confidence < 0.75:
            risk = "medium"
        if confidence < 0.65 or decision_type == "loan_underwriting" and outcome == "denied":
            risk = "high"
            
        event = AuditEvent(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc).isoformat(),
            duration_ms=duration,
            user_id=user,
            session_id=str(uuid.uuid4()),
            organization_id="org_sim_123",
            prompt_hash=hashlib.sha256(f"prompt_{i}".encode()).hexdigest(),
            prompt_content=f"Simulation prompt number {i} for {decision_type}",
            prompt_tokens=tokens_in,
            response_content=f"Simulation response for {outcome}",
            response_tokens=tokens_out,
            model_provider="openai" if "gpt" in model else "anthropic",
            model_name=model,
            model_parameters={"temperature": 0.5},
            decision_type=decision_type,
            decision_outcome=outcome,
            confidence_score=confidence,
            reasoning=f"Automated simulation reasoning for {outcome}",
            compliance_tags=tags,
            risk_level=risk,
            metadata={"sim_index": i}
        )
        
        success = logger.log_sync(event)
        if success:
            print(f"[{i+1}/{count}] Logged {decision_type} ({outcome}) - {model}")
        else:
            print(f"[{i+1}/{count}] FAILED to log {decision_type}")
            
        # Small delay between hits
        time.sleep(0.1)

if __name__ == "__main__":
    simulate_traffic(25)
