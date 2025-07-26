'use client';

import Link from 'next/link';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Mock data - would come from API
const alerts = [
  {
    id: '1',
    productTitle: 'Toyota Prius 2020',
    targetPrice: 65000000,
    currentPrice: 67500000,
    difference: 2500000,
    status: 'active' as const,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    productTitle: 'Honda Civic 2021',
    targetPrice: 82000000,
    currentPrice: 80500000,
    difference: -1500000,
    status: 'triggered' as const,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    productTitle: 'Mazda 3 Sedan 2022',
    targetPrice: 75000000,
    currentPrice: 76800000,
    difference: 1800000,
    status: 'active' as const,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    productTitle: 'Nissan Sentra 2021',
    targetPrice: 68000000,
    currentPrice: 66900000,
    difference: -1100000,
    status: 'triggered' as const,
    createdAt: new Date('2024-01-12'),
  },
];

export default function AlertsOverview() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const triggeredAlerts = alerts.filter(alert => alert.status === 'triggered');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'triggered':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'triggered':
        return 'Activada';
      default:
        return 'Inactiva';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-warning';
      case 'triggered':
        return 'badge-success';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Alertas de Precio
          </h2>
        </div>
        <Link
          href="/alerts"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todas
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-warning-600">{activeAlerts.length}</div>
          <div className="text-sm text-gray-600">Activas</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-success-600">{triggeredAlerts.length}</div>
          <div className="text-sm text-gray-600">Activadas</div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Alertas Recientes</h3>
        {alerts.slice(0, 4).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {alert.productTitle}
                </h4>
                <span className={`badge ${getStatusBadgeClass(alert.status)} ml-2`}>
                  {getStatusText(alert.status)}
                </span>
              </div>
              
              <div className="mt-1 text-xs text-gray-600">
                Objetivo: {formatPrice(alert.targetPrice)}
              </div>
              
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Actual: {formatPrice(alert.currentPrice)}
                </span>
                <span className={`text-xs font-medium ${
                  alert.difference > 0 
                    ? 'text-warning-600' 
                    : 'text-success-600'
                }`}>
                  {alert.difference > 0 ? '+' : ''}
                  {formatPrice(alert.difference)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/alerts/new"
          className="w-full btn-primary text-center block"
        >
          Crear Nueva Alerta
        </Link>
      </div>
    </div>
  );
} 