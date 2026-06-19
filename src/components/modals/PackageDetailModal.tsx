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
import { Clock, Star, AlertTriangle, MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Tabs } from '@/components/shared/Tabs';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import { formatCurrency, formatPercent, formatNumber, formatTime } from '@/utils/formatters';
import type { MissedChargeRecord } from '@/types';

const DOCTOR_COLORS = ['#0D9488', '#0EA5E9', '#8B5CF6', '#F97316', '#10B981'];

const MissedChargeRow: React.FC<{
  record: MissedChargeRecord;
  onConvertToMessage: (record: MissedChargeRecord) => void;
}> = ({ record, onConvertToMessage }) => {
  const isUnresolved = record.status === 'unresolved';
  const isRectifying = record.status === 'rectifying';
  const isRectified = record.status === 'rectified';

  const getRowBg = () => {
    if (isUnresolved) return 'bg-red-50/30';
    if (isRectifying) return 'bg-amber-50/30';
    return 'bg-green-50/30';
  };

  return (
    <tr className={`border-b border-gray-50 ${getRowBg()}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {isUnresolved && <XCircle className="w-4 h-4 text-red-500" />}
          {isRectifying && <Clock className="w-4 h-4 text-amber-500" />}
          {isRectified && <CheckCircle className="w-4 h-4 text-green-500" />}
          <span className="text-sm font-medium text-gray-900">{record.patientName}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700">{record.doctorName}</td>
      <td className="py-3 px-4 text-sm text-gray-700">{record.consultantName}</td>
      <td className="py-3 px-4 text-sm text-gray-500">{record.timeSlot}</td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium text-red-600">{record.chargeItem}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono font-semibold text-red-600">{formatCurrency(record.missedAmount)}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isUnresolved ? 'bg-red-100 text-red-700' :
          isRectifying ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {isUnresolved ? '未处理' : isRectifying ? '整改中' : '已补收'}
        </span>
      </td>
      <td className="py-3 px-4">
        {isUnresolved && (
          <button
            onClick={() => onConvertToMessage(record)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <Send className="w-3 h-3" />
            转整改
          </button>
        )}
        {isRectifying && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            已转前台
          </span>
        )}
      </td>
    </tr>
  );
};

export const PackageDetailModal: React.FC = () => {
  const { selectedPackage, packageDetail, loading, convertMissedChargeToMessage } = useDashboardStore();
  const { showPackageModal, closePackageModal, activeDetailTab, setActiveDetailTab, openMessagePanel, highlightedTimeSlot } = useUIStore();

  if (!selectedPackage) return null;

  const tabs = [
    { key: 'doctors', label: '医生表现' },
    { key: 'consultants', label: '咨询师表现' },
    { key: 'timeslots', label: '时段表现' },
    { key: 'missed_charges', label: '漏收追踪' },
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

  const missedCharges = packageDetail?.missedCharges || [];
  const unresolvedCount = missedCharges.filter(mc => mc.status === 'unresolved').length;
  const rectifyingCount = missedCharges.filter(mc => mc.status === 'rectifying').length;
  const rectifiedCount = missedCharges.filter(mc => mc.status === 'rectified').length;
  const totalMissedAmount = missedCharges
    .filter(mc => mc.status !== 'rectified')
    .reduce((sum, mc) => sum + mc.missedAmount, 0);

  const doctorMissedMap = new Map<string, { name: string; count: number; amount: number }>();
  const consultantMissedMap = new Map<string, { name: string; count: number; amount: number }>();
  missedCharges.filter(mc => mc.status !== 'rectified').forEach(mc => {
    const d = doctorMissedMap.get(mc.doctorId) || { name: mc.doctorName, count: 0, amount: 0 };
    d.count++;
    d.amount += mc.missedAmount;
    doctorMissedMap.set(mc.doctorId, d);

    const c = consultantMissedMap.get(mc.consultantId) || { name: mc.consultantName, count: 0, amount: 0 };
    c.count++;
    c.amount += mc.missedAmount;
    consultantMissedMap.set(mc.consultantId, c);
  });

  const handleConvertToMessage = (record: MissedChargeRecord) => {
    const today = new Date().toISOString().split('T')[0];
    convertMissedChargeToMessage(
      record.id,
      `[漏收整改] ${record.patientName}的${record.chargeItem}（¥${record.missedAmount}）未收取，请前台核实并补收`,
      'reception',
      today
    );
    openMessagePanel();
  };

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
                  const isHighlighted = highlightedTimeSlot === slot.time;
                  return (
                    <tr
                      key={slot.time}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-sky-50/80 border-x-2 border-sky-400'
                          : isLowConversion
                          ? 'bg-amber-50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isHighlighted ? 'text-sky-500' : 'text-gray-400'}`} />
                          <span className="font-medium text-gray-900">{slot.time}</span>
                          {isLowConversion && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          {isHighlighted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-medium">
                              关联异常
                            </span>
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

      {!loading && activeDetailTab === 'missed_charges' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-600 mb-1">未处理</p>
              <p className="text-2xl font-bold text-red-700 font-mono">{unresolvedCount}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-700 mb-1">整改中</p>
              <p className="text-2xl font-bold text-amber-700 font-mono">{rectifyingCount}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-600 mb-1">已补收</p>
              <p className="text-2xl font-bold text-green-700 font-mono">{rectifiedCount}</p>
            </div>
          </div>

          {(doctorMissedMap.size > 0 || consultantMissedMap.size > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">医生漏收排名</p>
                <div className="space-y-2">
                  {Array.from(doctorMissedMap.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([id, data]) => (
                      <div key={id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{data.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-600 font-mono">{data.count}次</span>
                          <span className="text-xs font-mono font-semibold text-red-700">{formatCurrency(data.amount)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">咨询师漏收排名</p>
                <div className="space-y-2">
                  {Array.from(consultantMissedMap.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([id, data]) => (
                      <div key={id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{data.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-600 font-mono">{data.count}次</span>
                          <span className="text-xs font-mono font-semibold text-red-700">{formatCurrency(data.amount)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {missedCharges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">患者</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">医生</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">咨询师</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时段</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">漏收项目</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {missedCharges.map((record) => (
                    <MissedChargeRow
                      key={record.id}
                      record={record}
                      onConvertToMessage={handleConvertToMessage}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">该套餐暂无漏收记录</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
