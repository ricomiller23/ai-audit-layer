"use client";

import { LayoutDashboard, ListFilter, ShieldCheck, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Audit Explorer", href: "/explorer", icon: ListFilter },
        { name: "Compliance", href: "/compliance", icon: ShieldCheck },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
            <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-500 w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">AI Audit Layer</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg font-medium transition-all",
                                isActive
                                    ? "bg-blue-600/10 text-blue-500"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center uppercase tracking-widest font-semibold opacity-50">
                v1.0.0-PROD
            </div>
        </aside>
    );
};

export const Navbar = () => {
    const pathname = usePathname();

    const getPageTitle = () => {
        switch (pathname) {
            case '/': return 'Dashboard';
            case '/explorer': return 'Audit Explorer';
            case '/compliance': return 'Compliance';
            case '/settings': return 'Settings';
            default: return 'Overview';
        }
    };

    return (
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-slate-200">{getPageTitle()}</h1>
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
