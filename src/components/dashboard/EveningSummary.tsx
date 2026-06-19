import React, { useState } from 'react';
import {
  Moon,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Send,
  XCircle,
  User,
  Stethoscope,
  Headphones,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import type { MissedChargeRecord, AnomalyAlert, ManagerMessage } from '@/types';
import type { DetailTab } from '@/store/useUIStore';

type RoleType = 'reception' | 'consultant' | 'doctor';

const roleConfig: Record<RoleType, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  reception: {
    label: '前台',
    icon: <Headphones className="w-4 h-4" />,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
  consultant: {
    label: '咨询师',
    icon: <User className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  doctor: {
    label: '医生',
    icon: <Stethoscope className="w-4 h-4" />,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
};

export const EveningSummary: React.FC = () => {
  const {
    overviewStats,
    packages,
    alerts,
    messages,
    currentDate,
    sendMessage,
    missedCharges,
    loading,
    hasTomorrowTodos,
    selectPackageById,
  } = useDashboardStore();
  const { openMessagePanel, openPackageDetailWithTab, toggleMessage } = useUIStore();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedRole, setExpandedRole] = useState<RoleType | null>(null);
  const [showHandover, setShowHandover] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalSales = packages.reduce((sum, pkg) => sum + pkg.sales, 0);
  const totalRefunds = packages.reduce((sum, pkg) => sum + pkg.refunds, 0);
  const totalRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const refundRate = totalSales > 0 ? Math.round((totalRefunds / totalSales) * 100) : 0;

  const todayStr = currentDate.toISOString().split('T')[0];
  const todayMessages = messages.filter(m => m.expectedDate === todayStr);
  const todayCompleted = todayMessages.filter(m => m.status === 'completed').length;
  const todayPending = todayMessages.filter(m => m.status === 'pending').length;
  const todayOverdue = todayMessages.filter(m => {
    if (m.status === 'completed') return false;
    return new Date(m.expectedDate) < new Date(todayStr);
  }).length;
  const completionRate = todayMessages.length > 0
    ? Math.round((todayCompleted / todayMessages.length) * 100)
    : 0;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const unresolvedMC = missedCharges.filter(mc => mc.status === 'unresolved');
  const rectifyingMC = missedCharges.filter(mc => mc.status === 'rectifying');
  const rectifiedMC = missedCharges.filter(mc => mc.status === 'rectified');

  const receptionMissedCharges = missedCharges.filter(mc => mc.status !== 'rectified');
  const receptionPendingMessages = messages.filter(m => m.targetRole === 'reception' && m.status === 'pending' && m.expectedDate === todayStr);

  const consultantLowAddon = alerts.filter(a => a.type === 'low_addon');
  const consultantLowConversion = alerts.filter(a => a.type === 'low_conversion');
  const consultantPendingMessages = messages.filter(m => m.targetRole === 'consultant' && m.status === 'pending' && m.expectedDate === todayStr);

  const doctorRefundAlerts = alerts.filter(a => a.type === 'high_refund');
  const doctorMissedCharges = missedCharges.filter(mc => mc.status !== 'rectified');
  const doctorPendingMessages = messages.filter(m => m.targetRole === 'doctor' && m.status === 'pending' && m.expectedDate === todayStr);

  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const alreadyGenerated = hasTomorrowTodos();

  const generateTomorrowTodos = async () => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingTodos = messages.filter(m =>
      m.expectedDate === tomorrowStr && m.content.startsWith('[待办]')
    );

    const todos: { content: string; role: 'reception' | 'consultant' | 'all' }[] = [];

    if (criticalAlerts > 0) {
      const firstCritical = alerts.find(a => a.severity === 'critical');
      if (firstCritical) {
        const content = `[待办] ${firstCritical.title} - ${firstCritical.suggestedAction || '请优先处理'}`;
        const exists = existingTodos.some(m => m.content.includes(firstCritical.title));
        if (!exists) todos.push({ content, role: 'all' });
      }
    }

    if (unresolvedMC.length > 0 || rectifyingMC.length > 0) {
      const content = `[待办] 今日漏收未处理${unresolvedMC.length}笔、整改中${rectifyingMC.length}笔，请前台核实处理并反馈结果`;
      const exists = existingTodos.some(m => m.content.includes('漏收') && m.targetRole === 'reception');
      if (!exists) todos.push({ content, role: 'reception' });
    }

    if (refundRate >= 10) {
      const content = `[待办] 今日退款率${refundRate}%，请咨询师团队分析退款原因并制定改善方案`;
      const exists = existingTodos.some(m => m.content.includes('退款率') && m.targetRole === 'consultant');
      if (!exists) todos.push({ content, role: 'consultant' });
    }

    if (todayOverdue > 0) {
      const content = `[待办] 昨日有${todayOverdue}条指令未完成，请今日跟进并完成补录`;
      const exists = existingTodos.some(m => m.content.includes('未完成') && m.content.includes('跟进'));
      if (!exists) todos.push({ content, role: 'all' });
    }

    if (todos.length === 0 && existingTodos.length === 0) {
      todos.push({
        content: '[待办] 今日经营状况良好，请继续保持，重点关注客户体验',
        role: 'all',
      });
    }

    todos.forEach(todo => {
      sendMessage(todo.content, todo.role, tomorrowStr);
    });

    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
    openMessagePanel();
  };

  const toggleRole = (role: RoleType) => {
    setExpandedRole(expandedRole === role ? null : role);
  };

  const handleNavigatePackage = (packageId: string, tab: DetailTab) => {
    selectPackageById(packageId, tab);
    openPackageDetailWithTab(packageId, tab);
  };

  const handleNavigateMessage = (msg: ManagerMessage) => {
    openMessagePanel();
    setTimeout(() => toggleMessage(msg.id), 100);
  };

  const generateHandoverText = (): string => {
    const dateLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const lines: string[] = [];

    lines.push(`📋 ${dateLabel} 收班交接摘要`);
    lines.push('═'.repeat(30));
    lines.push('');

    lines.push(`【经营数据】`);
    lines.push(`  套餐成交: ${overviewStats?.packageDeals || 0}笔 | 营收: ${formatCurrency(totalRevenue)}`);
    lines.push(`  退款: ${totalRefunds}笔 (${formatPercent(refundRate)}) | 漏收: 未处理${unresolvedMC.length}笔 / 整改中${rectifyingMC.length}笔 / 已补收${rectifiedMC.length}笔`);
    lines.push(`  指令执行: ${completionRate}% (${todayCompleted}/${todayMessages.length})`);
    lines.push('');

    lines.push(`【前台 - ${receptionMissedCharges.length + receptionPendingMessages.length}项】`);
    if (receptionMissedCharges.length > 0) {
      receptionMissedCharges.forEach(mc => {
        const statusTag = mc.status === 'rectifying' ? '[整改中]' : '[未处理]';
        lines.push(`  ${statusTag} ${mc.patientName} - ${mc.chargeItem} ¥${mc.missedAmount}`);
      });
    }
    receptionPendingMessages.forEach(m => {
      lines.push(`  [待执行] ${m.content}`);
    });
    if (receptionMissedCharges.length === 0 && receptionPendingMessages.length === 0) {
      lines.push('  无异常');
    }
    lines.push('');

    lines.push(`【咨询师 - ${consultantLowAddon.length + consultantLowConversion.length + consultantPendingMessages.length}项】`);
    consultantLowAddon.forEach(a => lines.push(`  [低加购] ${a.title}`));
    consultantLowConversion.forEach(a => lines.push(`  [低转化] ${a.title}`));
    consultantPendingMessages.forEach(m => lines.push(`  [待执行] ${m.content}`));
    if (consultantLowAddon.length === 0 && consultantLowConversion.length === 0 && consultantPendingMessages.length === 0) {
      lines.push('  无异常');
    }
    lines.push('');

    lines.push(`【医生 - ${doctorRefundAlerts.length + doctorMissedCharges.length}项】`);
    doctorRefundAlerts.forEach(a => lines.push(`  [退款异常] ${a.title}`));
    doctorMissedCharges.slice(0, 5).forEach(mc => {
      lines.push(`  [漏收] ${mc.doctorName} - ${mc.patientName} ¥${mc.missedAmount}`);
    });
    if (doctorRefundAlerts.length === 0 && doctorMissedCharges.length === 0) {
      lines.push('  无异常');
    }
    lines.push('');

    const tomorrowTodos = messages.filter(m => m.expectedDate === tomorrowStr && m.content.startsWith('[待办]'));
    lines.push(`【明日待办 - ${tomorrowTodos.length}条】`);
    if (tomorrowTodos.length > 0) {
      tomorrowTodos.forEach(m => lines.push(`  · ${m.content}`));
    } else {
      lines.push('  尚未生成，请店长点击生成明日待办');
    }

    return lines.join('\n');
  };

  const handleCopyHandover = async () => {
    const text = generateHandoverText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !overviewStats) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 rounded-2xl shadow-sm border border-indigo-100 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">收班复盘小结</h2>
            <p className="text-sm text-gray-500">今日经营数据汇总与待办生成</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHandover(!showHandover)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              showHandover
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            交接摘要
          </button>
          <button
            onClick={generateTomorrowTodos}
            disabled={generating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              generated
                ? 'bg-green-500 text-white'
                : alreadyGenerated
                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white hover:from-indigo-600 hover:to-sky-600 shadow-md hover:shadow-lg'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {generating ? (
              <><RefreshCcw className="w-4 h-4 animate-spin" />生成中...</>
            ) : generated ? (
              <><CheckCircle2 className="w-4 h-4" />已生成明日待办</>
            ) : alreadyGenerated ? (
              <><CheckCircle2 className="w-4 h-4" />明日待办已生成</>
            ) : (
              <><Sparkles className="w-4 h-4" />生成明日待办</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-sm text-gray-500">套餐成交</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatNumber(overviewStats.packageDeals)}</p>
          <p className="text-xs text-gray-400 mt-1">营收 {formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-gray-500">退款</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatNumber(totalRefunds)}</p>
          <p className={`text-xs mt-1 ${refundRate >= 10 ? 'text-red-500' : 'text-gray-400'}`}>
            退款率 {formatPercent(refundRate)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm text-gray-500">漏收</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-red-600 font-mono">{unresolvedMC.length}</span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{rectifyingMC.length}</span>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-lg font-bold text-green-600 font-mono">{rectifiedMC.length}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">未处理 / 整改中 / 已补收</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
            <span className="text-sm text-gray-500">指令执行</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatPercent(completionRate)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {todayCompleted}/{todayMessages.length} 完成
            {todayOverdue > 0 && <span className="text-red-500 ml-1">{todayOverdue}逾期</span>}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          责任分布
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.keys(roleConfig).map((roleKey) => {
            const role = roleKey as RoleType;
            const config = roleConfig[role];
            const isExpanded = expandedRole === role;

            const issueCount = role === 'reception'
              ? receptionMissedCharges.length + receptionPendingMessages.length
              : role === 'consultant'
              ? consultantLowAddon.length + consultantLowConversion.length + consultantPendingMessages.length
              : doctorRefundAlerts.length + doctorMissedCharges.length;

            return (
              <div
                key={role}
                className={`${config.bgColor} ${config.borderColor} border rounded-xl overflow-hidden transition-all duration-300`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => toggleRole(role)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color} bg-white/60`}>
                        {config.icon}
                      </div>
                      <span className={`font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold font-mono ${config.color}`}>
                        {issueCount}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className={`w-4 h-4 ${config.color}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${config.color}`} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">项待跟进问题</p>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      {role === 'reception' && (
                        <>
                          {receptionMissedCharges.map(mc => (
                            <div
                              key={mc.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => handleNavigatePackage(mc.packageId, 'missed_charges')}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {mc.status === 'rectifying' ? (
                                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                )}
                                <span className="text-gray-700 truncate">
                                  {mc.patientName} {mc.chargeItem}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-mono text-xs text-red-600">¥{mc.missedAmount}</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          ))}
                          {receptionPendingMessages.map(msg => (
                            <div
                              key={msg.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => handleNavigateMessage(msg)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Send className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{msg.content}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {receptionMissedCharges.length === 0 && receptionPendingMessages.length === 0 && (
                            <p className="text-xs text-gray-400 py-2 text-center">暂无待跟进问题</p>
                          )}
                        </>
                      )}

                      {role === 'consultant' && (
                        <>
                          {consultantLowAddon.map(a => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => a.relatedPackage && handleNavigatePackage(a.relatedPackage, 'consultants')}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{a.title}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {consultantLowConversion.map(a => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => a.relatedTimeSlot && handleNavigatePackage('pkg-001', 'timeslots')}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{a.title}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {consultantPendingMessages.map(msg => (
                            <div
                              key={msg.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => handleNavigateMessage(msg)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Send className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{msg.content}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {consultantLowAddon.length === 0 && consultantLowConversion.length === 0 && consultantPendingMessages.length === 0 && (
                            <p className="text-xs text-gray-400 py-2 text-center">暂无待跟进问题</p>
                          )}
                        </>
                      )}

                      {role === 'doctor' && (
                        <>
                          {doctorRefundAlerts.map(a => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => a.relatedPackage && handleNavigatePackage(a.relatedPackage, 'doctors')}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <RotateCcw className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">{a.title}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                          {doctorMissedCharges.slice(0, 5).map(mc => (
                            <div
                              key={mc.id}
                              className="flex items-center justify-between text-sm bg-white/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/90 transition-colors"
                              onClick={() => handleNavigatePackage(mc.packageId, 'missed_charges')}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {mc.status === 'rectifying' ? (
                                  <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                )}
                                <span className="text-gray-700 truncate">
                                  {mc.doctorName} - {mc.patientName}
                                </span>
                              </div>
                              <span className="font-mono text-xs text-red-600 flex-shrink-0">¥{mc.missedAmount}</span>
                            </div>
                          ))}
                          {doctorRefundAlerts.length === 0 && doctorMissedCharges.length === 0 && (
                            <p className="text-xs text-gray-400 py-2 text-center">暂无待跟进问题</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showHandover && (
        <div className="mb-6 bg-white/80 rounded-xl border border-indigo-200 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              交接摘要
            </h3>
            <button
              onClick={handleCopyHandover}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制到剪贴板'}
            </button>
          </div>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 rounded-lg p-4 max-h-72 overflow-y-auto">
            {generateHandoverText()}
          </pre>
        </div>
      )}

      <div className="bg-white/70 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">今日要点</span>
        </div>
        <div className="space-y-2">
          {totalRefunds > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                今日共退款 <span className="font-medium text-red-600">{totalRefunds} 笔</span>，
                需关注退款原因并及时跟进客户
              </span>
            </div>
          )}
          {(unresolvedMC.length > 0 || rectifyingMC.length > 0) && (
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                漏收：<span className="font-medium text-red-600">{unresolvedMC.length}笔未处理</span>
                {rectifyingMC.length > 0 && <>，<span className="font-medium text-amber-600">{rectifyingMC.length}笔整改中</span></>}
                {rectifiedMC.length > 0 && <>，<span className="font-medium text-green-600">{rectifiedMC.length}笔已补收</span></>}
              </span>
            </div>
          )}
          {todayPending > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                今日还有 <span className="font-medium text-sky-600">{todayPending} 条</span> 指令待执行，
                请收班前确认进度
              </span>
            </div>
          )}
          {overviewStats.polishAddRate < 40 && (
            <div className="flex items-start gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                抛光加购率 <span className="font-medium text-purple-600">{formatPercent(overviewStats.polishAddRate)}</span>，
                低于目标值，建议加强咨询师推荐
              </span>
            </div>
          )}
          {totalRefunds === 0 && unresolvedMC.length === 0 && todayPending === 0 && overviewStats.polishAddRate >= 40 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">今日各项指标表现良好，继续保持！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
