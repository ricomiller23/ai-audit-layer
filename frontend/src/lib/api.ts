/**
 * AI Audit Layer - Frontend API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-audit-layer-api.railway.app';
const API_KEY = 'al_sk_demo'; // In a real app, this would come from auth

export interface AuditLog {
    id: string;
    timestamp: string;
    user_id: string;
    decision_type?: string;
    decision_outcome?: string;
    model_name: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    flagged: boolean;
    duration_ms: number;
}

export interface AuditLogDetail extends AuditLog {
    request_id: string;
    organization_id: string;
    prompt_content: string;
    prompt_tokens: number;
    response_content: string;
    response_tokens: number;
    reasoning?: string;
    factors?: Record<string, any>;
    compliance_tags: string[];
    metadata: Record<string, any>;
    content_hash: string;
}

export interface Metrics {
    total_today: int;
    total_week: int;
    total_month: int;
    approval_rate: float;
    denial_rate: float;
    flagged_rate: float;
    avg_duration_ms: float;
    by_outcome: Record<string, int>;
    by_model: Record<string, int>;
    by_decision_type: Record<string, int>;
}

export const fetchLogs = async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const resp = await fetch(`${API_URL}/api/v1/audit/logs${query}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!resp.ok) throw new Error('Failed to fetch logs');
    return resp.json();
};

export const fetchLogDetail = async (id: string) => {
    const resp = await fetch(`${API_URL}/api/v1/audit/logs/${id}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!resp.ok) throw new Error('Failed to fetch log details');
    return resp.json();
};

export const fetchMetrics = async () => {
    const resp = await fetch(`${API_URL}/api/v1/metrics`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!resp.ok) throw new Error('Failed to fetch metrics');
    return resp.json();
};
