'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import { Vehicle, VehicleSearchResponse } from '@/types';
import { apiService } from '@/services/api';
import { Search, Zap, Car } from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchFiltersType {
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  brand?: string;
  model?: string;
  location?: string;
  fuel_type?: string;
  transmission?: string;
  sortBy?: 'price' | 'year';
  sortOrder?: 'asc' | 'desc';
}

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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>({
    sortBy: 'price',
    sortOrder: 'asc',
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });

  // Debounced search function to prevent too many rapid API calls
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string, searchFilters: SearchFiltersType, page: number = 1) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(query, searchFilters, page);
        }, 300); // 300ms delay
      };
    })(),
    []
  );

  const handleSearch = async (query: string, searchFilters: SearchFiltersType, page: number = 1) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      // Convert our UI filters to API parameters
      const apiParams = {
        search_query: query,
        min_price: searchFilters.min_price,
        max_price: searchFilters.max_price,
        min_year: searchFilters.min_year,
        max_year: searchFilters.max_year,
        brand: searchFilters.brand,
        model: searchFilters.model,
        location: searchFilters.location,
        fuel_type: searchFilters.fuel_type,
        transmission: searchFilters.transmission,
        page,
        page_size: pagination.page_size,
      };
      
      const response: VehicleSearchResponse = await apiService.searchVehicles(apiParams);
      
      // Filter out test/honeypot vehicles
      const filteredVehicles = (response.vehicles || []).filter(vehicle => 
        !isTestVehicle(vehicle)
      );
      
      setVehicles(filteredVehicles);
      setPagination({
        page: response.page,
        page_size: response.page_size,
        total_count: response.total_count,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_previous: response.has_previous,
      });
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Error al buscar vehículos');
      setVehicles([]);
      setPagination({
        page: 1,
        page_size: 20,
        total_count: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackVehicle = async (vehicleUrl: string) => {
    try {
      // Extract MercadoLibre ID from URL
      const mlIdMatch = vehicleUrl.match(/MLA-(\d+)/);
      if (!mlIdMatch || !mlIdMatch[1]) {
        toast.error('URL de MercadoLibre no válida');
        return;
      }
      
      const mercadolibreId = mlIdMatch[1];
      
      // First check if the vehicle exists
      try {
        await apiService.getVehicleByMercadolibreId(mercadolibreId);
        toast.success('Vehículo ya está en seguimiento');
      } catch (error) {
        // Vehicle doesn't exist, scrape it
        const response = await apiService.scrapeSingleVehicle(vehicleUrl);
        if (response && response.vehicle) {
          toast.success('Vehículo agregado al seguimiento');
          
          // Refresh the search to show updated data
          handleSearch(searchQuery, filters, pagination.page);
        }
      }
    } catch (error) {
      console.error('Error tracking vehicle:', error);
      toast.error('Error al agregar vehículo al seguimiento');
    }
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(searchQuery, filters, newPage);
  };

  const getActiveFilters = () => {
    const activeFilters: Array<{ key: keyof SearchFiltersType; label: string }> = [];
    
    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      let label = 'Precio: ';
      if (filters.min_price && filters.max_price) {
        label += `$${(filters.min_price / 1000000).toFixed(0)}M - $${(filters.max_price / 1000000).toFixed(0)}M`;
      } else if (filters.min_price) {
        label += `Desde $${(filters.min_price / 1000000).toFixed(0)}M`;
      } else if (filters.max_price) {
        label += `Hasta $${(filters.max_price / 1000000).toFixed(0)}M`;
      }
      activeFilters.push({ key: 'min_price', label }); // We'll handle both price filters together
    }
    
    if (filters.min_year !== undefined || filters.max_year !== undefined) {
      let label = 'Año: ';
      if (filters.min_year && filters.max_year) {
        label += `${filters.min_year} - ${filters.max_year}`;
      } else if (filters.min_year) {
        label += `Desde ${filters.min_year}`;
      } else if (filters.max_year) {
        label += `Hasta ${filters.max_year}`;
      }
      activeFilters.push({ key: 'min_year', label }); // We'll handle both year filters together
    }
    
    if (filters.brand) {
      activeFilters.push({ key: 'brand', label: `Marca: ${filters.brand}` });
    }
    
    if (filters.model) {
      activeFilters.push({ key: 'model', label: `Modelo: ${filters.model}` });
    }
    
    if (filters.location) {
      activeFilters.push({ key: 'location', label: `Ubicación: ${filters.location}` });
    }
    
    if (filters.fuel_type) {
      activeFilters.push({ key: 'fuel_type', label: `Combustible: ${filters.fuel_type}` });
    }
    
    if (filters.transmission) {
      activeFilters.push({ key: 'transmission', label: `Transmisión: ${filters.transmission}` });
    }
    
    return activeFilters;
  };

  const removeFilter = (key: keyof SearchFiltersType) => {
    const newFilters = { ...filters };
    
    // Handle special cases where multiple filters are grouped together
    if (key === 'min_price') {
      delete newFilters.min_price;
      delete newFilters.max_price;
    } else if (key === 'min_year') {
      delete newFilters.min_year;
      delete newFilters.max_year;
    } else {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    if (hasSearched) {
      debouncedSearch(searchQuery, newFilters);
    }
  };

  const clearAllFilters = () => {
    const newFilters: SearchFiltersType = {
      sortBy: 'price',
      sortOrder: 'asc',
    };
    setFilters(newFilters);
    if (hasSearched) {
      debouncedSearch(searchQuery, newFilters);
    }
  };

  const popularSearches = [
    'Toyota Corolla',
    'Honda Civic',
    'Chevrolet Onix',
    'Mazda 3',
    'Ford Fiesta',
    'Nissan Sentra',
    'Hyundai Accent',
    'Volkswagen Polo',
  ];

  const quickFilters = [
    { label: 'Hasta $50M', filters: { min_price: 0, max_price: 50000000 } },
    { label: 'Hasta $100M', filters: { min_price: 0, max_price: 100000000 } },
    { label: '2020 o más reciente', filters: { min_year: 2020 } },
    { label: 'Automático', filters: { transmission: 'Automática' } },
    { label: 'Bogotá', filters: { location: 'Bogotá' } },
    { label: 'Medellín', filters: { location: 'Medellín' } },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buscar Vehículos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Encuentra vehículos en MercadoLibre Colombia y agrégatelos a tu seguimiento
          </p>
        </div>

        {/* Search header */}
        <div className="card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0">
              <Search className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Busca tu vehículo ideal
              </h2>
              <p className="text-sm text-gray-600">
                Usa filtros avanzados para encontrar exactamente lo que buscas
              </p>
            </div>
          </div>

          {/* Main search bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery, filters)}
              placeholder="Buscar por marca, modelo, año... (ej: Toyota Corolla 2020)"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>

          {/* Search button */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => handleSearch(searchQuery, filters)}
              disabled={loading || !searchQuery.trim()}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Vehículos
                </>
              )}
            </button>

            <div className="text-sm text-gray-500">
              Pulsa Enter para buscar rápidamente
            </div>
          </div>

          {/* Active Filters */}
          {getActiveFilters().length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700 mr-2">Filtros activos:</span>
                {getActiveFilters().map((activeFilter, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 text-xs bg-primary-100 text-primary-800 rounded-full"
                  >
                    <span>{activeFilter.label}</span>
                    <button
                      onClick={() => removeFilter(activeFilter.key)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Limpiar todos
                </button>
              </div>
            </div>
          )}

          {/* Quick filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700 mr-2">Filtros rápidos:</span>
              {quickFilters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newFilters = { ...filters, ...filter.filters };
                    setFilters(newFilters);
                    // Auto-search when quick filters are applied
                    if (searchQuery.trim() || hasSearched) {
                      debouncedSearch(searchQuery, newFilters);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Popular searches */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Búsquedas populares:</span>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search, filters);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                // Auto-search when filters change (only if we have a search query or already searched)
                if (searchQuery.trim() || hasSearched) {
                  debouncedSearch(searchQuery, newFilters);
                }
              }}
              onSearch={() => handleSearch(searchQuery, filters)}
              resultsCount={pagination.total_count}
            />
          </div>

          {/* Results area */}
          <div className="lg:col-span-3">
            {!hasSearched ? (
              // Welcome state
              <div className="card">
                <div className="text-center py-12">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ¡Encuentra tu vehículo ideal!
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Usa la barra de búsqueda y los filtros para encontrar vehículos en MercadoLibre Colombia. 
                    Podrás agregarlos a tu seguimiento y recibir alertas de precios.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap className="h-4 w-4 text-primary-600 mr-2" />
                      Búsqueda rápida
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Search className="h-4 w-4 text-primary-600 mr-2" />
                      Filtros avanzados
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SearchResults
                vehicles={vehicles}
                loading={loading}
                searchQuery={searchQuery}
                pagination={pagination}
                onTrackVehicle={handleTrackVehicle}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 