'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Edit3, ExternalLink } from 'lucide-react';
import { PriceAlert } from '@/types';
import { ALERT_TYPES, NOTIFICATION_METHODS } from '@/utils/constants';
import { formatCurrency } from '@/utils/formatters';

interface EditAlertModalProps {
  isOpen: boolean;
  alert: PriceAlert;
  onClose: () => void;
  onUpdateAlert: (alertData: Partial<PriceAlert>) => Promise<void>;
}

interface FormData {
  targetPrice: string;
  alertType: 'below' | 'above' | 'change';
  notificationMethod: 'browser' | 'email' | 'both';
  isActive: boolean;
}

export default function EditAlertModal({ isOpen, alert, onClose, onUpdateAlert }: EditAlertModalProps) {
  const [formData, setFormData] = useState<FormData>({
    targetPrice: '',
    alertType: 'below',
    notificationMethod: 'browser',
    isActive: true,
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock product data - in real app this would come from the alert or be fetched
  const mockProduct = {
    title: 'Toyota Corolla Cross XEI 2021',
    currentPrice: 89500000,
    url: 'https://carro.mercadolibre.com.co/MCO-example',
    imageUrl: '/api/placeholder/300/200',
  };

  // Initialize form with alert data
  useEffect(() => {
    if (isOpen && alert) {
      setFormData({
        targetPrice: alert.targetPrice.toLocaleString('es-CO'),
        alertType: alert.alertType,
        notificationMethod: alert.notificationMethod,
        isActive: alert.isActive,
      });
      setErrors({});
    }
  }, [isOpen, alert]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validate target price
    if (formData.alertType !== 'change') {
      if (!formData.targetPrice.trim()) {
        newErrors.targetPrice = 'El precio objetivo es requerido';
      } else {
        const price = parseFloat(formData.targetPrice.replace(/[^\d.]/g, ''));
        if (isNaN(price) || price <= 0) {
          newErrors.targetPrice = 'Debe ser un precio válido mayor a 0';
        } else if (price < 1000) {
          newErrors.targetPrice = 'El precio debe ser mayor a $1.000';
        } else if (price > 1000000000) {
          newErrors.targetPrice = 'El precio debe ser menor a $1.000.000.000';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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
    handleInputChange('targetPrice', formattedValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedData: Partial<PriceAlert> = {
        alertType: formData.alertType,
        notificationMethod: formData.notificationMethod,
        isActive: formData.isActive,
      };

      // Only include target price if it's not a 'change' alert
      if (formData.alertType !== 'change') {
        updatedData.targetPrice = parseFloat(formData.targetPrice.replace(/[^\d]/g, ''));
      }

      await onUpdateAlert(updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceComparisonMessage = () => {
    if (formData.alertType === 'change' || !formData.targetPrice) return null;
    
    const targetPrice = parseFloat(formData.targetPrice.replace(/[^\d]/g, ''));
    const currentPrice = mockProduct.currentPrice;
    
    if (formData.alertType === 'below') {
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
    } else if (formData.alertType === 'above') {
      if (targetPrice <= currentPrice) {
        return {
          type: 'success',
          message: '¡El precio actual ya está por encima de tu objetivo!',
        };
      } else {
        const difference = targetPrice - currentPrice;
        return {
          type: 'info',
          message: `El precio debe subir ${formatCurrency(difference)} para activar la alerta.`,
        };
      }
    }
    
    return null;
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
                    <Edit3 className="h-6 w-6 text-primary-600 mr-3" />
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Editar Alerta de Precio
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Product Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Producto</h4>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Imagen</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {mockProduct.title}
                      </h5>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatCurrency(mockProduct.currentPrice)}
                      </p>
                      <div className="flex items-center mt-2">
                        <ExternalLink className="h-3 w-3 text-gray-400 mr-1" />
                        <a 
                          href={mockProduct.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Ver en MercadoLibre
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Alert Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Alerta activa
                      </span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.isActive 
                        ? 'La alerta está activa y enviará notificaciones cuando se cumplan las condiciones.'
                        : 'La alerta está desactivada y no enviará notificaciones.'
                      }
                    </p>
                  </div>

                  {/* Alert Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Alerta
                    </label>
                    <select
                      value={formData.alertType}
                      onChange={(e) => handleInputChange('alertType', e.target.value)}
                      className="input-field"
                    >
                      {ALERT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Price */}
                  {formData.alertType !== 'change' && (
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
                          value={formData.targetPrice}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="89.500.000"
                          className={`input-field pl-8 ${errors.targetPrice ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                      </div>
                      {errors.targetPrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.targetPrice}</p>
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

                  {/* Notification Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Notificación
                    </label>
                    <select
                      value={formData.notificationMethod}
                      onChange={(e) => handleInputChange('notificationMethod', e.target.value)}
                      className="input-field"
                    >
                      {NOTIFICATION_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Alert History */}
                  {alert.triggeredAt && (
                    <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                      <h4 className="text-sm font-medium text-success-800 mb-1">
                        Historial de Activación
                      </h4>
                      <p className="text-sm text-success-700">
                        Esta alerta fue activada el{' '}
                        {new Date(alert.triggeredAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}

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
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Cambios'
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