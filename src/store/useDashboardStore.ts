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
} from '@/types';
import {
  overviewStats as mockOverview,
  packageCategories as mockPackages,
  packageDetails as mockPackageDetails,
  anomalyAlerts as mockAlerts,
  managerMessages as mockMessages,
  clinics as mockClinics,
} from '@/data/mockData';

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
  loading: boolean;

  setCurrentDate: (date: Date) => void;
  setSelectedClinic: (clinicId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  fetchData: () => Promise<void>;
  selectPackage: (pkg: PackageCategory | null) => void;
  selectPackageById: (packageId: string, initialTab?: string) => void;
  fetchPackageDetail: (packageId: string) => Promise<void>;
  dismissAlert: (alertId: string) => void;
  sendMessage: (content: string, targetRole: TargetRole, expectedDate: string, sourceAlertId?: string) => void;
  completeMessage: (messageId: string, metrics: MessageMetric[], notes: string) => void;
  convertAlertToMessage: (alertId: string, content: string, targetRole: TargetRole) => void;
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
      polishAddRate: Math.round(mockOverview.polishAddRate * (1 + (Math.random() - 0.5) * 0.2)),
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
      refunds: Math.round(pkg.refunds * multiplier),
      reschedules: Math.round(pkg.reschedules * multiplier),
    }));

    set({
      overviewStats: adjustedOverview,
      packages: adjustedPackages,
      alerts: mockAlerts.filter(a => !a.dismissed),
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
    set({ packageDetail: detail, loading: false });
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === alertId ? { ...a, dismissed: true } : a
      ).filter(a => !a.dismissed),
    }));
  },

  sendMessage: (content, targetRole, expectedDate, sourceAlertId) => {
    const newMessage: ManagerMessage = {
      id: `msg-${Date.now()}`,
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
      return { messages: updated };
    });
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
      return { messages: updated };
    });
  },

  convertAlertToMessage: (alertId, content, targetRole) => {
    const today = new Date().toISOString().split('T')[0];
    get().sendMessage(content, targetRole, today, alertId);
  },
}));
