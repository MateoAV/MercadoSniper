'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CanonicalVehicle, Vehicle } from '@/types';
import { apiService } from '@/services/api';
import MainLayout from '@/components/layout/MainLayout';
import { 
  ArrowLeft, 
  Car,
  Calendar, 
  Settings, 
  Fuel,
  Tag,
  Loader2,
  AlertCircle,
  Layers,
  Info,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';
import toast from 'react-hot-toast';

// Helper function to identify test/honeypot vehicles
const isTestVehicle = (vehicle: Vehicle): boolean => {
  // Check for test indicators in various fields
  const testPatterns = [
    /test/i,           // "test" in any case
    /MCO-TEST/i,       // MercadoLibre test IDs
    /test\.com/i,      // test.com domain
    /honeypot/i,       // explicit honeypot mentions
    /dummy/i,          // dummy data
    /fake/i            // fake data
  ];

  // Check mercadolibre_id
  if (vehicle.mercadolibre_id) {
    for (const pattern of testPatterns) {
      if (pattern.test(vehicle.mercadolibre_id)) {
        return true;
      }
    }
  }

  // Check URL
  if (vehicle.url) {
    for (const pattern of testPatterns) {
      if (pattern.test(vehicle.url)) {
        return true;
      }
    }
  }

  // Check image URL
  if (vehicle.image_url) {
    for (const pattern of testPatterns) {
      if (pattern.test(vehicle.image_url)) {
        return true;
      }
    }
  }

  // Check title for obvious test patterns
  if (vehicle.title) {
    for (const pattern of testPatterns) {
      if (pattern.test(vehicle.title)) {
        return true;
      }
    }
  }

  return false;
};

export default function CanonicalVehicleDetailPage() {
  const { id } = useParams();
  const [canonicalVehicle, setCanonicalVehicle] = useState<CanonicalVehicle | null>(null);
  const [relatedVehicles, setRelatedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    const fetchCanonicalVehicle = async () => {
      setLoading(true);
      try {
        const data = await apiService.getCanonicalVehicle(id as string);
        setCanonicalVehicle(data);
        
        // Fetch related vehicles
        fetchRelatedVehicles(data._id);
      } catch (error) {
        console.error('Error fetching canonical vehicle:', error);
        toast.error('Error al cargar información del vehículo canónico');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCanonicalVehicle();
    }
  }, [id]);

  const fetchRelatedVehicles = async (canonicalId: string) => {
    setLoadingVehicles(true);
    try {
      const vehicles = await apiService.getCanonicalVehicleListings(canonicalId);
      
      // Filter out test/honeypot vehicles
      const filteredVehicles = (vehicles || []).filter(vehicle => 
        !isTestVehicle(vehicle)
      );
      
      setRelatedVehicles(filteredVehicles);
    } catch (error) {
      console.error('Error fetching related vehicles:', error);
      toast.error('Error al cargar vehículos relacionados');
    } finally {
      setLoadingVehicles(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando información del vehículo canónico...</span>
        </div>
      </MainLayout>
    );
  }

  if (!canonicalVehicle) {
    return (
      <MainLayout>
        <div className="card">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vehículo canónico no encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              No pudimos encontrar el vehículo canónico que estás buscando.
            </p>
            <Link href="/search" className="btn-primary">
              Volver a la búsqueda
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

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
          {/* Canonical vehicle title and basic info */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Layers className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Vehículo Canónico</h2>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {canonicalVehicle.brand} {canonicalVehicle.model} {canonicalVehicle.year}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
              {canonicalVehicle.year && (
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {canonicalVehicle.year}
                </span>
              )}
              {canonicalVehicle.transmission && (
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  {canonicalVehicle.transmission}
                </span>
              )}
              {canonicalVehicle.fuel_type && (
                <span className="flex items-center">
                  <Fuel className="h-4 w-4 mr-1" />
                  {canonicalVehicle.fuel_type}
                </span>
              )}
              {canonicalVehicle.body_type && (
                <span className="flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  {canonicalVehicle.body_type}
                </span>
              )}
            </div>

            {/* Price range */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-1">Rango de Precios</div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(canonicalVehicle.min_price || 0)}
                </span>
                <span className="mx-2 text-gray-500">-</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(canonicalVehicle.max_price || 0)}
                </span>
              </div>
            </div>

            {/* Last updated */}
            <div className="text-xs text-gray-500">
              Última actualización: {canonicalVehicle.updated_at ? formatRelativeTime(new Date(canonicalVehicle.updated_at)) : 'Desconocida'}
            </div>
          </div>

          {/* Canonical vehicle image */}
          <div className="card">
            {canonicalVehicle.image_url ? (
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <Image 
                  src={canonicalVehicle.image_url} 
                  alt={`${canonicalVehicle.brand} ${canonicalVehicle.model}`} 
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
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Marca</div>
                  <div className="text-gray-900">{canonicalVehicle.brand}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Modelo</div>
                  <div className="text-gray-900">{canonicalVehicle.model}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Año</div>
                  <div className="text-gray-900">{canonicalVehicle.year}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Fuel className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Combustible</div>
                  <div className="text-gray-900">{canonicalVehicle.fuel_type || 'No especificado'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Transmisión</div>
                  <div className="text-gray-900">{canonicalVehicle.transmission || 'No especificado'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Car className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Tipo de Carrocería</div>
                  <div className="text-gray-900">{canonicalVehicle.body_type || 'No especificado'}</div>
                </div>
              </div>
            </div>
            
            {/* Additional info */}
            {canonicalVehicle.additional_info && Object.keys(canonicalVehicle.additional_info).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">Información adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(canonicalVehicle.additional_info)
                    .filter(([key, value]) => 
                      typeof value !== 'object' && 
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

        {/* Right column: Stats and related vehicles */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Vehículos Relacionados</div>
                <div className="text-2xl font-medium text-gray-900">{relatedVehicles.length}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Precio Promedio</div>
                <div className="text-2xl font-medium text-gray-900">
                  {formatCurrency(canonicalVehicle.avg_price || 0)}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Kilometraje Promedio</div>
                <div className="text-2xl font-medium text-gray-900">
                  {canonicalVehicle.avg_kilometers ? `${canonicalVehicle.avg_kilometers.toLocaleString('es-CO')} km` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* What is a canonical vehicle? */}
          <div className="card bg-blue-50 border border-blue-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">¿Qué es un vehículo canónico?</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Un vehículo canónico es una representación estandarizada de un modelo específico de vehículo. Agrupa listados similares para facilitar la comparación de precios y características entre vehículos del mismo tipo.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related vehicles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Vehículos Relacionados</h2>
              {loadingVehicles && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
            </div>
            
            {relatedVehicles.length > 0 ? (
              <div className="space-y-4">
                {relatedVehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle._id} className="flex items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {vehicle.image_url ? (
                        <Image 
                          src={vehicle.image_url} 
                          alt={vehicle.title} 
                          width={64} 
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Car className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <Link 
                        href={`/vehicles/${vehicle._id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {vehicle.title}
                      </Link>
                      <div className="text-sm font-bold text-gray-900 mt-0.5">
                        {formatCurrency(vehicle.price_numeric || 0)}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        {vehicle.location && (
                          <span className="mr-2">{vehicle.location}</span>
                        )}
                        {vehicle.kilometers && (
                          <span>{vehicle.kilometers} km</span>
                        )}
                      </div>
                    </div>
                    
                    <a 
                      href={vehicle.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-gray-400 hover:text-primary-600"
                      title="Ver en MercadoLibre"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
                
                {relatedVehicles.length > 5 && (
                  <div className="text-center pt-2">
                    <button 
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                      onClick={() => {
                        // This would open a modal or navigate to a page with all related vehicles
                        toast.success('Esta funcionalidad aún no está implementada');
                      }}
                    >
                      Ver todos los {relatedVehicles.length} vehículos
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Car className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No hay vehículos relacionados disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 