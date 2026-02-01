"use client";

import { X, Shield, FileText, Hash, Clock, User, Server } from "lucide-react";
import { AuditLogDetail } from "@/lib/api";

interface DetailModalProps {
    log: AuditLogDetail | null;
    isOpen: boolean;
    onClose: () => void;
}

export const DetailModal = ({ log, isOpen, onClose }: DetailModalProps) => {
    if (!isOpen || !log) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${log.risk_level === 'low' ? 'bg-green-500/10 text-green-500' :
                                log.risk_level === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-red-500/10 text-red-500'
                            }`}>
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Audit Log Detail</h2>
                            <p className="text-xs text-slate-500 font-mono">{log.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 flex items-center gap-1.5 text-xs mb-1">
                                <Clock size={12} /> Timestamp
                            </div>
                            <div className="text-sm font-medium text-slate-200">{new Date(log.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 flex items-center gap-1.5 text-xs mb-1">
                                <User size={12} /> User ID
                            </div>
                            <div className="text-sm font-medium text-slate-200">{log.user_id}</div>
                        </div>
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 flex items-center gap-1.5 text-xs mb-1">
                                <Server size={12} /> Model
                            </div>
                            <div className="text-sm font-medium text-slate-200">{log.model_name}</div>
                        </div>
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                            <div className="text-slate-500 flex items-center gap-1.5 text-xs mb-1">
                                <Shield size={12} /> Outcome
                            </div>
                            <div className={`text-sm font-bold uppercase ${log.decision_outcome === 'approved' ? 'text-green-500' :
                                    log.decision_outcome === 'denied' ? 'text-red-500' :
                                        'text-orange-500'
                                }`}>{log.decision_outcome}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Prompt/Response */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">System Prompt / Input</h3>
                                    <span className="text-[10px] text-slate-600 font-mono">{log.prompt_tokens} tokens</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {log.prompt_content}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Response / Output</h3>
                                    <span className="text-[10px] text-slate-600 font-mono">{log.response_tokens} tokens</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-blue-500/30 text-sm text-blue-100 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                    {log.response_content}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Reasoning & Factors */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Reasoning Engine</h3>
                                <div className="p-5 bg-slate-800/30 rounded-xl border border-slate-800 text-sm">
                                    <p className="text-slate-300 italic">"{log.reasoning || "No explicit reasoning provided by model."}"</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {log.compliance_tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold border border-blue-500/10">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {log.factors && Object.keys(log.factors).length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Weighted Decision Factors</h3>
                                    <div className="space-y-3 p-5 bg-slate-950/50 rounded-xl border border-slate-800">
                                        {Object.entries(log.factors).map(([name, data]: [string, any], i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-400 capitalize">{name.replace('_', ' ')}</span>
                                                    <span className={data.passed ? 'text-green-500' : 'text-red-500'}>
                                                        {data.value} {typeof data.value === 'number' && '%'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${data.passed ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${typeof data.value === 'number' ? Math.min(data.value, 100) : 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Hash size={16} className="text-slate-500" />
                                    <span className="text-xs font-mono text-slate-500 truncate max-w-xs">{log.content_hash}</span>
                                </div>
                                <div className="flex items-center gap-1 text-green-500">
                                    <Shield size={14} />
                                    <span className="text-[10px] font-bold uppercase">Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                        Copy Request ID
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        <FileText size={18} />
                        Export Full Audit PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
