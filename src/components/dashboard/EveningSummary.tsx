import React, { useState } from 'react';
import {
  Moon,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  Send,
  XCircle,
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';

export const EveningSummary: React.FC = () => {
  const {
    overviewStats,
    packages,
    alerts,
    messages,
    currentDate,
    sendMessage,
    loading,
  } = useDashboardStore();
  const { openMessagePanel } = useUIStore();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

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

  const missedChargesCount = overviewStats?.totalMissedCharges || 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const generateTomorrowTodos = async () => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const todos: { content: string; role: 'reception' | 'consultant' | 'all' }[] = [];

    if (criticalAlerts > 0) {
      const firstCritical = alerts.find(a => a.severity === 'critical');
      if (firstCritical) {
        todos.push({
          content: `[待办] ${firstCritical.title} - ${firstCritical.suggestedAction || '请优先处理'}`,
          role: 'all',
        });
      }
    }

    if (missedChargesCount > 0) {
      todos.push({
        content: `[待办] 今日漏收${missedChargesCount}笔，请前台今日核实处理并反馈结果`,
        role: 'reception',
      });
    }

    if (refundRate >= 10) {
      todos.push({
        content: `[待办] 今日退款率${refundRate}%，请咨询师团队分析退款原因并制定改善方案`,
        role: 'consultant',
      });
    }

    if (todayOverdue > 0) {
      todos.push({
        content: `[待办] 昨日有${todayOverdue}条指令未完成，请今日跟进并完成补录`,
        role: 'all',
      });
    }

    if (todos.length === 0) {
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
        <button
          onClick={generateTomorrowTodos}
          disabled={generating}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            generated
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white hover:from-indigo-600 hover:to-sky-600 shadow-md hover:shadow-lg'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : generated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              已生成明日待办
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              生成明日待办
            </>
          )}
        </button>
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
            <span className="text-sm text-gray-500">漏收笔数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">{formatNumber(missedChargesCount)}</p>
          <p className="text-xs text-amber-500 mt-1">{criticalAlerts} 项严重异常</p>
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
          {missedChargesCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">
                存在 <span className="font-medium text-amber-600">{missedChargesCount} 笔</span> 漏收记录，
                建议前台今日完成核实补收
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
          {totalRefunds === 0 && missedChargesCount === 0 && todayPending === 0 && overviewStats.polishAddRate >= 40 && (
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
