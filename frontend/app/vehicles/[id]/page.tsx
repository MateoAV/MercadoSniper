'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Vehicle, PriceHistory } from '@/types';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocket';
import MainLayout from '@/components/layout/MainLayout';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Gauge, 
  Settings, 
  Fuel,
  DollarSign,
  Bell,
  TrendingDown,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency, formatRelativeTime, formatDateLong, formatMileage } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingAlert, setCreatingAlert] = useState(false);

  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      try {
        // Check if the ID matches MongoDB ObjectId format (24 hex characters)
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        
        let vehicleData: Vehicle;
        if (isMongoId) {
          vehicleData = await apiService.getVehicle(id);
        } else {
          // If not a MongoDB ID, assume it's a MercadoLibre ID
          vehicleData = await apiService.getVehicleByMercadolibreId(id);
        }
        
        setVehicle(vehicleData);
        
        // Fetch price history
        if (vehicleData._id) {
          const history = await apiService.getVehiclePriceHistory(vehicleData._id);
          setPriceHistory(history);
        }
        
        // Subscribe to vehicle updates
        if (vehicleData._id) {
          websocketService.subscribeToVehicle(vehicleData._id);
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        toast.error('Error al cargar información del vehículo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicleData();
    }

    // Cleanup: unsubscribe from vehicle updates
    return () => {
      if (vehicle?._id) {
        websocketService.unsubscribeFromVehicle(vehicle._id);
      }
    };
  }, [id]);

  // Listen for price updates
  useEffect(() => {
    const handlePriceUpdate = (data: { vehicle: Vehicle }) => {
      if (data.vehicle._id === vehicle?._id) {
        setVehicle(data.vehicle);
        toast.success('¡Información del vehículo actualizada!');
      }
    };

    websocketService.on('vehicle_price_update', handlePriceUpdate);

    return () => {
      websocketService.off('vehicle_price_update', handlePriceUpdate);
    };
  }, [vehicle]);

  const createAlert = async () => {
    if (!vehicle) return;
    
    setCreatingAlert(true);
    try {
      await apiService.createAlert({
        vehicle_id: vehicle._id,
        alert_type: 'price_drop',
        notification_channels: ['browser', 'email'],
        status: 'active'
      });
      toast.success('Alerta creada con éxito');
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Error al crear alerta');
    } finally {
      setCreatingAlert(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando información del vehículo...</span>
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="card">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vehículo no encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              No pudimos encontrar el vehículo que estás buscando.
            </p>
            <Link href="/search" className="btn-primary">
              Volver a la búsqueda
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate price drop if available
  const currentPrice = vehicle.price_numeric || 0;
  const originalPrice = vehicle.additional_info?.original_price || currentPrice;
  const hasPriceDrop = originalPrice > currentPrice;
  const priceDropAmount = hasPriceDrop ? originalPrice - currentPrice : 0;
  const priceDropPercentage = hasPriceDrop 
    ? ((originalPrice - currentPrice) / originalPrice) * 100 
    : 0;

  return (
    <MainLayout>
      {/* Back button */}
      <Link href="/search" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a la búsqueda
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Image and key details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle title and basic info */}
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{vehicle.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
              {vehicle.brand && (
                <span className="font-medium">{vehicle.brand}</span>
              )}
              {vehicle.model && (
                <span>{vehicle.model}</span>
              )}
              {vehicle.year && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {vehicle.year}
                </span>
              )}
              {vehicle.location && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {vehicle.location}
                </span>
              )}
            </div>

            {/* Price information */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(currentPrice)}
                </div>
                {hasPriceDrop && (
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500 line-through mr-2">
                      {formatCurrency(originalPrice)}
                    </span>
                    <span className="text-sm font-medium text-success-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {priceDropPercentage.toFixed(1)}% ({formatCurrency(priceDropAmount)})
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Link 
                  href={vehicle.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver en MercadoLibre
                </Link>
                
                <button 
                  onClick={createAlert}
                  disabled={creatingAlert}
                  className="btn-secondary flex items-center"
                >
                  {creatingAlert ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Crear Alerta
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Last updated */}
            <div className="text-xs text-gray-500">
              Última actualización: {vehicle.updated_at ? formatRelativeTime(new Date(vehicle.updated_at)) : 'Desconocida'}
            </div>
          </div>

          {/* Vehicle image */}
          <div className="card">
            {vehicle.image_url ? (
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <Image 
                  src={vehicle.image_url} 
                  alt={vehicle.title} 
                  width={800} 
                  height={600}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚗</div>
                  <span className="text-gray-600">Sin imagen disponible</span>
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificaciones</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle.kilometers && (
                <div className="flex items-center">
                  <Gauge className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Kilometraje</div>
                    <div className="text-gray-900">{formatMileage(vehicle.kilometers)}</div>
                  </div>
                </div>
              )}
              
              {vehicle.transmission && (
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Transmisión</div>
                    <div className="text-gray-900">{vehicle.transmission}</div>
                  </div>
                </div>
              )}
              
              {vehicle.fuel_type && (
                <div className="flex items-center">
                  <Fuel className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Combustible</div>
                    <div className="text-gray-900">{vehicle.fuel_type}</div>
                  </div>
                </div>
              )}
              
              {vehicle.color && (
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-gray-400 mr-3" style={{ backgroundColor: vehicle.color.toLowerCase() === 'blanco' ? 'white' : vehicle.color.toLowerCase() === 'negro' ? 'black' : '#ccc' }} />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Color</div>
                    <div className="text-gray-900">{vehicle.color}</div>
                  </div>
                </div>
              )}
              
              {vehicle.doors && (
                <div className="flex items-center">
                  <span className="h-5 w-5 text-center text-gray-400 mr-3">🚪</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Puertas</div>
                    <div className="text-gray-900">{vehicle.doors}</div>
                  </div>
                </div>
              )}
              
              {vehicle.engine && (
                <div className="flex items-center">
                  <span className="h-5 w-5 text-center text-gray-400 mr-3">🔧</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Motor</div>
                    <div className="text-gray-900">{vehicle.engine}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional info */}
            {vehicle.additional_info && Object.keys(vehicle.additional_info).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Información adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(vehicle.additional_info)
                    .filter(([key, value]) => 
                      typeof value !== 'object' && 
                      key !== 'original_price' && 
                      value !== null && 
                      value !== undefined
                    )
                    .map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{key.replace(/_/g, ' ')}: </span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Price history and stats */}
        <div className="space-y-6">
          {/* Price history */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Historial de precios</h2>
            
            {priceHistory.length > 0 ? (
              <div className="space-y-3">
                {priceHistory.slice(0, 10).map((record, index) => {
                  const prevPrice = index < priceHistory.length - 1 ? priceHistory[index + 1].price_numeric : record.price_numeric;
                  const priceDiff = record.price_numeric - prevPrice;
                  const hasChanged = priceDiff !== 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="text-gray-900 font-medium">
                          {formatCurrency(record.price_numeric)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateLong(record.timestamp)}
                        </div>
                      </div>
                      
                      {hasChanged && index < priceHistory.length - 1 && (
                        <div className={`text-sm font-medium ${priceDiff > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No hay historial de precios disponible</p>
              </div>
            )}
          </div>

          {/* Vehicle stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Vistas</div>
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-lg font-medium text-gray-900">{vehicle.views_count || 0}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Seguimientos</div>
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-lg font-medium text-gray-900">{vehicle.tracking_count || 0}</span>
                </div>
              </div>
              
              {vehicle.canonical_vehicle_id && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Link 
                    href={`/canonical-vehicles/${vehicle.canonical_vehicle_id}`}
                    className="btn-secondary w-full flex items-center justify-center"
                  >
                    Ver vehículos similares
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 