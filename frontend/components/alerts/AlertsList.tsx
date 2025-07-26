'use client';

import { useState, useEffect } from 'react';
import AlertCard from './AlertCard';
import EditAlertModal from './EditAlertModal';
import { Alert, Vehicle } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';

interface AlertsListProps {
  alerts: Alert[];
  loading: boolean;
  onUpdateAlert: (id: string, alertData: Partial<Alert>) => Promise<void>;
  onDeleteAlert: (id: string) => Promise<void>;
}

export default function AlertsList({ alerts, loading, onUpdateAlert, onDeleteAlert }: AlertsListProps) {
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Fetch vehicles data for alerts
  useEffect(() => {
    const fetchVehiclesData = async () => {
      if (alerts.length === 0) return;
      
      setLoadingVehicles(true);
      const vehicleIds = alerts
        .filter(alert => alert.vehicle_id)
        .map(alert => alert.vehicle_id as string);
      
      if (vehicleIds.length === 0) {
        setLoadingVehicles(false);
        return;
      }

      try {
        // Fetch each vehicle individually
        const vehiclesData: Record<string, Vehicle> = {};
        
        await Promise.all(vehicleIds.map(async (id) => {
          try {
            const vehicle = await apiService.getVehicle(id);
            if (vehicle) {
              vehiclesData[id] = vehicle;
            }
          } catch (error) {
            console.error(`Error fetching vehicle ${id}:`, error);
          }
        }));
        
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching vehicles data:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehiclesData();
  }, [alerts]);

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
  };

  const handleUpdateAlert = async (alertData: Partial<Alert>) => {
    if (editingAlert) {
      await onUpdateAlert(editingAlert.id || '', alertData);
      setEditingAlert(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay alertas
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primera alerta para recibir notificaciones cuando los precios cambien.
          </p>
          <button 
            onClick={() => {/* This would trigger the create modal */}}
            className="btn-primary"
          >
            Crear Primera Alerta
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            vehicle={alert.vehicle_id ? vehicles[alert.vehicle_id] : undefined}
            onEdit={() => handleEditAlert(alert)}
            onDelete={() => onDeleteAlert(alert.id || '')}
            onToggleActive={(status) => onUpdateAlert(alert.id || '', { status })}
          />
        ))}
      </div>

      {/* Edit alert modal */}
      {editingAlert && (
        <EditAlertModal
          isOpen={!!editingAlert}
          alert={editingAlert}
          onClose={() => setEditingAlert(null)}
          onUpdateAlert={handleUpdateAlert}
        />
      )}

      {/* Loading overlay for vehicles data */}
      {loadingVehicles && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center z-50">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600 mr-2" />
          <span className="text-sm text-gray-600">Cargando datos de vehículos...</span>
        </div>
      )}
    </>
  );
} 