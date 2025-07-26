'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Bell, Search, ExternalLink, Loader2 } from 'lucide-react';
import { REGEX_PATTERNS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';
import { apiService } from '@/services/api';
import { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert: (alertData: any) => Promise<void>;
}

interface FormData {
  vehicleUrl: string;
  threshold?: string;
  alert_type: 'price_drop' | 'price_below' | 'availability';
  notification_channels: ('browser' | 'email' | 'push')[];
}

export default function CreateAlertModal({ isOpen, onClose, onCreateAlert }: CreateAlertModalProps) {
  const [formData, setFormData] = useState<FormData>({
    vehicleUrl: '',
    threshold: '',
    alert_type: 'price_drop',
    notification_channels: ['browser'],
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        vehicleUrl: '',
        threshold: '',
        alert_type: 'price_drop',
        notification_channels: ['browser'],
      });
      setErrors({});
      setVehicle(null);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validate vehicle URL
    if (!formData.vehicleUrl.trim()) {
      newErrors.vehicleUrl = 'La URL del vehículo es requerida';
    } else if (!REGEX_PATTERNS.MERCADOLIBRE_URL.test(formData.vehicleUrl)) {
      newErrors.vehicleUrl = 'Debe ser una URL válida de MercadoLibre Colombia';
    }

    // Validate threshold price if alert type is price_below
    if (formData.alert_type === 'price_below') {
      if (!formData.threshold?.trim()) {
        newErrors.threshold = 'El precio objetivo es requerido';
      } else {
        const price = parseFloat(formData.threshold.replace(/[^\d.]/g, ''));
        if (isNaN(price) || price <= 0) {
          newErrors.threshold = 'Debe ser un precio válido mayor a 0';
        } else if (price < 1000) {
          newErrors.threshold = 'El precio debe ser mayor a $1.000';
        } else if (price > 1000000000) {
          newErrors.threshold = 'El precio debe ser menor a $1.000.000.000';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePriceChange = (value: string) => {
    // Allow only numbers and format as currency
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue ? parseInt(numericValue).toLocaleString('es-CO') : '';
    handleInputChange('threshold', formattedValue);
  };

  const handleNotificationChange = (method: 'browser' | 'email' | 'push', checked: boolean) => {
    setFormData(prev => {
      const channels = [...prev.notification_channels];
      
      if (checked && !channels.includes(method)) {
        channels.push(method);
      } else if (!checked && channels.includes(method)) {
        const index = channels.indexOf(method);
        channels.splice(index, 1);
      }
      
      return { ...prev, notification_channels: channels };
    });
  };

  const loadVehiclePreview = async () => {
    if (!formData.vehicleUrl.trim() || !REGEX_PATTERNS.MERCADOLIBRE_URL.test(formData.vehicleUrl)) {
      return;
    }

    setIsLoadingVehicle(true);
    try {
      // Extract MercadoLibre ID from URL
      const mlIdMatch = formData.vehicleUrl.match(/MLA-(\d+)/);
      if (!mlIdMatch || !mlIdMatch[1]) {
        toast.error('URL de MercadoLibre no válida');
        return;
      }
      
      const mercadolibreId = mlIdMatch[1];
      
      // Try to get the vehicle if it already exists
      try {
        const vehicleData = await apiService.getVehicleByMercadolibreId(mercadolibreId);
        setVehicle(vehicleData);
        toast.success('Vehículo encontrado en la base de datos');
      } catch (error) {
        // Vehicle doesn't exist, scrape it
        const response = await apiService.scrapeSingleVehicle(formData.vehicleUrl);
        if (response && response.vehicle) {
          setVehicle(response.vehicle);
          toast.success('Vehículo extraído correctamente');
        } else {
          toast.error('No se pudo extraer la información del vehículo');
        }
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      toast.error('Error al cargar la información del vehículo');
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!vehicle) {
      toast.error('Por favor, carga la información del vehículo primero');
      return;
    }

    setIsLoading(true);
    try {
      const alertData: any = {
        vehicle_id: vehicle._id,
        alert_type: formData.alert_type,
        notification_channels: formData.notification_channels,
        status: 'active'
      };
      
      // Add threshold if alert type is price_below
      if (formData.alert_type === 'price_below' && formData.threshold) {
        alertData.threshold = parseFloat(formData.threshold.replace(/[^\d]/g, ''));
      }
      
      await onCreateAlert(alertData);
      onClose();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceComparisonMessage = () => {
    if (!vehicle || !formData.threshold || formData.alert_type !== 'price_below') return null;
    
    const targetPrice = parseFloat(formData.threshold.replace(/[^\d]/g, ''));
    const currentPrice = vehicle.price_numeric || 0;
    
    if (targetPrice >= currentPrice) {
      return {
        type: 'success',
        message: '¡El precio actual ya está por debajo de tu objetivo!',
      };
    } else {
      const difference = currentPrice - targetPrice;
      return {
        type: 'info',
        message: `El precio debe bajar ${formatCurrency(difference)} para activar la alerta.`,
      };
    }
  };

  const priceComparison = getPriceComparisonMessage();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Bell className="h-6 w-6 text-primary-600 mr-3" />
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Crear Nueva Alerta de Precio
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Vehicle URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del Vehículo en MercadoLibre
                    </label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="url"
                          value={formData.vehicleUrl}
                          onChange={(e) => handleInputChange('vehicleUrl', e.target.value)}
                          placeholder="https://carro.mercadolibre.com.co/MCO-..."
                          className={`input-field ${errors.vehicleUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.vehicleUrl && (
                          <p className="mt-1 text-sm text-red-600">{errors.vehicleUrl}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={loadVehiclePreview}
                        disabled={isLoadingVehicle || !formData.vehicleUrl.trim()}
                        className="btn-secondary flex items-center"
                      >
                        {isLoadingVehicle ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Cargar
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Preview */}
                  {vehicle && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Vista Previa del Vehículo</h4>
                      <div className="flex items-start space-x-4">
                        {vehicle.image_url ? (
                          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image 
                              src={vehicle.image_url} 
                              alt={vehicle.title} 
                              width={80} 
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Sin imagen</span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {vehicle.title}
                          </h5>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {formatCurrency(vehicle.price_numeric || 0)}
                          </p>
                          <div className="flex items-center mt-2">
                            <ExternalLink className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500 truncate">
                              {vehicle.url}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alert Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Alerta
                    </label>
                    <select
                      value={formData.alert_type}
                      onChange={(e) => handleInputChange('alert_type', e.target.value)}
                      className="input-field"
                    >
                      <option value="price_drop">Caída de precio (cualquier reducción)</option>
                      <option value="price_below">Precio por debajo de un valor</option>
                      <option value="availability">Cambio de disponibilidad</option>
                    </select>
                  </div>

                  {/* Threshold Price */}
                  {formData.alert_type === 'price_below' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Objetivo
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="text"
                          value={formData.threshold}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="89.500.000"
                          className={`input-field pl-8 ${errors.threshold ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.threshold && (
                        <p className="mt-1 text-sm text-red-600">{errors.threshold}</p>
                      )}
                    </div>
                  )}

                  {/* Price Comparison */}
                  {priceComparison && (
                    <div className={`p-3 rounded-lg border ${
                      priceComparison.type === 'success' 
                        ? 'bg-success-50 border-success-200 text-success-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      <p className="text-sm">{priceComparison.message}</p>
                    </div>
                  )}

                  {/* Notification Methods */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Métodos de Notificación
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notification_channels.includes('browser')}
                          onChange={(e) => handleNotificationChange('browser', e.target.checked)}
                          className="mr-2 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Notificaciones en el navegador</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notification_channels.includes('email')}
                          onChange={(e) => handleNotificationChange('email', e.target.checked)}
                          className="mr-2 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Correo electrónico</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notification_channels.includes('push')}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          className="mr-2 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Notificaciones push (móvil)</span>
                      </label>
                    </div>
                    {formData.notification_channels.length === 0 && (
                      <p className="mt-1 text-sm text-red-600">Selecciona al menos un método de notificación</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !vehicle || formData.notification_channels.length === 0}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creando...
                        </>
                      ) : (
                        'Crear Alerta'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 