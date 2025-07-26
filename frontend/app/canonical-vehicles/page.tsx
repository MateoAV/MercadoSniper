'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { CanonicalVehicle } from '@/types';
import { apiService } from '@/services/api';
import { 
  Layers, 
  Search, 
  Loader2, 
  AlertCircle,
  Calendar,
  Car,
  Fuel,
  Settings,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

export default function CanonicalVehiclesPage() {
  const [canonicalVehicles, setCanonicalVehicles] = useState<CanonicalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    brand: '',
    minYear: '',
    maxYear: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCanonicalVehicles();
  }, [pagination.page, filters]);

  const fetchCanonicalVehicles = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search_query: searchQuery || undefined
      };

      if (filters.brand) params.brand = filters.brand;
      if (filters.minYear) params.min_year = parseInt(filters.minYear);
      if (filters.maxYear) params.max_year = parseInt(filters.maxYear);

      const response = await apiService.getCanonicalVehicles(params);
      
      setCanonicalVehicles(response.canonical_vehicles || []);
      setPagination(prev => ({
        ...prev,
        totalCount: response.total_count || 0,
        totalPages: response.total_pages || 0
      }));
    } catch (error) {
      console.error('Error fetching canonical vehicles:', error);
      toast.error('Error al cargar los vehículos canónicos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCanonicalVehicles();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos Canónicos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modelos estandarizados de vehículos para facilitar la comparación y el análisis
          </p>
        </div>

        {/* Search and filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por marca, modelo..."
                  className="input-field pl-10 w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="input-field"
              >
                <option value="">Todas las marcas</option>
                <option value="Toyota">Toyota</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="Mazda">Mazda</option>
                <option value="Nissan">Nissan</option>
                <option value="Renault">Renault</option>
                <option value="Ford">Ford</option>
                <option value="Kia">Kia</option>
                <option value="Hyundai">Hyundai</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año Desde
              </label>
              <input
                type="number"
                value={filters.minYear}
                onChange={(e) => handleFilterChange('minYear', e.target.value)}
                placeholder="Desde"
                min="1990"
                max="2024"
                className="input-field w-24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año Hasta
              </label>
              <input
                type="number"
                value={filters.maxYear}
                onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                placeholder="Hasta"
                min="1990"
                max="2024"
                className="input-field w-24"
              />
            </div>
            
            <button
              onClick={handleSearch}
              className="btn-primary h-10"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Cargando vehículos canónicos...</span>
            </div>
          </div>
        ) : canonicalVehicles.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron vehículos canónicos
              </h3>
              <p className="text-gray-600">
                Intenta con diferentes términos de búsqueda o ajusta los filtros.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results count */}
            <div className="text-sm text-gray-500">
              Mostrando {canonicalVehicles.length} de {pagination.totalCount} vehículos canónicos
            </div>
            
            {/* Grid of canonical vehicles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canonicalVehicles.map((vehicle) => (
                <Link 
                  href={`/canonical-vehicles/${vehicle._id}`} 
                  key={vehicle._id}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-3">
                    <Layers className="h-4 w-4 text-primary-600 mr-2" />
                    <span className="text-xs font-medium text-primary-600">Vehículo Canónico</span>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {vehicle.canonical_image_url ? (
                        <Image 
                          src={vehicle.canonical_image_url} 
                          alt={`${vehicle.brand} ${vehicle.model}`} 
                          width={96} 
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Car className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                        {vehicle.canonical_title || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim()}
                      </h3>
                      
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        {vehicle.year && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {vehicle.year}
                          </span>
                        )}
                        {vehicle.transmission && (
                          <span className="flex items-center">
                            <Settings className="h-3 w-3 mr-1" />
                            {vehicle.transmission}
                          </span>
                        )}
                        {vehicle.fuel_type && (
                          <span className="flex items-center">
                            <Fuel className="h-3 w-3 mr-1" />
                            {vehicle.fuel_type}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex justify-between items-end">
                        <div>
                          <div className="text-xs text-gray-500">Rango de precios</div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(vehicle.min_price || 0)} - {formatCurrency(vehicle.max_price || 0)}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {vehicle.total_listings || 0} vehículos relacionados
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`px-3 py-2 rounded-l-md text-sm font-medium ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`px-3 py-2 rounded-r-md text-sm font-medium ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 