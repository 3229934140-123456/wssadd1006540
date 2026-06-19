import { create } from 'zustand';
import type {
  OverviewStats,
  PackageCategory,
  PackageDetail,
  AnomalyAlert,
  ManagerMessage,
  ClinicInfo,
  TargetRole,
  ViewMode,
  MessageMetric,
  MissedChargeRecord,
} from '@/types';
import {
  overviewStats as mockOverview,
  packageCategories as mockPackages,
  packageDetails as mockPackageDetails,
  anomalyAlerts as mockAlerts,
  managerMessages as mockMessages,
  clinics as mockClinics,
} from '@/data/mockData';

interface TrendDayData {
  date: string;
  dateStr: string;
  packageDeals: number;
  refunds: number;
  missedCharges: number;
  polishAddRate: number;
}

interface DashboardState {
  currentDate: Date;
  selectedClinic: string;
  viewMode: ViewMode;
  clinics: ClinicInfo[];
  overviewStats: OverviewStats | null;
  packages: PackageCategory[];
  selectedPackage: PackageCategory | null;
  packageDetail: PackageDetail | null;
  alerts: AnomalyAlert[];
  messages: ManagerMessage[];
  missedCharges: MissedChargeRecord[];
  trendData: TrendDayData[];
  loading: boolean;

  setCurrentDate: (date: Date) => void;
  setSelectedClinic: (clinicId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  fetchData: () => Promise<void>;
  selectPackage: (pkg: PackageCategory | null) => void;
  selectPackageById: (packageId: string, initialTab?: string) => void;
  fetchPackageDetail: (packageId: string) => Promise<void>;
  dismissAlert: (alertId: string) => void;
  sendMessage: (content: string, targetRole: TargetRole, expectedDate: string, sourceAlertId?: string) => string;
  completeMessage: (messageId: string, metrics: MessageMetric[], notes: string) => void;
  convertAlertToMessage: (alertId: string, content: string, targetRole: TargetRole) => void;
  convertMissedChargeToMessage: (recordId: string, content: string, targetRole: TargetRole, expectedDate: string) => void;
  generateTrendData: () => TrendDayData[];
  hasTomorrowTodos: () => boolean;
}

const PERSIST_KEY = 'dental-dashboard-messages';

const loadPersistedMessages = (): ManagerMessage[] => {
  try {
    const saved = localStorage.getItem(PERSIST_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return mockMessages;
};

const persistMessages = (messages: ManagerMessage[]) => {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(messages));
  } catch {}
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentDate: new Date(),
  selectedClinic: '1',
  viewMode: 'morning',
  clinics: mockClinics,
  overviewStats: null,
  packages: [],
  selectedPackage: null,
  packageDetail: null,
  alerts: [],
  messages: loadPersistedMessages(),
  missedCharges: [],
  trendData: [],
  loading: true,

  setCurrentDate: (date) => {
    set({ currentDate: date });
    get().fetchData();
  },

  setSelectedClinic: (clinicId) => {
    set({ selectedClinic: clinicId });
    get().fetchData();
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  fetchData: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 600));

    const currentDate = get().currentDate;
    const dayOffset = Math.floor((new Date().getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(0.5, 1 - dayOffset * 0.1);

    const adjustedOverview: OverviewStats = {
      ...mockOverview,
      appointmentCount: Math.round(mockOverview.appointmentCount * multiplier),
      actualArrival: Math.round(mockOverview.actualArrival * multiplier),
      packageDeals: Math.round(mockOverview.packageDeals * multiplier),
      avgOrderValue: Math.round(mockOverview.avgOrderValue * (1 + (Math.random() - 0.5) * 0.1)),
      polishAddRate: Math.max(10, Math.min(80, Math.round(mockOverview.polishAddRate * (1 + (Math.random() - 0.5) * 0.2)))),
      totalMissedCharges: Math.max(0, Math.round(mockOverview.totalMissedCharges * multiplier + (Math.random() - 0.5) * 2)),
      comparedYesterday: {
        appointmentCount: Math.round((Math.random() - 0.3) * 10),
        actualArrival: Math.round((Math.random() - 0.3) * 8),
        packageDeals: Math.round((Math.random() - 0.3) * 6),
        avgOrderValue: Math.round((Math.random() - 0.5) * 10),
        polishAddRate: Math.round((Math.random() - 0.3) * 15),
      },
    };

    const adjustedPackages = mockPackages.map(pkg => ({
      ...pkg,
      sales: Math.max(0, Math.round(pkg.sales * multiplier + (Math.random() - 0.5) * 2)),
      refunds: Math.max(0, Math.round(pkg.refunds * multiplier)),
      reschedules: Math.max(0, Math.round(pkg.reschedules * multiplier)),
    }));

    const dateStr = currentDate.toISOString().split('T')[0];
    const persistedMessages = get().messages;
    const openAlerts = mockAlerts.filter(a => {
      const relatedMsg = persistedMessages.find(m => m.sourceAlertId === a.id);
      if (relatedMsg) {
        if (relatedMsg.status === 'completed') return false;
        a.status = 'processing';
        a.relatedMessageId = relatedMsg.id;
      }
      return !a.dismissed;
    });

    const allMissedCharges: MissedChargeRecord[] = [];
    Object.values(mockPackageDetails).forEach(detail => {
      detail.missedCharges.forEach(mc => {
        const relatedMsg = persistedMessages.find(m => m.content.includes(mc.patientName) && m.content.includes('漏收'));
        let status: MissedChargeRecord['status'] = mc.status;
        let relatedMessageId: string | undefined = mc.relatedMessageId;
        if (relatedMsg) {
          if (relatedMsg.status === 'completed') {
            status = 'rectified';
          } else {
            status = 'rectifying';
          }
          relatedMessageId = relatedMsg.id;
        }
        allMissedCharges.push({ ...mc, status, relatedMessageId });
      });
    });

    const trendData = get().generateTrendData();

    set({
      overviewStats: adjustedOverview,
      packages: adjustedPackages,
      alerts: openAlerts,
      missedCharges: allMissedCharges,
      trendData,
      loading: false,
    });
  },

  selectPackage: (pkg) => {
    set({ selectedPackage: pkg });
    if (pkg) {
      get().fetchPackageDetail(pkg.id);
    } else {
      set({ packageDetail: null });
    }
  },

  selectPackageById: (packageId, initialTab) => {
    const pkg = get().packages.find(p => p.id === packageId);
    if (pkg) {
      set({ selectedPackage: pkg });
      get().fetchPackageDetail(pkg.id);
    }
  },

  fetchPackageDetail: async (packageId) => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));

    const detail = mockPackageDetails[packageId] || null;
    if (detail) {
      const persistedMessages = get().messages;
      const adjustedMissedCharges = detail.missedCharges.map(mc => {
        const relatedMsg = persistedMessages.find(m => 
          m.content.includes(mc.patientName) && m.content.includes('漏收')
        );
        let status: MissedChargeRecord['status'] = mc.status;
        let relatedMessageId: string | undefined = mc.relatedMessageId;
        if (relatedMsg) {
          if (relatedMsg.status === 'completed') {
            status = 'rectified';
          } else {
            status = 'rectifying';
          }
          relatedMessageId = relatedMsg.id;
        }
        return { ...mc, status, relatedMessageId };
      });
      set({ packageDetail: { ...detail, missedCharges: adjustedMissedCharges }, loading: false });
    } else {
      set({ packageDetail: detail, loading: false });
    }
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === alertId ? { ...a, dismissed: true, status: 'resolved' as const } : a
      ).filter(a => !a.dismissed),
    }));
  },

  sendMessage: (content, targetRole, expectedDate, sourceAlertId) => {
    const newId = `msg-${Date.now()}`;
    const newMessage: ManagerMessage = {
      id: newId,
      content,
      targetRole,
      createdAt: new Date().toISOString(),
      expectedDate,
      status: 'pending',
      sourceType: sourceAlertId ? 'alert' : 'manual',
      sourceAlertId,
    };

    set((state) => {
      const updated = [newMessage, ...state.messages];
      persistMessages(updated);

      if (sourceAlertId) {
        const updatedAlerts = state.alerts.map(a =>
          a.id === sourceAlertId ? { ...a, status: 'processing' as const, relatedMessageId: newId } : a
        );
        return { messages: updated, alerts: updatedAlerts };
      }

      return { messages: updated };
    });

    return newId;
  },

  completeMessage: (messageId, metrics, notes) => {
    set((state) => {
      const updated = state.messages.map(m =>
        m.id === messageId
          ? {
              ...m,
              status: 'completed' as const,
              result: {
                executedAt: new Date().toISOString(),
                metrics,
                notes,
              },
            }
          : m
      );
      persistMessages(updated);

      const msg = state.messages.find(m => m.id === messageId);
      let updatedAlerts = state.alerts;
      if (msg?.sourceAlertId) {
        updatedAlerts = state.alerts.map(a =>
          a.id === msg.sourceAlertId ? { ...a, status: 'resolved' as const } : a
        ).filter(a => a.status !== 'resolved');
      }

      return { messages: updated, alerts: updatedAlerts };
    });
  },

  convertAlertToMessage: (alertId, content, targetRole) => {
    const today = new Date().toISOString().split('T')[0];
    get().sendMessage(content, targetRole, today, alertId);
  },

  convertMissedChargeToMessage: (recordId, content, targetRole, expectedDate) => {
    const messageId = get().sendMessage(content, targetRole, expectedDate);

    set((state) => {
      const updatedMissedCharges = state.missedCharges.map(mc =>
        mc.id === recordId ? { ...mc, status: 'rectifying' as const, relatedMessageId: messageId } : mc
      );

      let updatedPackageDetail = state.packageDetail;
      if (state.packageDetail) {
        updatedPackageDetail = {
          ...state.packageDetail,
          missedCharges: state.packageDetail.missedCharges.map(mc =>
            mc.id === recordId ? { ...mc, status: 'rectifying' as const, relatedMessageId: messageId } : mc
          ),
        };
      }

      return { missedCharges: updatedMissedCharges, packageDetail: updatedPackageDetail };
    });
  },

  generateTrendData: () => {
    const result: TrendDayData[] = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

      const variation = 1 - (6 - i) * 0.05 + (Math.random() - 0.5) * 0.2;

      result.push({
        date: dayLabel,
        dateStr,
        packageDeals: Math.max(5, Math.round(mockOverview.packageDeals * Math.max(0.6, variation))),
        refunds: Math.max(0, Math.round(3 * Math.max(0.5, variation + (Math.random() - 0.5) * 0.3))),
        missedCharges: Math.max(0, Math.round(mockOverview.totalMissedCharges * Math.max(0.4, variation + (Math.random() - 0.5) * 0.4))),
        polishAddRate: Math.max(20, Math.min(70, Math.round(45 + (i - 3) * 3 + (Math.random() - 0.5) * 8))),
      });
    }

    return result;
  },

  hasTomorrowTodos: () => {
    const tomorrow = new Date(get().currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowTodos = get().messages.filter(m => 
      m.expectedDate === tomorrowStr && m.content.startsWith('[待办]')
    );
    return tomorrowTodos.length > 0;
  },
}));
