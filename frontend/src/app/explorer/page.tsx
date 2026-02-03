"use client";

import { useEffect, useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import {
    ListFilter,
    Search,
    ChevronRight,
    Shield,
    Download,
    Filter,
    ArrowUpDown
} from "lucide-react";
import { fetchLogs, fetchLogDetail, AuditLog, AuditLogDetail } from "@/lib/api";

export default function Explorer() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filterOutcome, setFilterOutcome] = useState("all");

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchLogs({ limit: 50 });
            setLogs(data.logs);
        } catch (err) {
            console.error("Failed to load logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLogClick = async (id: string) => {
        try {
            const detail = await fetchLogDetail(id);
            setSelectedLog(detail);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Failed to load log details", err);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.decision_type?.toLowerCase().includes(search.toLowerCase()) ||
            log.model_name?.toLowerCase().includes(search.toLowerCase());

        const matchesOutcome = filterOutcome === "all" || log.decision_outcome === filterOutcome;

        return matchesSearch && matchesOutcome;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 animate-pulse font-medium">Loading Audit Trail...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Audit Explorer</h2>
                    <p className="text-slate-400 mt-1">Full-spectrum visibility into every AI decision.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-slate-700">
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by decision type, model, or org..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-500" />
                        <select
                            className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[140px]"
                            value={filterOutcome}
                            onChange={(e) => setFilterOutcome(e.target.value)}
                        >
                            <option value="all">All Outcomes</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                            <option value="flagged">Flagged</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Decision Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Latency</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    onClick={() => handleLogClick(log.id)}
                                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-slate-500 font-mono uppercase">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                            {log.decision_type || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-400 font-mono">{log.model_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-400">{log.duration_ms}ms</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.decision_outcome === 'approved' ? 'text-green-500 bg-green-500/10' :
                                            log.decision_outcome === 'denied' ? 'text-red-500 bg-red-500/10' :
                                                'text-orange-500 bg-orange-500/10'
                                            }`}>
                                            {log.decision_outcome}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${log.risk_level === 'low' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                                log.risk_level === 'medium' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' :
                                                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                                }`} />
                                            <span className="text-xs text-slate-400 capitalize">{log.risk_level}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all inline" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="p-12 text-center">
                        <Shield size={48} className="mx-auto text-slate-800 mb-4" />
                        <p className="text-slate-500">No audit logs found matching your criteria.</p>
                    </div>
                )}
            </div>

            <DetailModal
                log={selectedLog}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
