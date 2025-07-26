'use client';

import { Vehicle } from '@/types';
import VehicleCard from './VehicleCard';
import Pagination from './Pagination';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface SearchResultsProps {
  vehicles: Vehicle[];
  loading: boolean;
  searchQuery: string;
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  onTrackVehicle: (vehicleUrl: string) => Promise<void>;
  onPageChange: (page: number) => void;
}

export default function SearchResults({
  vehicles,
  loading,
  searchQuery,
  pagination,
  onTrackVehicle,
  onPageChange,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Buscando vehículos...</span>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron vehículos
          </h3>
          <p className="text-gray-600 mb-6">
            No hay resultados para "{searchQuery}". Intenta con diferentes términos de búsqueda o ajusta los filtros.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Sugerencias:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verifica la ortografía</li>
              <li>Usa términos más generales (ej: "Toyota" en lugar de "Toyota Corolla XEI")</li>
              <li>Ajusta los filtros de precio o año</li>
              <li>Prueba con diferentes marcas o modelos</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados para "{searchQuery}"
              </h2>
              <p className="text-sm text-gray-600">
                {pagination.total_count.toLocaleString('es-CO')} vehículos encontrados
              </p>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Página {pagination.page} de {pagination.total_pages}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle._id || vehicle.mercadolibre_id}
            vehicle={vehicle}
            onTrackVehicle={() => onTrackVehicle(vehicle.url)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          onPageChange={onPageChange}
          totalResults={pagination.total_count}
          pageSize={pagination.page_size}
        />
      )}
    </div>
  );
} 