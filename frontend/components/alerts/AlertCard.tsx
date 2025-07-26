'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Vehicle } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import { 
  Bell, 
  BellOff, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Car,
  Clock,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import Image from 'next/image';

interface AlertCardProps {
  alert: Alert;
  vehicle?: Vehicle; // Optional vehicle data
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (status: string) => void;
}

export default function AlertCard({ alert, vehicle, onEdit, onDelete, onToggleActive }: AlertCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta alerta?')) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleActive = async () => {
    setIsToggling(true);
    try {
      const newStatus = alert.status === 'active' ? 'paused' : 'active';
      await onToggleActive(newStatus);
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusIcon = () => {
    if (alert.status === 'triggered') {
      return <CheckCircle className="h-5 w-5 text-success-500" />;
    }
    if (alert.status === 'active') {
      return <Clock className="h-5 w-5 text-warning-500" />;
    }
    return <BellOff className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    switch (alert.status) {
      case 'triggered':
        return 'Activada';
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'deleted':
        return 'Eliminada';
      default:
        return 'Desconocido';
    }
  };

  const getStatusBadgeClass = () => {
    switch (alert.status) {
      case 'triggered':
        return 'badge-success';
      case 'active':
        return 'badge-warning';
      case 'paused':
        return 'badge bg-gray-100 text-gray-800';
      case 'deleted':
        return 'badge bg-danger-100 text-danger-800';
      default:
        return 'badge bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeText = () => {
    switch (alert.alert_type) {
      case 'price_drop':
        return 'Caída de precio';
      case 'price_below':
        return 'Precio por debajo de';
      case 'availability':
        return 'Cambio de disponibilidad';
      default:
        return 'Alerta de precio';
    }
  };

  const getNotificationMethodText = () => {
    if (!alert.notification_channels || alert.notification_channels.length === 0) {
      return 'No configurado';
    }

    if (alert.notification_channels.includes('email') && alert.notification_channels.includes('browser')) {
      return 'Navegador y Email';
    } else if (alert.notification_channels.includes('email')) {
      return 'Email';
    } else if (alert.notification_channels.includes('browser')) {
      return 'Navegador';
    } else if (alert.notification_channels.includes('push')) {
      return 'Notificaciones Push';
    }

    return alert.notification_channels.join(', ');
  };

  // Use vehicle data if provided, otherwise show placeholder
  const vehicleTitle = vehicle?.title || 'Vehículo';
  const currentPrice = vehicle?.price_numeric || 0;
  const vehicleUrl = vehicle?.url || '#';
  const imageUrl = vehicle?.image_url;

  return (
    <div className="card">
      <div className="flex items-start space-x-4">
        {/* Vehicle image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="w-16 h-12 rounded-lg overflow-hidden">
              <Image 
                src={imageUrl} 
                alt={vehicleTitle}
                width={64}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <Car className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          )}
        </div>

        {/* Alert content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {vehicleTitle}
                </h3>
                <span className={`badge ${getStatusBadgeClass()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{getAlertTypeText()}</span>
                  {alert.threshold && (
                    <>: {formatCurrency(alert.threshold)}</>
                  )}
                </p>
                
                {currentPrice > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Precio actual:</span>{' '}
                    {formatCurrency(currentPrice)}
                  </p>
                )}
                
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notificaciones:</span>{' '}
                  {getNotificationMethodText()}
                </p>
              </div>

              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                {alert.created_at && (
                  <span>
                    Creada {formatRelativeTime(new Date(alert.created_at))}
                  </span>
                )}
                {alert.last_triggered_at && (
                  <span>
                    Activada {formatRelativeTime(new Date(alert.last_triggered_at))}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <Link
                href={vehicleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                title="Ver vehículo en MercadoLibre"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              <button
                onClick={handleToggleActive}
                disabled={isToggling || alert.status === 'triggered' || alert.status === 'deleted'}
                className={`transition-colors ${
                  alert.status === 'active'
                    ? 'text-warning-600 hover:text-warning-700'
                    : 'text-gray-400 hover:text-warning-600'
                }`}
                title={alert.status === 'active' ? 'Pausar alerta' : 'Activar alerta'}
              >
                {isToggling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : alert.status === 'active' ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-primary-600 transition-colors"
                title="Editar alerta"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-danger-600 transition-colors"
                title="Eliminar alerta"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Progress indicator for price target */}
          {alert.alert_type === 'price_below' && alert.threshold && currentPrice > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progreso hacia objetivo</span>
                <span>
                  {((currentPrice / alert.threshold) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    currentPrice <= (alert.threshold || 0)
                      ? 'bg-success-500'
                      : 'bg-primary-500'
                  }`}
                  style={{
                    width: `${Math.min((currentPrice / (alert.threshold || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Alert triggered message */}
          {alert.status === 'triggered' && alert.last_triggered_at && (
            <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                <p className="text-sm text-success-800">
                  ¡Alerta activada! El precio alcanzó tu objetivo {formatRelativeTime(new Date(alert.last_triggered_at))}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 