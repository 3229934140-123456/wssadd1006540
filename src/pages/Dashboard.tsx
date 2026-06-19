import React, { useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { PackageStructure } from '@/components/dashboard/PackageStructure';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { MessagePanel } from '@/components/dashboard/MessagePanel';
import { PackageDetailModal } from '@/components/modals/PackageDetailModal';
import { useDashboardStore } from '@/store/useDashboardStore';

export const Dashboard: React.FC = () => {
  const { fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <OverviewCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PackageStructure />
          </div>
          <div className="lg:col-span-1">
            <AlertsPanel />
          </div>
        </div>
      </main>

      <MessagePanel />
      <PackageDetailModal />
    </div>
  );
};
