import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { getTrendColor, getTrendIcon, formatNumber, formatCurrency, formatPercent } from '@/utils/formatters';

interface StatCardProps {
  title: string;
  value: number;
  unit?: 'number' | 'currency' | 'percent';
  trend?: number;
  icon: React.ReactNode;
  delay?: number;
  isPositiveGood?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = 'number',
  trend,
  icon,
  delay = 0,
  isPositiveGood = true,
}) => {
  const animatedValue = useAnimatedNumber(value, { duration: 1200, decimals: unit === 'percent' ? 1 : 0 });
  const trendIcon = trend !== undefined ? getTrendIcon(trend) : null;
  const trendColor = trend !== undefined ? getTrendColor(trend, isPositiveGood) : '';

  const formatValue = (val: number) => {
    switch (unit) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return formatPercent(val);
      default:
        return formatNumber(val);
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            {trendIcon === 'up' && <TrendingUp className="w-4 h-4" />}
            {trendIcon === 'down' && <TrendingDown className="w-4 h-4" />}
            {trendIcon === 'flat' && <Minus className="w-4 h-4" />}
            <span>{Math.abs(trend)}{unit === 'percent' ? 'pct' : ''}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
        {formatValue(animatedValue)}
      </p>
      {trend !== undefined && (
        <p className="text-xs text-gray-400 mt-1">较昨日</p>
      )}
    </div>
  );
};
