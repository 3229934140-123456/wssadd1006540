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
import { User, UserCheck, Clock, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Tabs } from '@/components/shared/Tabs';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';

const DOCTOR_COLORS = ['#0D9488', '#0EA5E9', '#8B5CF6', '#F97316', '#10B981'];

export const PackageDetailModal: React.FC = () => {
  const { selectedPackage, packageDetail, loading } = useDashboardStore();
  const { showPackageModal, closePackageModal, activeDetailTab, setActiveDetailTab } = useUIStore();

  if (!selectedPackage) return null;

  const tabs = [
    { key: 'doctors', label: '医生表现' },
    { key: 'consultants', label: '咨询师表现' },
    { key: 'timeslots', label: '时段表现' },
  ];

  const doctorChartData = packageDetail?.doctors.map((doc, index) => ({
    name: doc.name,
    sales: doc.sales,
    fill: DOCTOR_COLORS[index % DOCTOR_COLORS.length],
  })) || [];

  const timeslotChartData = packageDetail?.timeSlots.map((slot) => ({
    name: slot.time,
    appointments: slot.appointments,
    dealRate: slot.dealRate,
  })) || [];

  return (
    <Modal
      isOpen={showPackageModal}
      onClose={closePackageModal}
      title={`${selectedPackage.name} - 详细表现`}
    >
      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">单价</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedPackage.price)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">今日销量</p>
            <p className="text-xl font-bold text-teal-600">{formatNumber(selectedPackage.sales)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">今日收入</p>
            <p className="text-xl font-bold text-teal-600">{formatCurrency(selectedPackage.revenue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">目标完成率</p>
            <p className="text-xl font-bold text-gray-900">
              {selectedPackage.targetSales > 0
                ? ((selectedPackage.sales / selectedPackage.targetSales) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeDetailTab} onChange={setActiveDetailTab} />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      )}

      {!loading && activeDetailTab === 'doctors' && (
        <div>
          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]} barSize={40}>
                  {doctorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">医生</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">销量</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">客单价</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">退款率</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">满意度</th>
                </tr>
              </thead>
              <tbody>
                {packageDetail?.doctors.map((doctor, index) => (
                  <tr key={doctor.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: DOCTOR_COLORS[index % DOCTOR_COLORS.length] }}
                        >
                          {doctor.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{doctor.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 font-mono font-semibold text-gray-900">
                      {formatNumber(doctor.sales)}
                    </td>
                    <td className="text-center py-3 px-4 font-mono text-teal-600">
                      {formatCurrency(doctor.avgPrice)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`font-mono font-medium ${
                          doctor.refundRate >= 15 ? 'text-red-500' : 'text-gray-900'
                        }`}
                      >
                        {formatPercent(doctor.refundRate)}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium text-gray-900">{doctor.satisfaction}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeDetailTab === 'consultants' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">咨询师</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">成交数</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">推荐率</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">加购率</th>
                </tr>
              </thead>
              <tbody>
                {packageDetail?.consultants.map((consultant, index) => (
                  <tr key={consultant.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: DOCTOR_COLORS[index % DOCTOR_COLORS.length] }}
                        >
                          {consultant.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{consultant.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 font-mono font-semibold text-gray-900">
                      {formatNumber(consultant.dealCount)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${consultant.recommendationRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-teal-600">{formatPercent(consultant.recommendationRate)}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: `${consultant.addOnRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-sky-600">{formatPercent(consultant.addOnRate)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeDetailTab === 'timeslots' && (
        <div>
          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeslotChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="appointments" radius={[4, 4, 0, 0]} barSize={30} fill="#0D9488" name="预约数" />
                <Bar dataKey="dealRate" radius={[4, 4, 0, 0]} barSize={30} fill="#F97316" name="成交率%" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时段</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">预约数</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">成交率</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">到店率</th>
                </tr>
              </thead>
              <tbody>
                {packageDetail?.timeSlots.map((slot) => {
                  const isLowConversion = slot.dealRate < 60 && slot.appointments >= 2;
                  return (
                    <tr
                      key={slot.time}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        isLowConversion ? 'bg-amber-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{slot.time}</span>
                          {isLowConversion && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-mono font-semibold text-gray-900">
                        {formatNumber(slot.appointments)}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`font-mono font-medium ${
                            isLowConversion ? 'text-red-500' : 'text-teal-600'
                          }`}
                        >
                          {formatPercent(slot.dealRate)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-mono font-medium text-gray-900">
                          {formatPercent(slot.arrivalRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};
