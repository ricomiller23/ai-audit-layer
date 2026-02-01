import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: LucideIcon;
    iconColor: string;
}

export const MetricCard = ({ title, value, change, trend, icon: Icon, iconColor }: MetricCardProps) => {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10 text-opacity-100`}>
                    <Icon size={24} className={iconColor.replace('bg-', 'text-')} />
                </div>
                {change && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend === 'up' ? 'text-green-400 bg-green-400/10' :
                            trend === 'down' ? 'text-red-400 bg-red-400/10' :
                                'text-slate-400 bg-slate-400/10'
                        }`}>
                        {change}
                    </span>
                )}
            </div>
            <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>

            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent -mr-8 -mb-8 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
        </div>
    );
};
