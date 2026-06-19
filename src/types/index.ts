export interface OverviewStats {
  appointmentCount: number;
  actualArrival: number;
  packageDeals: number;
  avgOrderValue: number;
  polishAddRate: number;
  comparedYesterday: {
    appointmentCount: number;
    actualArrival: number;
    packageDeals: number;
    avgOrderValue: number;
    polishAddRate: number;
  };
}

export type PackageType = 'basic' | 'polish' | 'sensitive' | 'special';

export interface PackageCategory {
  id: string;
  name: string;
  type: PackageType;
  sales: number;
  refunds: number;
  reschedules: number;
  revenue: number;
  targetSales: number;
  description: string;
  price: number;
}

export interface DoctorPerformance {
  id: string;
  name: string;
  avatar: string;
  sales: number;
  avgPrice: number;
  refundRate: number;
  satisfaction: number;
}

export interface ConsultantPerformance {
  id: string;
  name: string;
  avatar: string;
  recommendationRate: number;
  addOnRate: number;
  dealCount: number;
}

export interface TimeSlotPerformance {
  time: string;
  appointments: number;
  dealRate: number;
  arrivalRate: number;
}

export interface PackageDetail {
  packageId: string;
  doctors: DoctorPerformance[];
  consultants: ConsultantPerformance[];
  timeSlots: TimeSlotPerformance[];
}

export type AlertType = 'high_refund' | 'low_conversion' | 'missed_charge' | 'low_addon';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AnomalyAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedPackage?: string;
  relatedTimeSlot?: string;
  relatedDoctor?: string;
  suggestedAction?: string;
  detectedAt: string;
  dismissed: boolean;
}

export type TargetRole = 'reception' | 'consultant' | 'all';
export type MessageStatus = 'pending' | 'completed';

export interface ManagerMessage {
  id: string;
  content: string;
  targetRole: TargetRole;
  createdAt: string;
  expectedDate: string;
  status: MessageStatus;
  result?: {
    executedAt: string;
    metrics: {
      name: string;
      before: number;
      after: number;
    }[];
    notes: string;
  };
}

export interface ClinicInfo {
  id: string;
  name: string;
  address: string;
}
