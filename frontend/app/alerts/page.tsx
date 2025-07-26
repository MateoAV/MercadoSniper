import { Metadata } from 'next';
import AlertsPage from '@/components/alerts/AlertsPage';

export const metadata: Metadata = {
  title: 'Alertas de Precio - MercadoSniper',
  description: 'Administra tus alertas de precio para vehículos en MercadoLibre Colombia',
};

export default function AlertsPageRoute() {
  return <AlertsPage />;
} 