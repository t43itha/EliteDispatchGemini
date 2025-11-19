
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = "text-slate-600" }) => {
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-card hover:shadow-soft transition-shadow border border-slate-100/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{value}</h3>
          {trend && <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-full">{trend}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color.replace('text-', 'text-').replace('600', '500')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};