import { create } from 'zustand';

type DetailTab = 'doctors' | 'consultants' | 'timeslots' | 'missed_charges';

interface UIState {
  showMessagePanel: boolean;
  showPackageModal: boolean;
  activeDetailTab: DetailTab;
  expandedAlertId: string | null;
  expandedMessageId: string | null;

  toggleMessagePanel: () => void;
  openMessagePanel: () => void;
  closeMessagePanel: () => void;
  openPackageModal: () => void;
  closePackageModal: () => void;
  setActiveDetailTab: (tab: DetailTab) => void;
  openPackageDetailWithTab: (packageId: string, tab: DetailTab) => void;
  toggleAlert: (alertId: string) => void;
  toggleMessage: (messageId: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  showMessagePanel: false,
  showPackageModal: false,
  activeDetailTab: 'doctors',
  expandedAlertId: null,
  expandedMessageId: null,

  toggleMessagePanel: () => {
    set((state) => ({ showMessagePanel: !state.showMessagePanel }));
  },

  openMessagePanel: () => {
    set({ showMessagePanel: true });
  },

  closeMessagePanel: () => {
    set({ showMessagePanel: false });
  },

  openPackageModal: () => {
    set({ showPackageModal: true });
  },

  closePackageModal: () => {
    set({ showPackageModal: false, activeDetailTab: 'doctors' });
  },

  setActiveDetailTab: (tab) => {
    set({ activeDetailTab: tab });
  },

  openPackageDetailWithTab: (packageId, tab) => {
    set({ showPackageModal: true, activeDetailTab: tab });
  },

  toggleAlert: (alertId) => {
    const current = get().expandedAlertId;
    set({ expandedAlertId: current === alertId ? null : alertId });
  },

  toggleMessage: (messageId) => {
    const current = get().expandedMessageId;
    set({ expandedMessageId: current === messageId ? null : messageId });
  },
}));
