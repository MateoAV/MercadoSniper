'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Vehicle } from '@/types';
import { apiService } from '@/services/api';
import { 
  Car, 
  Search, 
  Filter,
  Loader2, 
  AlertCircle,
  Calendar,
  MapPin,
  Fuel,
  Settings,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, formatNumber, formatRelativeTime, formatMileage } from '@/utils/formatters';
import toast from 'react-hot-toast';

// Helper function to validate image URLs
const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Exclude test domains and invalid hostnames
    if (urlObj.hostname === 'test.com' || urlObj.hostname.includes('test.')) {
      return false;
    }
    // Only allow http/https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

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

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    fuelType: '',
    transmission: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchVehicles();
  }, [pagination.page, filters]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search_query: searchQuery || undefined
      };

      // Add filters to params
      if (filters.brand) params.brand = filters.brand;
      if (filters.model) params.model = filters.model;
      if (filters.minYear) params.min_year = parseInt(filters.minYear);
      if (filters.maxYear) params.max_year = parseInt(filters.maxYear);
      if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
      if (filters.location) params.location = filters.location;
      if (filters.fuelType) params.fuel_type = filters.fuelType;
      if (filters.transmission) params.transmission = filters.transmission;

      const response = await apiService.searchVehicles(params);
      
      // Filter out test/honeypot vehicles
      const filteredVehicles = (response.vehicles || []).filter(vehicle => 
        !isTestVehicle(vehicle)
      );
      
      setVehicles(filteredVehicles);
      setPagination(prev => ({
        ...prev,
        totalCount: response.total_count || 0,
        totalPages: response.total_pages || 0
      }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchVehicles();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      model: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      fuelType: '',
      transmission: ''
    });
    setSearchQuery('');
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Vehículos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explora y gestiona todos los vehículos en nuestra base de datos
          </p>
        </div>

        {/* Search and filters */}
        <div className="card">
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por marca, modelo, título..."
                    className="input-field pl-10 w-full"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-outline flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>
                <button
                  onClick={handleSearch}
                  className="btn-primary"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <option value="toyota">Toyota</option>
                      <option value="chevrolet">Chevrolet</option>
                      <option value="mazda">Mazda</option>
                      <option value="nissan">Nissan</option>
                      <option value="renault">Renault</option>
                      <option value="ford">Ford</option>
                      <option value="kia">Kia</option>
                      <option value="hyundai">Hyundai</option>
                      <option value="volkswagen">Volkswagen</option>
                      <option value="bmw">BMW</option>
                      <option value="audi">Audi</option>
                      <option value="mercedes-benz">Mercedes-Benz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={filters.model}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                      placeholder="Modelo"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año desde
                    </label>
                    <input
                      type="number"
                      value={filters.minYear}
                      onChange={(e) => handleFilterChange('minYear', e.target.value)}
                      placeholder="2000"
                      min="1990"
                      max="2024"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año hasta
                    </label>
                    <input
                      type="number"
                      value={filters.maxYear}
                      onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                      placeholder="2024"
                      min="1990"
                      max="2024"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio desde
                    </label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio hasta
                    </label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="500000000"
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      placeholder="Ciudad"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Combustible
                    </label>
                    <select
                      value={filters.fuelType}
                      onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Todos</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diésel</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="electrico">Eléctrico</option>
                      <option value="gas">Gas</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={clearFilters}
                    className="btn-outline text-sm"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Cargando vehículos...</span>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron vehículos
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
              Mostrando {vehicles.length} de {formatNumber(pagination.totalCount)} vehículos
            </div>
            
            {/* Grid of vehicles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div 
                  key={vehicle._id || vehicle.mercadolibre_id}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-3">
                    <Car className="h-4 w-4 text-primary-600 mr-2" />
                    <span className="text-xs font-medium text-primary-600">Vehículo</span>
                    <div className="ml-auto flex gap-1">
                      {vehicle.url && (
                        <a 
                          href={vehicle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-primary-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Link 
                        href={`/vehicles/${vehicle._id}`}
                        className="text-xs text-gray-500 hover:text-primary-600"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {vehicle.image_url && isValidImageUrl(vehicle.image_url) ? (
                        <Image 
                          src={vehicle.image_url} 
                          alt={vehicle.title || `${vehicle.brand} ${vehicle.model}`} 
                          width={96} 
                          height={96}
                          className="w-full h-full object-cover"
                          onError={() => {
                            console.warn('Failed to load vehicle image:', vehicle.image_url);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Car className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                        {vehicle.title || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim()}
                      </h3>
                      
                      <div className="mt-2">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(vehicle.price_numeric || 0)}
                        </div>
                        {vehicle.additional_info?.original_price && vehicle.additional_info.original_price !== vehicle.price_numeric && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrency(vehicle.additional_info.original_price)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {vehicle.year && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {vehicle.year}
                          </span>
                        )}
                        {vehicle.kilometers && (
                          <span className="flex items-center">
                            <Settings className="h-3 w-3 mr-1" />
                            {formatMileage(vehicle.kilometers)}
                          </span>
                        )}
                        {vehicle.fuel_type && (
                          <span className="flex items-center">
                            <Fuel className="h-3 w-3 mr-1" />
                            {vehicle.fuel_type}
                          </span>
                        )}
                      </div>
                      
                      {vehicle.location && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vehicle.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Actualizado {vehicle.updated_at ? formatRelativeTime(new Date(vehicle.updated_at)) : 'hace un tiempo'}
                  </div>
                </div>
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