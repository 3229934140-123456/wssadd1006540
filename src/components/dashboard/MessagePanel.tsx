import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import {
  getTargetRoleLabel,
  formatDate,
  formatTime,
  formatPercent,
  formatNumber,
} from '@/utils/formatters';
import type { ManagerMessage, TargetRole, MessageMetric } from '@/types';

const MessageInput: React.FC<{ onSend: (content: string, role: TargetRole, date: string) => void }> = ({
  onSend,
}) => {
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [expectedDate, setExpectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend(content.trim(), targetRole, expectedDate);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl mb-4">
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm text-gray-600 flex items-center gap-1">
          <User className="w-4 h-4" />
          接收对象
        </label>
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value as TargetRole)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="all">全体人员</option>
          <option value="reception">前台</option>
          <option value="consultant">咨询师</option>
        </select>
        <label className="text-sm text-gray-600 flex items-center gap-1 ml-4">
          <Calendar className="w-4 h-4" />
          期望完成
        </label>
        <input
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入管理指令，例如：下午主推烟渍喷砂套餐..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          发送
        </button>
      </div>
    </form>
  );
};

interface CompleteFormProps {
  messageId: string;
  onComplete: (messageId: string, metrics: MessageMetric[], notes: string) => void;
  onCancel: () => void;
}

const CompleteForm: React.FC<CompleteFormProps> = ({ messageId, onComplete, onCancel }) => {
  const [notes, setNotes] = useState('');
  const [metrics, setMetrics] = useState<MessageMetric[]>([
    { name: '', before: 0, after: 0 },
  ]);

  const addMetric = () => {
    setMetrics([...metrics, { name: '', before: 0, after: 0 }]);
  };

  const updateMetric = (index: number, field: keyof MessageMetric, value: string | number) => {
    const updated = [...metrics];
    if (field === 'name') {
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setMetrics(updated);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validMetrics = metrics.filter(m => m.name.trim());
    onComplete(messageId, validMetrics, notes);
  };

  return (
    <div className="p-3 bg-white rounded-lg border border-teal-200 mt-3">
      <p className="text-sm font-medium text-teal-700 mb-3">补录执行结果</p>

      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={metric.name}
            onChange={(e) => updateMetric(index, 'name', e.target.value)}
            placeholder="指标名称"
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          />
          <input
            type="number"
            value={metric.before || ''}
            onChange={(e) => updateMetric(index, 'before', e.target.value)}
            placeholder="前值"
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="number"
            value={metric.after || ''}
            onChange={(e) => updateMetric(index, 'after', e.target.value)}
            placeholder="后值"
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          />
          <button
            onClick={() => removeMetric(index)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      <button
        onClick={addMetric}
        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mb-3"
      >
        <Plus className="w-3 h-3" />
        添加指标
      </button>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="执行备注..."
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-1 focus:ring-teal-500/20 resize-none"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors"
        >
          确认补录
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
};

interface MessageCardProps {
  message: ManagerMessage;
  isExpanded: boolean;
  onToggle: () => void;
  completingId: string | null;
  onStartComplete: (id: string) => void;
  onCancelComplete: () => void;
  onComplete: (messageId: string, metrics: MessageMetric[], notes: string) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isExpanded,
  onToggle,
  completingId,
  onStartComplete,
  onCancelComplete,
  onComplete,
}) => {
  const isCompleted = message.status === 'completed';
  const isFromAlert = message.sourceType === 'alert';
  const expectedDateStr = message.expectedDate;
  const isOverdue = !isCompleted && new Date(expectedDateStr) < new Date(new Date().toISOString().split('T')[0]);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : isOverdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div
        className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isCompleted
                ? 'bg-green-100 text-green-600'
                : isOverdue
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isOverdue ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isCompleted
                    ? 'bg-green-100 text-green-700'
                    : isOverdue
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isCompleted ? '已完成' : isOverdue ? '已逾期' : '待执行'}
              </span>
              <span className="text-xs text-gray-400">
                {getTargetRoleLabel(message.targetRole)}
              </span>
              {isFromAlert && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                  异常转来
                </span>
              )}
            </div>
            <p className="text-sm text-gray-900">{message.content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>{formatTime(message.createdAt)}</span>
              <span>期望: {formatDate(message.expectedDate)}</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="ml-13 pl-13 border-t border-gray-200/50 pt-3">
            {isCompleted && message.result && (
              <>
                <p className="text-xs font-medium text-green-700 mb-2">执行结果</p>
                <p className="text-xs text-gray-500 mb-3">
                  完成时间: {formatTime(message.result.executedAt)}
                </p>

                {message.result.metrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {message.result.metrics.map((metric, index) => {
                      const improved = metric.after > metric.before;
                      return (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border border-green-100"
                        >
                          <p className="text-xs text-gray-500 mb-1">{metric.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              {metric.name.includes('率')
                                ? formatPercent(metric.before)
                                : formatNumber(metric.before)}
                            </span>
                            <span className="text-lg font-bold text-gray-900">→</span>
                            <span
                              className={`text-lg font-bold font-mono ${
                                improved ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {metric.name.includes('率')
                                ? formatPercent(metric.after)
                                : formatNumber(metric.after)}
                            </span>
                            <span
                              className={`flex items-center text-xs ${
                                improved ? 'text-green-600' : 'text-red-500'
                              }`}
                            >
                              {improved ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {message.result.notes && (
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">执行备注</p>
                    <p className="text-sm text-gray-700">{message.result.notes}</p>
                  </div>
                )}
              </>
            )}

            {!isCompleted && (
              <>
                {completingId === message.id ? (
                  <CompleteForm
                    messageId={message.id}
                    onComplete={onComplete}
                    onCancel={onCancelComplete}
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartComplete(message.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors border border-teal-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    补录完成情况
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MessagePanel: React.FC = () => {
  const { messages, sendMessage, completeMessage } = useDashboardStore();
  const { showMessagePanel, toggleMessagePanel, expandedMessageId, toggleMessage } =
    useUIStore();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const pendingCount = messages.filter((m) => m.status === 'pending').length;
  const completedCount = messages.filter((m) => m.status === 'completed').length;
  const overdueCount = messages.filter((m) => {
    if (m.status === 'completed') return false;
    return new Date(m.expectedDate) < new Date(new Date().toISOString().split('T')[0]);
  }).length;

  const handleSend = (content: string, targetRole: TargetRole, expectedDate: string) => {
    sendMessage(content, targetRole, expectedDate);
  };

  const handleComplete = (messageId: string, metrics: MessageMetric[], notes: string) => {
    completeMessage(messageId, metrics, notes);
    setCompletingId(null);
  };

  return (
    <>
      <button
        onClick={toggleMessagePanel}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg shadow-teal-500/30 hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 flex items-center justify-center z-30 group"
      >
        <MessageSquare className="w-6 h-6" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.5rem] h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
            {pendingCount}
          </span>
        )}
      </button>

      {showMessagePanel && (
        <div className="fixed bottom-24 right-6 w-[420px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">跟进台账</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  待执行 {pendingCount}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  已完成 {completedCount}
                </span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3 h-3" />
                    逾期 {overdueCount}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={toggleMessagePanel}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(75vh-180px)]">
            <MessageInput onSend={handleSend} />

            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">暂无留言</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    isExpanded={expandedMessageId === message.id}
                    onToggle={() => toggleMessage(message.id)}
                    completingId={completingId}
                    onStartComplete={setCompletingId}
                    onCancelComplete={() => setCompletingId(null)}
                    onComplete={handleComplete}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
