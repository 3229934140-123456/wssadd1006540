import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RotateCcw, DollarSign, Target } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import {
  formatCurrency,
  formatNumber,
  getPackageTypeColor,
  getPackageTypeLabel,
} from '@/utils/formatters';
import type { PackageCategory } from '@/types';

const COLORS = ['#0D9488', '#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#6366F1'];

const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <div className="w-24 h-4 bg-gray-100 rounded" />
    <div className="flex-1 h-8 bg-gray-100 rounded" />
    <div className="w-16 h-4 bg-gray-100 rounded" />
    <div className="w-16 h-4 bg-gray-100 rounded" />
    <div className="w-16 h-4 bg-gray-100 rounded" />
  </div>
);

interface PackageRowProps {
  pkg: PackageCategory;
  index: number;
  isSelected: boolean;
  onSelectAndOpen: (pkg: PackageCategory) => void;
}

const PackageRow: React.FC<PackageRowProps> = ({
  pkg,
  index,
  isSelected,
  onSelectAndOpen,
}) => {
  const refundRate = pkg.sales > 0 ? (pkg.refunds / pkg.sales) * 100 : 0;
  const completionRate = pkg.targetSales > 0 ? (pkg.sales / pkg.targetSales) * 100 : 0;
  const hasHighRefund = refundRate >= 15;

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 cursor-pointer transition-all hover:bg-teal-50/50 ${
        isSelected ? 'bg-teal-50' : ''
      }`}
      onClick={() => onSelectAndOpen(pkg)}
    >
      <div className="w-32 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${getPackageTypeColor(
              pkg.type
            )}`}
          >
            {getPackageTypeLabel(pkg.type)}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900 mt-1">{pkg.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(pkg.price)}</p>
      </div>

      <div className="flex-1 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{ name: pkg.name, sales: pkg.sales, target: pkg.targetSales }]}>
            <Bar
              dataKey="sales"
              radius={[4, 4, 0, 0]}
              barSize={32}
            >
              <Cell fill={COLORS[index % COLORS.length]} />
            </Bar>
            <Bar
              dataKey="target"
              radius={[4, 4, 0, 0]}
              barSize={32}
              fill="#E5E7EB"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center flex-shrink-0 w-16">
        <p className="text-lg font-semibold text-gray-900 font-mono">
          {formatNumber(pkg.sales)}
        </p>
        <div className="flex items-center gap-1 justify-center text-xs text-gray-500">
          <Target className="w-3 h-3" />
          <span>{completionRate.toFixed(0)}%</span>
        </div>
      </div>

      <div className="text-center flex-shrink-0 w-16">
        <p
          className={`text-lg font-semibold font-mono ${
            hasHighRefund ? 'text-red-500' : 'text-gray-900'
          }`}
        >
          {pkg.refunds}
        </p>
        <p className="text-xs text-gray-500">退款</p>
      </div>

      <div className="text-center flex-shrink-0 w-16">
        <p className="text-lg font-semibold text-gray-900 font-mono">{pkg.reschedules}</p>
        <p className="text-xs text-gray-500">改约</p>
      </div>

      <div className="text-center flex-shrink-0 w-20">
        <p className="text-sm font-semibold text-teal-600 font-mono">
          {formatCurrency(pkg.revenue)}
        </p>
      </div>

      <div className="flex-shrink-0 text-teal-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export const PackageStructure: React.FC = () => {
  const { packages, selectedPackage, selectPackage, loading } = useDashboardStore();
  const { openPackageModal } = useUIStore();

  const totalSales = packages.reduce((sum, pkg) => sum + pkg.sales, 0);
  const totalRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const totalRefunds = packages.reduce((sum, pkg) => sum + pkg.refunds, 0);

  const chartData = packages.map((pkg, index) => ({
    name: pkg.name,
    sales: pkg.sales,
    fill: COLORS[index % COLORS.length],
  }));

  const handleRowClick = (pkg: PackageCategory) => {
    selectPackage(pkg);
    openPackageModal();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="w-32 h-6 bg-gray-100 rounded animate-pulse" />
        </div>
        {[...Array(6)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">套餐结构</h2>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">总销量</span>
              <span className="font-semibold text-gray-900">{formatNumber(totalSales)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-500" />
              <span className="text-gray-500">总收入</span>
              <span className="font-semibold text-teal-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-500" />
              <span className="text-gray-500">总退款</span>
              <span className="font-semibold text-red-500">{formatNumber(totalRefunds)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-50">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {packages.map((pkg, index) => (
          <PackageRow
            key={pkg.id}
            pkg={pkg}
            index={index}
            isSelected={selectedPackage?.id === pkg.id}
            onSelectAndOpen={handleRowClick}
          />
        ))}
      </div>
    </div>
  );
};
