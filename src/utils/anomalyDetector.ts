import type { PackageCategory, AnomalyAlert, TimeSlotPerformance } from '@/types';

const REFUND_WARNING_THRESHOLD = 15;
const REFUND_CRITICAL_THRESHOLD = 25;
const LOW_CONVERSION_THRESHOLD = 60;
const POLISH_MISS_RATE = 30;
const LOW_ADDON_RATIO = 50;

export const detectHighRefund = (pkg: PackageCategory): AnomalyAlert | null => {
  const refundRate = pkg.sales > 0 ? (pkg.refunds / pkg.sales) * 100 : 0;
  
  if (refundRate >= REFUND_CRITICAL_THRESHOLD) {
    return {
      id: `refund-${pkg.id}`,
      type: 'high_refund',
      severity: 'critical',
      title: `${pkg.name}退款率严重偏高`,
      description: `该套餐退款率达${refundRate.toFixed(1)}%，远超警戒线${REFUND_CRITICAL_THRESHOLD}%。`,
      relatedPackage: pkg.id,
      suggestedAction: '建议立即与负责医生沟通，检查操作流程和咨询师术前沟通环节。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  if (refundRate >= REFUND_WARNING_THRESHOLD) {
    return {
      id: `refund-${pkg.id}`,
      type: 'high_refund',
      severity: 'warning',
      title: `${pkg.name}退款率偏高`,
      description: `该套餐退款率达${refundRate.toFixed(1)}%，略高于警戒线${REFUND_WARNING_THRESHOLD}%。`,
      relatedPackage: pkg.id,
      suggestedAction: '建议关注该套餐的客户反馈，了解退款原因。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  return null;
};

export const detectLowConversion = (
  timeSlots: TimeSlotPerformance[],
  packageName: string
): AnomalyAlert | null => {
  const problematicSlots = timeSlots.filter(
    slot => slot.appointments >= 2 && slot.dealRate < LOW_CONVERSION_THRESHOLD
  );
  
  if (problematicSlots.length > 0) {
    const worstSlot = problematicSlots.reduce((prev, curr) => 
      prev.dealRate < curr.dealRate ? prev : curr
    );
    
    return {
      id: `conversion-${packageName}-${worstSlot.time}`,
      type: 'low_conversion',
      severity: 'warning',
      title: `${worstSlot.time}时段${packageName}成交率偏低`,
      description: `该时段预约${worstSlot.appointments}人，但成交率仅${worstSlot.dealRate}%，低于警戒线${LOW_CONVERSION_THRESHOLD}%。`,
      relatedTimeSlot: worstSlot.time,
      suggestedAction: '检查该时段咨询师排班，或调整预约策略，确保有经验的咨询师在岗。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  return null;
};

export const detectMissedCharge = (missedCount: number, totalAmount: number): AnomalyAlert | null => {
  if (missedCount >= 3) {
    return {
      id: 'missed-charge-001',
      type: 'missed_charge',
      severity: 'critical',
      title: '抛光项目漏收情况严重',
      description: `本周发现${missedCount}例洁牙已完成但未收取抛光费用，涉及金额约${totalAmount}元。`,
      suggestedAction: '立即培训前台和医生在结算时确认项目，加强收费流程管控，建议使用双人核对制度。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  if (missedCount > 0) {
    return {
      id: 'missed-charge-001',
      type: 'missed_charge',
      severity: 'warning',
      title: '存在抛光项目漏收情况',
      description: `本周发现${missedCount}例抛光项目漏收，涉及金额约${totalAmount}元。`,
      suggestedAction: '提醒前台注意收费项目核对，建议优化结算流程。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  return null;
};

export const detectLowAddon = (
  addonRate: number,
  avgAddonRate: number,
  packageName: string
): AnomalyAlert | null => {
  const threshold = avgAddonRate * (LOW_ADDON_RATIO / 100);
  
  if (addonRate < threshold) {
    return {
      id: `addon-${packageName}`,
      type: 'low_addon',
      severity: 'warning',
      title: `${packageName}抛光加购率偏低`,
      description: `该套餐客户抛光加购率仅${addonRate}%，低于平均水平${avgAddonRate}%的${LOW_ADDON_RATIO}%。`,
      suggestedAction: '加强咨询师对抛光项目的推荐培训，或考虑调整套餐定价策略。',
      detectedAt: new Date().toISOString(),
      dismissed: false,
    };
  }
  
  return null;
};

export const detectAllAnomalies = (
  packages: PackageCategory[],
  missedChargeCount: number,
  missedChargeAmount: number,
  avgAddonRate: number
): AnomalyAlert[] => {
  const alerts: AnomalyAlert[] = [];
  
  packages.forEach(pkg => {
    const refundAlert = detectHighRefund(pkg);
    if (refundAlert) alerts.push(refundAlert);
  });
  
  const missedChargeAlert = detectMissedCharge(missedChargeCount, missedChargeAmount);
  if (missedChargeAlert) alerts.push(missedChargeAlert);
  
  if (avgAddonRate > 0) {
    alerts.push(detectLowAddon(35, avgAddonRate, '普通洁牙')!);
  }
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};
