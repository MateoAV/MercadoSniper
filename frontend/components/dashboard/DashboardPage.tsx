'use client';

import MainLayout from '@/components/layout/MainLayout';
import StatsCards from './StatsCards';
import RecentPriceDrops from './RecentPriceDrops';
import AlertsOverview from './AlertsOverview';
import TrackedVehicles from './TrackedVehicles';
import PriceChart from './PriceChart';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitorea tus vehículos favoritos y recibe alertas de precios en tiempo real
          </p>
        </div>

        {/* Stats cards */}
        <StatsCards />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            <RecentPriceDrops />
            <PriceChart />
          </div>

          {/* Right column - Sidebar content */}
          <div className="space-y-6">
            <AlertsOverview />
            <TrackedVehicles />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 