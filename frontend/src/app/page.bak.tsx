"use client";

import { useEffect, useState } from "react";
import { Sidebar, Navbar } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { DetailModal } from "@/components/DetailModal";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  Terminal,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { fetchLogs, fetchMetrics, fetchLogDetail, AuditLog, Metrics, AuditLogDetail } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function Home() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [logsData, metricsData] = await Promise.all([
        fetchLogs({ limit: 10 }),
        fetchMetrics()
      ]);
      setLogs(logsData.logs);
      setMetrics(metricsData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse font-medium">Loading AI Audit Layer...</p>
        </div>
      </div>
    );
  }

  // Chart Data
  const outcomeData = metrics ? Object.entries(metrics.by_outcome).map(([name, value]) => ({ name, value })) : [];
  const modelData = metrics ? Object.entries(metrics.by_model).map(([name, value]) => ({ name, value })) : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Compliance Overview</h2>
              <p className="text-slate-400 mt-1">Real-time monitoring and immutable audit trails.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className={`p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} />
              </button>
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-slate-700">
                <FileText size={18} />
                Generate Report
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-600/20">
                <Shield size={18} />
                Review All Decisions
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total AI Decisions"
              value={metrics?.total_today || 0}
              change="+25 new"
              trend="up"
              icon={Activity}
              iconColor="bg-blue-500"
            />
            <MetricCard
              title="Approval Rate"
              value={`${metrics?.approval_rate.toFixed(1)}%`}
              change="Verified"
              trend="neutral"
              icon={CheckCircle2}
              iconColor="bg-green-500"
            />
            <MetricCard
              title="Flagged Responses"
              value={`${metrics?.flagged_rate.toFixed(1)}%`}
              change="Action required"
              trend="up"
              icon={AlertTriangle}
              iconColor="bg-orange-500"
            />
            <MetricCard
              title="Avg Response Latency"
              value={`${metrics?.avg_duration_ms.toFixed(0)} ms`}
              change="Optimal"
              trend="up"
              icon={Clock}
              iconColor="bg-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Feed */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-blue-500" />
                    <h3 className="font-semibold text-slate-200">Real-Time Decision Feed</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Live Stream</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => handleLogClick(log.id)}
                      className="p-4 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.risk_level === 'low' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                              log.risk_level === 'medium' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' :
                                'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            }`} />
                          <div>
                            <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{log.decision_type || "General Interaction"}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{log.model_name} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="text-xs font-mono text-slate-500">
                            {log.duration_ms}ms
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.decision_outcome === 'approved' ? 'text-green-500 bg-green-500/10' :
                              log.decision_outcome === 'denied' ? 'text-red-500 bg-red-500/10' :
                                'text-orange-500 bg-orange-500/10'
                            }`}>
                            {log.decision_outcome}
                          </div>
                          <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="p-4 bg-slate-900 border-t border-slate-800 text-sm font-medium text-blue-500 hover:text-blue-400 hover:bg-slate-800/50 transition-all text-center">
                  View All Transactions
                </button>
              </div>

              {/* Analytics Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={18} className="text-blue-500" />
                  <h3 className="font-semibold text-slate-200">Outcome Distribution</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outcomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sidebar Stats/Info */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Activity size={18} className="text-blue-500" />
                  <h3 className="font-semibold text-slate-200">Model Usage</h3>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {modelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {modelData.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-400">{entry.name}</span>
                      </div>
                      <span className="text-slate-200 font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 p-6 rounded-xl relative overflow-hidden group shadow-2xl">
                <div className="relative z-10">
                  <Shield size={32} className="text-blue-500 mb-4" />
                  <h3 className="font-bold text-lg text-white mb-2">Immutable Hashing</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    Every AI decision is secured with SHA-256 cryptographic proofs, ensuring tamper-proof audit trails for regulators.
                  </p>
                  <button className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group">
                    View Verification Logs
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="font-semibold text-slate-200">Compliance Summary</h3>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { name: "SOC 2 Type II", status: "Certified", color: "text-green-500" },
                    { name: "ECOA Adverse Action", status: "Active", color: "text-blue-500" },
                    { name: "GDPR Art. 22", status: "Compliant", color: "text-green-500" },
                    { name: "HIPAA BAA", status: "Verified", color: "text-green-500" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">{item.name}</span>
                      <span className={`font-medium ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <DetailModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
