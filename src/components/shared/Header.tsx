import React from 'react';
import { Calendar, RefreshCw, Building2, User, Bell } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { formatDate } from '@/utils/formatters';

export const Header: React.FC = () => {
  const { currentDate, selectedClinic, clinics, setCurrentDate, setSelectedClinic, fetchData, loading } =
    useDashboardStore();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(new Date(e.target.value));
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="text-white font-bold text-lg">牙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">洁牙抛光套餐经营看板</h1>
              <p className="text-xs text-gray-500">帮助店长快速掌握套餐经营状况</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="text-sm border-none bg-gray-50 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={currentDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="text-sm text-gray-700 bg-transparent border-none focus:outline-none"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative">
            <button className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">店长</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{formatDate(currentDate)}</span>
        </p>
      </div>
      </div>
    </header>
  );
};
