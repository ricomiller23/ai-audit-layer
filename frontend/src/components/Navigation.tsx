import { LayoutDashboard, ListFilter, ShieldCheck, Settings, Bell } from "lucide-react";

export const Sidebar = () => {
    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-500 w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">AI Audit Layer</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <a href="#" className="flex items-center gap-3 p-3 bg-blue-600/10 text-blue-500 rounded-lg font-medium">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors rounded-lg">
                    <ListFilter size={20} />
                    <span>Audit Explorer</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors rounded-lg">
                    <ShieldCheck size={20} />
                    <span>Compliance</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors rounded-lg">
                    <Settings size={20} />
                    <span>Settings</span>
                </a>
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                v1.0.0-alpha
            </div>
        </aside>
    );
};

export const Navbar = () => {
    return (
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-slate-200">Overview</h1>
                <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded border border-green-500/20 tracking-wider">
                    System Healthy
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-white relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
                </button>
                <div className="flex items-center gap-3 border-l border-slate-800 pl-6 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase">
                        EM
                    </div>
                    <span>Eric Miller</span>
                </div>
            </div>
        </header>
    );
};
