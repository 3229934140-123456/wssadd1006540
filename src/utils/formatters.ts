export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('zh-CN').format(value);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTrendColor = (value: number, isPositiveGood = true): string => {
  if (value === 0) return 'text-gray-500';
  const isPositive = value > 0;
  if (isPositiveGood) {
    return isPositive ? 'text-emerald-600' : 'text-red-500';
  }
  return isPositive ? 'text-red-500' : 'text-emerald-600';
};

export const getTrendIcon = (value: number): 'up' | 'down' | 'flat' => {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
};

export const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-700';
  }
};

export const getSeverityBadgeColor = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700';
    case 'warning':
      return 'bg-amber-100 text-amber-700';
    case 'info':
      return 'bg-blue-100 text-blue-700';
  }
};

export const getAlertTypeLabel = (type: string): string => {
  switch (type) {
    case 'high_refund':
      return '退款异常';
    case 'low_conversion':
      return '成交异常';
    case 'missed_charge':
      return '漏收异常';
    case 'low_addon':
      return '加购异常';
    default:
      return '未知类型';
  }
};

export const getTargetRoleLabel = (role: string): string => {
  switch (role) {
    case 'reception':
      return '前台';
    case 'consultant':
      return '咨询师';
    case 'all':
      return '全体人员';
    default:
      return '全体人员';
  }
};

export const getPackageTypeColor = (type: string): string => {
  switch (type) {
    case 'basic':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'polish':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'sensitive':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'special':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const getPackageTypeLabel = (type: string): string => {
  switch (type) {
    case 'basic':
      return '基础洁牙';
    case 'polish':
      return '抛光项目';
    case 'sensitive':
      return '敏感护理';
    case 'special':
      return '特色项目';
    default:
      return '其他';
  }
};
