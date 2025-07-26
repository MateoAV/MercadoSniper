import { Metadata } from 'next';
import DashboardPage from '@/components/dashboard/DashboardPage';

export const metadata: Metadata = {
  title: 'Dashboard - MercadoSniper',
  description: 'Monitor your tracked products and price alerts on MercadoLibre Colombia',
};

export default function HomePage() {
  return <DashboardPage />;
} 