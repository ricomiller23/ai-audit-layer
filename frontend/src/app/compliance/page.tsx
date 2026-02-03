"use client";

import {
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FileLock2,
    Download,
    Info,
    Calendar,
    ChevronRight
} from "lucide-react";

import { useToast } from "@/components/Toast";

export default function Compliance() {
    const { showToast } = useToast();

    const handleGenerateReport = (reportName: string) => {
        showToast(`Generating ${reportName}...`, 'info');
        // Simulate API call
        setTimeout(() => {
            showToast(`${reportName} ready for download`, 'success');
        }, 1500);
    };

    const handleScan = () => {
        showToast("Initiating compliance scan...", 'info');
        setTimeout(() => {
            showToast("Scan complete: 100% compliant", 'success');
        }, 2000);
    };

    const requirements = [
        {
            id: "soc2",
            name: "SOC 2 Type II",
            description: "Controls for security, availability, and processing integrity.",
            status: "Compliant",
            lastAudit: "2023-11-15",
            risk: "Low"
        },
        {
            id: "gdpr",
            name: "GDPR Art. 22",
            description: "Automated individual decision-making, including profiling.",
            status: "Compliant",
            lastAudit: "2024-01-20",
            risk: "Low"
        },
        {
            id: "ecoa",
            name: "ECOA (Reg B)",
            description: "Equal Credit Opportunity Act adverse action requirements.",
            status: "Verified",
            lastAudit: "2024-01-30",
            risk: "Medium"
        },
        {
            id: "hipaa",
            name: "HIPAA Security Rule",
            description: "Standards for protecting ePHI in AI processing pipelines.",
            status: "Verified",
            lastAudit: "2023-12-05",
            risk: "Low"
        },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Compliance Status</h2>
                    <p className="text-slate-400 mt-1">Institutional-grade governance for AI integrations.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleScan}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-600/20"
                    >
                        <ShieldCheck size={18} />
                        Run Compliance Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Requirements List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requirements.map((req) => (
                            <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-600/10 rounded-lg">
                                            <FileLock2 className="text-blue-500" size={24} />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.status === 'Compliant' ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-2">{req.name}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                        {req.description}
                                    </p>
                                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                            <Calendar size={12} />
                                            Last Audit: {req.lastAudit}
                                        </div>
                                        <button
                                            onClick={() => showToast(`Opening ${req.name} audit report...`, 'info')}
                                            className="text-xs font-bold text-blue-400 hover:text-blue-300"
                                        >
                                            View Report
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full blur-2xl transition-all group-hover:bg-blue-500/10"></div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck size={18} className="text-blue-500" />
                            <h3 className="font-semibold text-slate-200">Governance Log</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { event: "Policy Update", date: "2h ago", user: "Eric Miller", desc: "Updated LLM safety guidelines for SOC 2." },
                                { event: "Audit Complete", date: "1d ago", user: "System", desc: "Weekly compliance scan passed with 100% score." },
                                { event: "Key Rotation", date: "3d ago", user: "Eric Miller", desc: "Production API keys rotated successfully." },
                            ].map((log, idx) => (
                                <div key={idx} className="flex gap-4 p-3 hover:bg-slate-800/30 rounded-lg transition-colors border border-transparent hover:border-slate-800">
                                    <div className="mt-1">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-200">{log.event}</span>
                                            <span className="text-[10px] text-slate-500">{log.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">{log.desc}</p>
                                        <p className="text-[10px] text-slate-600 font-mono mt-1">Initiated by: {log.user}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl overflow-hidden relative">
                        <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
                            <AlertCircle size={18} className="text-orange-500" />
                            Active Alerts
                        </h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Critical</p>
                                <p className="text-sm text-slate-200 mb-2">Model drift detected in 'diagnosis_assist'.</p>
                                <button className="text-[10px] font-bold text-red-400 hover:text-red-300" onClick={() => showToast("Investigation ticket #2481 created", 'success')}>INVESTIGATE NOW</button>
                            </div>
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Warning</p>
                                <p className="text-sm text-slate-200 mb-2">API key 'al_sk_finance' expires in 48h.</p>
                                <button className="text-[10px] font-bold text-orange-400 hover:text-orange-300" onClick={() => showToast("Key rotation wizard started", 'info')}>ROTATE KEY</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Download size={18} className="text-blue-500" />
                            <h3 className="font-bold text-white uppercase tracking-tight">Report Center</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Generate and download localized compliance artifacts for regulatory submission.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => handleGenerateReport("Monthly Regulatory PDF")}
                                className="w-full py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all text-left px-4 flex justify-between items-center group"
                            >
                                Monthly Regulatory PDF
                                <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-all" />
                            </button>
                            <button
                                onClick={() => handleGenerateReport("Audit Log JSON")}
                                className="w-full py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all text-left px-4 flex justify-between items-center group"
                            >
                                Audit Log JSON Bundle
                                <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-all" />
                            </button>
                            <button
                                onClick={() => handleGenerateReport("Ruleset Manifest")}
                                className="w-full py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all text-left px-4 flex justify-between items-center group"
                            >
                                Ruleset Manifest (YAML)
                                <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10 flex gap-3">
                        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Compliance statuses are refreshed every 60 minutes based on automated scanning of AI decision trails and security controls.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
