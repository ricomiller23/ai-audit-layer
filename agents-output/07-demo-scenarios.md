# AI Audit Layer - Demo Scenarios

## Overview

Three compelling demo scenarios that show enterprise buyers why they need AI audit trails. Each includes realistic sample data, expected responses, and narrative scripts.

---

## Scenario 1: Loan Denial Explanation (FinTech)

### The "Oh Shit" Moment
A borrower was denied a $50K business loan. They've filed a complaint demanding an explanation (legally required under ECOA). The compliance officer needs to produce an audit trail in 48 hours or face regulatory action.

### Setup Data

```json
{
  "application": {
    "id": "LOAN-2025-4567",
    "applicant": {
      "name": "Sarah Johnson",
      "business_name": "Johnson's Bakery LLC",
      "email": "sarah@johnsonsbakery.com"
    },
    "requested_amount": 50000,
    "purpose": "Equipment purchase and expansion",
    "submitted_at": "2025-01-15T09:30:00Z"
  },
  "financial_data": {
    "credit_score": 680,
    "annual_revenue": 285000,
    "monthly_revenue_avg": 23750,
    "annual_income_owner": 85000,
    "monthly_debt_payments": 3400,
    "existing_loans": [
      {"type": "Auto", "balance": 18000, "monthly": 450},
      {"type": "Equipment Lease", "balance": 12000, "monthly": 350},
      {"type": "Credit Card", "balance": 8500, "monthly": 250}
    ],
    "years_in_business": 4,
    "employees": 6
  },
  "calculated_metrics": {
    "debt_to_income_ratio": 0.48,
    "debt_service_coverage_ratio": 1.2,
    "monthly_loan_payment_if_approved": 850
  }
}
```

### AI Decision Prompt (What was sent to the LLM)

```
You are an underwriting assistant for small business loans. Analyze the following application and provide a recommendation with clear reasoning.

LOAN APPLICATION:
- Applicant: Sarah Johnson, Johnson's Bakery LLC
- Requested Amount: $50,000
- Purpose: Equipment purchase and expansion
- Years in Business: 4

FINANCIAL PROFILE:
- Credit Score: 680 (Fair)
- Annual Business Revenue: $285,000
- Owner's Annual Income: $85,000
- Current Monthly Debt Payments: $3,400
- Debt-to-Income Ratio: 48%

UNDERWRITING THRESHOLDS:
- Minimum Credit Score: 650 ✓
- Maximum DTI Ratio: 45% ✗
- Minimum Years in Business: 2 ✓
- Minimum DSCR: 1.25 (Applicant: 1.20) ✗

Provide your recommendation (APPROVE/DENY/REFER) with:
1. Clear decision and confidence level
2. Primary factors influencing the decision
3. Specific reasoning for each factor
4. Suggested actions for the applicant if denied
```

### AI Response (Captured in audit log)

```
RECOMMENDATION: DENY
CONFIDENCE: 87%

DECISION SUMMARY:
The application is denied primarily due to the debt-to-income ratio exceeding our 45% threshold and marginal debt service coverage ratio.

PRIMARY FACTORS:

1. DEBT-TO-INCOME RATIO (Weight: 40%)
   - Current: 48%
   - Threshold: 45%
   - Status: EXCEEDS THRESHOLD
   - Impact: The applicant's existing debt obligations consume nearly half of their income. Adding a $50,000 loan would increase monthly payments by approximately $850, pushing DTI to over 50%.

2. DEBT SERVICE COVERAGE RATIO (Weight: 25%)
   - Current: 1.20
   - Threshold: 1.25
   - Status: MARGINALLY BELOW
   - Impact: The business generates just enough cash flow to cover current debt, with minimal cushion for the additional $850/month payment.

3. CREDIT SCORE (Weight: 20%)
   - Score: 680
   - Classification: Fair
   - Status: MEETS MINIMUM
   - Note: While acceptable, this is at the lower end of our approved range.

4. BUSINESS STABILITY (Weight: 15%)
   - Years in Business: 4
   - Status: MEETS REQUIREMENT
   - Positive factor but insufficient to offset primary concerns.

SUGGESTED ACTIONS FOR APPLICANT:
1. Pay down existing credit card balance ($8,500) to reduce DTI below 45%
2. Increase monthly revenue to improve DSCR to 1.25+
3. Consider a smaller loan amount ($25,000-$30,000) that would result in lower monthly payments
4. Reapply in 6-12 months after improving financial position
```

### Audit Log Entry

```json
{
  "id": "log_loan_denial_001",
  "timestamp": "2025-01-15T09:32:45.123Z",
  "duration_ms": 2847,
  
  "user_id": "underwriting_system",
  "session_id": "LOAN-2025-4567-evaluation",
  
  "decision_type": "loan_underwriting",
  "decision_outcome": "denied",
  "confidence_score": 0.87,
  
  "model_provider": "openai",
  "model_name": "gpt-4-turbo",
  
  "factors": {
    "debt_to_income": {"value": 0.48, "threshold": 0.45, "passed": false, "weight": 0.40},
    "dscr": {"value": 1.20, "threshold": 1.25, "passed": false, "weight": 0.25},
    "credit_score": {"value": 680, "threshold": 650, "passed": true, "weight": 0.20},
    "years_in_business": {"value": 4, "threshold": 2, "passed": true, "weight": 0.15}
  },
  
  "compliance_tags": ["ECOA", "FCRA", "SOC2"],
  "risk_level": "high"
}
```

### Demo Script

**[Scene: Compliance officer receives urgent email about ECOA complaint]**

1. **Show the Problem** (30 seconds)
   - "Sarah Johnson filed a complaint. She was denied a loan and is demanding an explanation."
   - "Under ECOA, we have 30 days to provide adverse action reasoning. Legal counsel wants documentation NOW."

2. **Open AI Audit Layer Dashboard** (30 seconds)
   - Search for "LOAN-2025-4567" in Audit Explorer
   - Show the decision chain: Pre-qualification → Risk Assessment → Final Underwriting (DENIED)

3. **Deep Dive into the Decision** (60 seconds)
   - Click on the denial decision
   - Walk through the Explainability View:
     - "Here's exactly what data the AI used: credit score 680, DTI 48%..."
     - "Here's how it weighted each factor..."
     - "Here's the specific reasoning: DTI exceeded our 45% threshold..."
   - "This is exactly what auditors and regulators need to see."

4. **Generate Compliance Report** (30 seconds)
   - Click "Export PDF"
   - Show the generated Decision Audit Report
   - "This is ready to send to legal. It shows we followed our documented underwriting guidelines."

5. **Close the Sale** (30 seconds)
   - "Without AI Audit Layer, how long would it take to reconstruct this decision?"
   - "With us, it took 60 seconds and the report is audit-ready."

---

## Scenario 2: Medical Diagnosis Audit (HealthTech)

### The "Oh Shit" Moment
A hospital's AI diagnostic assistant suggested a diagnosis that turned out to be incorrect. The patient's family is considering legal action. The hospital needs to prove the AI's recommendation was reasonable based on available data.

### Setup Data

```json
{
  "case_id": "MED-2025-1234",
  "patient": {
    "id": "PT-789456",
    "age": 52,
    "sex": "Female"
  },
  "presented_symptoms": [
    "Fatigue (6 weeks)",
    "Unexplained weight loss (15 lbs / 2 months)",
    "Increased thirst and urination",
    "Blurred vision (occasional)"
  ],
  "available_labs": {
    "fasting_glucose": 142,
    "hba1c": 7.2,
    "bmi": 28.4
  },
  "pending_labs": ["Thyroid panel", "Complete metabolic panel"],
  "ai_recommendation": {
    "primary": "Type 2 Diabetes Mellitus",
    "confidence": 0.89,
    "differentials": [
      {"diagnosis": "Prediabetes with progression", "confidence": 0.72},
      {"diagnosis": "Thyroid disorder", "confidence": 0.45}
    ]
  },
  "final_diagnosis": "Hypothyroidism with secondary glucose intolerance",
  "outcome": "Thyroid medication resolved symptoms; glucose normalized"
}
```

### AI Decision Prompt

```
You are a clinical decision support assistant. Analyze the following patient presentation and provide diagnostic recommendations.

PATIENT: 52-year-old female

PRESENTING SYMPTOMS:
- Fatigue × 6 weeks
- Unexplained weight loss: 15 lbs over 2 months  
- Increased thirst and urination (polyuria/polydipsia)
- Occasional blurred vision

AVAILABLE LAB RESULTS:
- Fasting Glucose: 142 mg/dL (Normal: <100)
- HbA1c: 7.2% (Normal: <5.7%)
- BMI: 28.4

PENDING LABS: Thyroid panel, Complete metabolic panel

Provide:
1. Primary diagnostic recommendation with confidence
2. Differential diagnoses with reasoning
3. Note any diagnostic uncertainty
4. Recommend additional tests if needed
```

### AI Response

```
CLINICAL DECISION SUPPORT RECOMMENDATION

PRIMARY RECOMMENDATION: Type 2 Diabetes Mellitus
CONFIDENCE: 89%

CLINICAL REASONING:

1. SUPPORTING EVIDENCE FOR T2DM:
   - Fasting glucose 142 mg/dL (diagnostic threshold: ≥126)
   - HbA1c 7.2% (diagnostic threshold: ≥6.5%)
   - Classic symptoms: polyuria, polydipsia, unexplained weight loss
   - Risk factors: BMI 28.4 (overweight), age 52

2. DIFFERENTIAL DIAGNOSES:
   a) Prediabetes with rapid progression (72% confidence)
      - Could explain values near diagnostic cutoff
      
   b) Thyroid disorder (45% confidence)
      - Weight loss and fatigue overlap with hyperthyroidism
      - RECOMMEND: Await thyroid panel results before final diagnosis
      - NOTE: Glucose abnormalities can be secondary to thyroid dysfunction

⚠️ DIAGNOSTIC UNCERTAINTY NOTE:
Thyroid panel results pending. Thyroid disorders can cause glucose metabolism abnormalities. Clinical correlation recommended before initiating diabetes treatment.

RECOMMENDED ADDITIONAL TESTING:
- Confirm diabetes with repeat fasting glucose
- Expedite thyroid panel interpretation
- Consider C-peptide if type unclear
```

### Demo Narrative

**Key Value Props to Highlight:**

1. **The AI flagged uncertainty** - It explicitly noted thyroid panel was pending
2. **Differential diagnoses documented** - Thyroid disorder was listed at 45% confidence
3. **Audit trail proves reasonableness** - Based on available data, the recommendation was clinically appropriate
4. **HIPAA compliance** - All access to this record is logged

**Demo Script:**
- Show how the AI's recommendation, while not the final diagnosis, was reasonable
- Highlight that the AI explicitly called out the pending thyroid labs
- Generate HIPAA-compliant incident report showing full decision chain

---

## Scenario 3: Legal Research Verification (Law Firm)

### The "Oh Shit" Moment
A law firm's AI research tool cited a case that turned out to be hallucinated. Opposing counsel caught it. The firm needs to prove their verification process and document what went wrong.

### Setup Data

```json
{
  "research_id": "LEGAL-2025-789",
  "matter": "Smith v. TechCorp - Employment Discrimination",
  "attorney": "Jennifer Martinez, Partner",
  "research_query": "Precedents for wrongful termination claims based on age discrimination in tech industry, California jurisdiction",
  "ai_results": [
    {
      "case": "Johnson v. Google Inc., 2019 WL 2847593 (N.D. Cal.)",
      "summary": "Age discrimination claim by 58-year-old engineer...",
      "confidence": 0.94,
      "verified": true
    },
    {
      "case": "Williams v. Meta Platforms, 2022 Cal. App. 4th 1234",
      "summary": "Settlement precedent for tech workers over 50...",
      "confidence": 0.87,
      "verified": false,
      "verification_note": "CASE NOT FOUND - Possible hallucination"
    },
    {
      "case": "Reid v. Hewlett-Packard, 2018 WL 1876234 (9th Cir.)",
      "summary": "Established burden-shifting framework...",
      "confidence": 0.91,
      "verified": true
    }
  ]
}
```

### Demo Script

**[Scene: Partner discovers opposing counsel has challenged a cited case]**

1. **Show the Problem**
   - "Our AI research assistant cited 'Williams v. Meta Platforms' - but that case doesn't exist."
   - "Opposing counsel is moving for sanctions. We need to prove we had verification processes."

2. **Open AI Audit Layer**
   - Search for research session "LEGAL-2025-789"
   - Show full audit trail of the research process

3. **Show Verification Flags**
   - Highlight that the AI reported only 87% confidence on the problematic citation
   - Show the audit log captured "verification_status: pending"
   - "Our system flagged this for manual verification - the ball was dropped on our side, not the AI."

4. **Generate Incident Report**
   - Document what went wrong
   - Show chain of custody for the research
   - "This proves we had safeguards. The AI flagged uncertainty. Human oversight failed."

5. **Systemic Fix**
   - Show how they can add a rule: "Block citations with <90% confidence until manually verified"

---

*Generated by Agent 7: Demo Scenario Builder*
