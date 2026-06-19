import React from 'react';
import { CalendarCheck, Users, CreditCard, DollarSign, Sparkles, Target, AlertTriangle, RotateCcw } from 'lucide-react';
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
  const { overviewStats, viewMode, packages, loading } = useDashboardStore();

  const totalTargetSales = packages.reduce((sum, pkg) => sum + pkg.targetSales, 0);
  const totalSales = packages.reduce((sum, pkg) => sum + pkg.sales, 0);
  const targetCompletionRate = totalTargetSales > 0 ? Math.round((totalSales / totalTargetSales) * 100) : 0;
  const totalRefunds = packages.reduce((sum, pkg) => sum + pkg.refunds, 0);
  const totalMissedCharges = packages.reduce((sum, pkg) => {
    return sum + Math.floor(Math.random() * 2);
  }, 0);

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

  const morningCards = [
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
      value: 5,
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
      value: 2,
      unit: 'number' as const,
      icon: <CreditCard className="w-5 h-5" />,
      delay: 500,
      isPositiveGood: false,
    },
  ];

  const eveningCards = [
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
      title: '漏收笔数',
      value: 4,
      unit: 'number' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
      delay: 400,
      isPositiveGood: false,
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
          />
        ))}
      </div>
    </div>
  );
};
