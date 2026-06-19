import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

type TrendMetric = 'deals' | 'refunds' | 'missed' | 'addon';

const metricConfig: Record<TrendMetric, { label: string; color: string; unit: string }> = {
  deals: { label: '套餐成交', color: '#0d9488', unit: '笔' },
  refunds: { label: '退款数', color: '#ef4444', unit: '笔' },
  missed: { label: '漏收数', color: '#f59e0b', unit: '笔' },
  addon: { label: '抛光加购率', color: '#8b5cf6', unit: '%' },
};

export const TrendChart: React.FC = () => {
  const { trendData, currentDate, setCurrentDate } = useDashboardStore();
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('deals');

  const todayStr = currentDate.toISOString().split('T')[0];

  const handleBarClick = (data: any) => {
    if (data?.dateStr) {
      const clickedDate = new Date(data.dateStr + 'T00:00:00');
      setCurrentDate(clickedDate);
    }
  };

  const chartData = trendData.map(item => ({
    ...item,
    isSelected: item.dateStr === todayStr,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">近7天趋势</h2>
            <p className="text-xs text-gray-500">点击柱状图可跳转至对应日期复盘</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {(Object.keys(metricConfig) as TrendMetric[]).map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMetric === metric
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {metricConfig[metric].label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}${metricConfig[selectedMetric].unit === '%' ? '' : ''}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
              }}
              cursor={{ fill: '#f0fdfa' }}
              formatter={(value: number) => [
                `${value}${metricConfig[selectedMetric].unit}`,
                metricConfig[selectedMetric].label,
              ]}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Bar
              dataKey={
                selectedMetric === 'deals'
                  ? 'packageDeals'
                  : selectedMetric === 'refunds'
                  ? 'refunds'
                  : selectedMetric === 'missed'
                  ? 'missedCharges'
                  : 'polishAddRate'
              }
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
              barSize={36}
              activeBar={{
                fill: metricConfig[selectedMetric].color,
                opacity: 0.8,
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={metricConfig[selectedMetric].color}
                  fillOpacity={entry.isSelected ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-sm bg-teal-600" style={{ opacity: 1 }} />
          <span>选中日期</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-sm bg-gray-400" style={{ opacity: 0.4 }} />
          <span>其他日期</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>点击柱子可切换日期</span>
        </div>
      </div>
    </div>
  );
};
