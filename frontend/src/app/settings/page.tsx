"use client";

import {
    Settings as SettingsIcon,
    Key,
    Building2,
    BellRing,
    ShieldAlert,
    Copy,
    Eye,
    RefreshCw,
    Save
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
    const [showKey, setShowKey] = useState(false);
    const apiKey = "al_sk_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">System Settings</h2>
                    <p className="text-slate-400 mt-1">Configure your organization and security preferences.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-600/20">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* API Access Section */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-600/10 rounded-lg">
                                <Key className="text-blue-500" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-white">API Access</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Production API Secret Key</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 font-mono text-sm text-slate-300 flex items-center justify-between overflow-hidden">
                                        <span className="truncate">{showKey ? apiKey : "••••••••••••••••••••••••••••••••••••••••"}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowKey(!showKey)}
                                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all"
                                        title="Toggle Visibility"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all" title="Copy to Clipboard">
                                        <Copy size={18} />
                                    </button>
                                    <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all" title="Rotate Key">
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                                <p className="mt-2 text-[10px] text-slate-500 italic">This key allows full access to your organization's audit logs. Rotate it immediately if compromised.</p>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Enable Webhook Notifications</span>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Strict IP Whitelisting</span>
                                    <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-slate-400 rounded-full transition-all"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-600/10 rounded-lg">
                                <ShieldAlert className="text-orange-500" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-white">Security & Guardrails</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: "Audit-Only Mode", desc: "Logs decisions without active enforcement results." },
                                { label: "Mandatory Cryptographic Hashing", desc: "Ensures every log entry has a SHA-256 proof." },
                                { label: "Anonymize User Data", desc: "Strip PII from prompts before storing in the audit trail." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item hover:bg-slate-800/50 p-2 rounded-lg transition-colors -mx-2">
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{item.label}</p>
                                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                                    </div>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Org Section Section */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-600/10 rounded-lg">
                                <Building2 className="text-purple-500" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-white">Organization Profile</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Organization Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                                    defaultValue="Eric Miller Enterprises"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Contact Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
                                    defaultValue="eric@i-mac.local"
                                />
                            </div>
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Industry Focus</label>
                                <div className="flex flex-wrap gap-2">
                                    {["FinTech", "HealthTech", "Legal"].map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700">{tag}</span>
                                    ))}
                                    <button className="px-3 py-1 bg-blue-600/10 text-blue-500 rounded-full text-xs font-bold border border-blue-500/20">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-600/10 rounded-lg">
                                <BellRing className="text-green-500" size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-white">Notifications</h3>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: "Critical Risk Alerts", status: "Instant" },
                                { label: "Compliance Score Drop", status: "Instant" },
                                { label: "Daily Summary Report", status: "Email" },
                                { label: "Billing Updates", status: "Off" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                    <span className="text-sm text-slate-300">{item.label}</span>
                                    <span className={`text-[10px] font-bold uppercase ${item.status === 'Off' ? 'text-slate-500' : 'text-blue-500'}`}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
