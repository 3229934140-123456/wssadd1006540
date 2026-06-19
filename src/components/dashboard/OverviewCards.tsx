import React from 'react';
import { CalendarCheck, Users, CreditCard, DollarSign, Sparkles, Target, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
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
  const { overviewStats, viewMode, packages, alerts, messages, missedCharges, loading } = useDashboardStore();

  const totalTargetSales = packages.reduce((sum, pkg) => sum + pkg.targetSales, 0);
  const totalSales = packages.reduce((sum, pkg) => sum + pkg.sales, 0);
  const targetCompletionRate = totalTargetSales > 0 ? Math.round((totalSales / totalTargetSales) * 100) : 0;
  const totalRefunds = packages.reduce((sum, pkg) => sum + pkg.refunds, 0);

  const pendingMessagesCount = messages.filter(m => m.status === 'pending').length;
  const unresolvedMC = missedCharges.filter(mc => mc.status === 'unresolved').length;
  const rectifyingMC = missedCharges.filter(mc => mc.status === 'rectifying').length;
  const rectifiedMC = missedCharges.filter(mc => mc.status === 'rectified').length;
  const activeMissedCharges = unresolvedMC + rectifyingMC;
  const alertsCount = alerts.length;

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

  const morningCards: Array<{
    title: string;
    value: number;
    unit: 'number' | 'currency' | 'percent';
    trend?: number;
    icon: React.ReactNode;
    delay: number;
    isPositiveGood?: boolean;
    subtitle?: string;
    subtitleColor?: string;
  }> = [
    {
      title: '预约人数',
      value: overviewStats.appointmentCount,
      unit: 'number' as const,
      trend: overviewStats.comparedYesterday.appointmentCount,
      icon: <CalendarCheck className="w-5 h-5" />,
      delay: 100,
    },
    {
      title: '目标完成率',
      value: targetCompletionRate,
      unit: 'percent' as const,
      icon: <Target className="w-5 h-5" />,
      delay: 200,
    },
    {
      title: '异常提醒',
      value: alertsCount,
      unit: 'number' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
      delay: 300,
      isPositiveGood: false,
    },
    {
      title: '抛光加购率',
      value: overviewStats.polishAddRate,
      unit: 'percent' as const,
      trend: overviewStats.comparedYesterday.polishAddRate,
      icon: <Sparkles className="w-5 h-5" />,
      delay: 400,
    },
    {
      title: '待执行留言',
      value: pendingMessagesCount,
      unit: 'number' as const,
      icon: <Clock className="w-5 h-5" />,
      delay: 500,
      isPositiveGood: false,
    },
  ];

  const eveningCards: Array<{
    title: string;
    value: number;
    unit: 'number' | 'currency' | 'percent';
    trend?: number;
    icon: React.ReactNode;
    delay: number;
    isPositiveGood?: boolean;
    subtitle?: string;
    subtitleColor?: string;
  }> = [
    {
      title: '套餐成交',
      value: overviewStats.packageDeals,
      unit: 'number' as const,
      trend: overviewStats.comparedYesterday.packageDeals,
      icon: <CreditCard className="w-5 h-5" />,
      delay: 100,
    },
    {
      title: '客单价',
      value: overviewStats.avgOrderValue,
      unit: 'currency' as const,
      trend: overviewStats.comparedYesterday.avgOrderValue,
      icon: <DollarSign className="w-5 h-5" />,
      delay: 200,
    },
    {
      title: '退款数',
      value: totalRefunds,
      unit: 'number' as const,
      icon: <RotateCcw className="w-5 h-5" />,
      delay: 300,
      isPositiveGood: false,
    },
    {
      title: '漏收',
      value: activeMissedCharges,
      unit: 'number' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
      delay: 400,
      isPositiveGood: false,
      subtitle: `${unresolvedMC}未处理 / ${rectifyingMC}整改中 / ${rectifiedMC}已补收`,
      subtitleColor: unresolvedMC > 0 ? 'text-red-500' : rectifyingMC > 0 ? 'text-amber-500' : 'text-gray-400',
    },
    {
      title: '抛光加购率',
      value: overviewStats.polishAddRate,
      unit: 'percent' as const,
      trend: overviewStats.comparedYesterday.polishAddRate,
      icon: <Sparkles className="w-5 h-5" />,
      delay: 500,
    },
  ];

  const cards = viewMode === 'morning' ? morningCards : eveningCards;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">今日概览</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          viewMode === 'morning'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-indigo-50 text-indigo-600'
        }`}>
          {viewMode === 'morning' ? '开店前视角' : '收班后视角'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <StatCard
            key={`${viewMode}-${index}`}
            title={card.title}
            value={card.value}
            unit={card.unit}
            trend={card.trend}
            icon={card.icon}
            delay={card.delay}
            isPositiveGood={card.isPositiveGood}
            subtitle={card.subtitle}
            subtitleColor={card.subtitleColor}
          />
        ))}
      </div>
    </div>
  );
};
