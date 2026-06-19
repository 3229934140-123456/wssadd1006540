import React from 'react';
import { CalendarCheck, Users, CreditCard, DollarSign, Sparkles } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { useDashboardStore } from '@/store/useDashboardStore';

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100" />
      <div className="w-16 h-5 bg-gray-100 rounded" />
    </div>
    <div className="w-24 h-4 bg-gray-100 rounded mb-2" />
    <div className="w-32 h-8 bg-gray-100 rounded" />
  </div>
);

export const OverviewCards: React.FC = () => {
  const { overviewStats, loading } = useDashboardStore();

  if (loading || !overviewStats) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">今日概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">今日概览</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="预约人数"
          value={overviewStats.appointmentCount}
          unit="number"
          trend={overviewStats.comparedYesterday.appointmentCount}
          icon={<CalendarCheck className="w-5 h-5" />}
          delay={100}
        />
        <StatCard
          title="实际到店"
          value={overviewStats.actualArrival}
          unit="number"
          trend={overviewStats.comparedYesterday.actualArrival}
          icon={<Users className="w-5 h-5" />}
          delay={200}
        />
        <StatCard
          title="套餐成交"
          value={overviewStats.packageDeals}
          unit="number"
          trend={overviewStats.comparedYesterday.packageDeals}
          icon={<CreditCard className="w-5 h-5" />}
          delay={300}
        />
        <StatCard
          title="客单价"
          value={overviewStats.avgOrderValue}
          unit="currency"
          trend={overviewStats.comparedYesterday.avgOrderValue}
          icon={<DollarSign className="w-5 h-5" />}
          delay={400}
        />
        <StatCard
          title="抛光加购率"
          value={overviewStats.polishAddRate}
          unit="percent"
          trend={overviewStats.comparedYesterday.polishAddRate}
          icon={<Sparkles className="w-5 h-5" />}
          delay={500}
        />
      </div>
    </div>
  );
};
