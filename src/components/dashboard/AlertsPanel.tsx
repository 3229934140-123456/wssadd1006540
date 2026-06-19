import React from 'react';
import {
  AlertTriangle,
  XCircle,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useUIStore } from '@/store/useUIStore';
import {
  getSeverityColor,
  getSeverityBadgeColor,
  getAlertTypeLabel,
  formatTime,
} from '@/utils/formatters';
import type { AnomalyAlert } from '@/types';

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'high_refund':
      return <XCircle className="w-5 h-5" />;
    case 'low_conversion':
      return <TrendingDown className="w-5 h-5" />;
    case 'missed_charge':
      return <DollarSign className="w-5 h-5" />;
    case 'low_addon':
      return <AlertTriangle className="w-5 h-5" />;
    default:
      return <AlertTriangle className="w-5 h-5" />;
  }
};

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case 'critical':
      return '严重';
    case 'warning':
      return '警告';
    case 'info':
      return '提示';
    default:
      return '未知';
  }
};

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-16 h-5 bg-gray-100 rounded" />
          <div className="w-12 h-5 bg-gray-100 rounded" />
        </div>
        <div className="w-full h-4 bg-gray-100 rounded mb-2" />
        <div className="w-3/4 h-4 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

interface AlertCardProps {
  alert: AnomalyAlert;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, isExpanded, onToggle, onDismiss }) => {
  const severityColor = getSeverityColor(alert.severity);
  const severityBadgeColor = getSeverityBadgeColor(alert.severity);
  const isNew = alert.severity === 'critical';

  return (
    <div
      className={`rounded-xl border ${severityColor} transition-all duration-300 ${
        isNew ? 'animate-pulse' : ''
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              alert.severity === 'critical'
                ? 'bg-red-100 text-red-600'
                : alert.severity === 'warning'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {getAlertIcon(alert.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadgeColor}`}
              >
                {getSeverityLabel(alert.severity)}
              </span>
              <span className="text-xs text-gray-400">{getAlertTypeLabel(alert.type)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{alert.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{alert.description}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(alert.detectedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-gray-400 hover:text-gray-600"
              title="忽略此提醒"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-1.5">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="ml-13 pl-13 border-t border-gray-200/50 pt-3">
            {alert.suggestedAction && (
              <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">建议操作</p>
                  <p className="text-sm text-gray-700">{alert.suggestedAction}</p>
                </div>
              </div>
            )}

            {alert.relatedPackage && (
              <div className="mt-2 text-xs text-gray-500">
                <span>关联套餐: </span>
                <span className="text-gray-700">点击查看套餐详情</span>
              </div>
            )}

            {alert.relatedTimeSlot && (
              <div className="mt-1 text-xs text-gray-500">
                <span>关联时段: </span>
                <span className="text-gray-700 font-medium">{alert.relatedTimeSlot}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AlertsPanel: React.FC = () => {
  const { alerts, dismissAlert, loading } = useDashboardStore();
  const { expandedAlertId, toggleAlert } = useUIStore();

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-32 h-6 bg-gray-100 rounded animate-pulse" />
          <div className="w-24 h-6 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">异常提醒</h2>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <XCircle className="w-3 h-3" />
              严重 {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              警告 {warningCount}
            </span>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-500">暂无异常提醒</p>
          <p className="text-sm text-gray-400 mt-1">所有指标运行正常</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isExpanded={expandedAlertId === alert.id}
              onToggle={() => toggleAlert(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
