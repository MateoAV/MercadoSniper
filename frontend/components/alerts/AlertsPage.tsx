'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AlertsList from './AlertsList';
import CreateAlertModal from './CreateAlertModal';
import AlertFilters from './AlertFilters';
import { Alert } from '@/types';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';
import { Plus, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to alerts updates
    websocketService.subscribeToAlerts();
    
    // Listen for alert triggered events
    websocketService.on('alert_triggered', handleAlertTriggered);
    
    return () => {
      // Cleanup
      websocketService.off('alert_triggered', handleAlertTriggered);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, filters]);

  const handleAlertTriggered = (data: any) => {
    // Refresh alerts when an alert is triggered
    fetchAlerts();
    toast.success(`¡Alerta activada! ${data.vehicleTitle || 'Un vehículo'} ha cambiado de precio.`);
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAlerts();
      // Ensure response is an array
      const alertsArray = Array.isArray(response) ? response : [];
      setAlerts(alertsArray);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar las alertas');
      setAlerts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Ensure alerts is an array
    if (!Array.isArray(alerts)) {
      setFilteredAlerts([]);
      return;
    }
    
    let filtered = [...alerts];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => {
        if (filters.status === 'active') return alert.status === 'active';
        if (filters.status === 'triggered') return alert.status === 'triggered';
        if (filters.status === 'paused') return alert.status === 'paused';
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'threshold':
          aValue = a.threshold || 0;
          bValue = b.threshold || 0;
          break;
        case 'last_triggered_at':
          aValue = a.last_triggered_at ? new Date(a.last_triggered_at) : new Date(0);
          bValue = b.last_triggered_at ? new Date(b.last_triggered_at) : new Date(0);
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAlerts(filtered);
  };

  const handleCreateAlert = async (alertData: any) => {
    try {
      const response = await apiService.createAlert(alertData);
      if (response) {
        fetchAlerts(); // Refresh alerts list
        setIsCreateModalOpen(false);
        toast.success('Alerta creada exitosamente');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Error al crear la alerta');
    }
  };

  const handleUpdateAlert = async (id: string, alertData: Partial<Alert>) => {
    try {
      const response = await apiService.updateAlert(id, alertData);
      if (response) {
              setAlerts(prev => Array.isArray(prev) ? prev.map(alert => 
        alert.id === id ? { ...alert, ...response } : alert
      ) : []);
        toast.success('Alerta actualizada exitosamente');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Error al actualizar la alerta');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await apiService.deleteAlert(id);
      setAlerts(prev => Array.isArray(prev) ? prev.filter(alert => alert.id !== id) : []);
      toast.success('Alerta eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error al eliminar la alerta');
    }
  };

  const activeAlertsCount = Array.isArray(alerts) ? alerts.filter(alert => alert.status === 'active').length : 0;
  const triggeredAlertsCount = Array.isArray(alerts) ? alerts.filter(alert => alert.status === 'triggered').length : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas de Precio</h1>
            <p className="mt-1 text-sm text-gray-600">
              Administra tus alertas para recibir notificaciones cuando los precios cambien
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Alerta
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Alertas
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {Array.isArray(alerts) ? alerts.length : 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-warning-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alertas Activas
                  </dt>
                  <dd className="text-2xl font-semibold text-warning-600">
                    {activeAlertsCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alertas Activadas
                  </dt>
                  <dd className="text-2xl font-semibold text-success-600">
                    {triggeredAlertsCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <AlertFilters 
          filters={filters}
          onFiltersChange={setFilters}
          alertsCount={filteredAlerts.length}
        />

        {/* Alerts list */}
        <AlertsList
          alerts={filteredAlerts}
          loading={loading}
          onUpdateAlert={handleUpdateAlert}
          onDeleteAlert={handleDeleteAlert}
        />

        {/* Create alert modal */}
        <CreateAlertModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateAlert={handleCreateAlert}
        />
      </div>
    </MainLayout>
  );
} 