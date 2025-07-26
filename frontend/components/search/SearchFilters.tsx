'use client';

import { useState } from 'react';
import { 
  CAR_BRANDS, 
  FUEL_TYPES, 
  TRANSMISSION_TYPES, 
  VEHICLE_CONDITIONS,
  COLOMBIAN_CITIES,
  PRICE_RANGES,
  YEAR_RANGES,
  MILEAGE_RANGES,
  CURRENT_YEAR 
} from '@/utils/constants';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ChevronDown, ChevronUp, RotateCcw, Filter } from 'lucide-react';

// Define the new filter structure to match API parameters
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
  condition?: string;
  sortBy?: 'price' | 'year';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onSearch: () => void;
  resultsCount: number;
}

export default function SearchFilters({ filters, onFiltersChange, onSearch, resultsCount }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    specs: true,
    location: false,
    condition: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sortBy: 'price',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => {
      if (key === 'sortBy' || key === 'sortOrder') return false;
      const value = filters[key as keyof SearchFiltersType];
      return value !== undefined && value !== '';
    });
  };

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: keyof typeof expandedSections; 
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ordenar por
          </label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="input-field text-sm"
          >
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="year-desc">Año: Más Reciente</option>
            <option value="year-asc">Año: Más Antiguo</option>
          </select>
        </div>

        {/* Price Range */}
        <FilterSection title="Precio" sectionKey="price">
          <div>
            <label className="block text-xs text-gray-600 mb-2">Rangos predefinidos</label>
            <div className="grid grid-cols-1 gap-1">
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleFilterChange('min_price', range.min);
                    handleFilterChange('max_price', range.max === Infinity ? undefined : range.max);
                  }}
                  className="text-left px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Precio mínimo</label>
              <input
                type="text"
                value={filters.min_price ? formatNumber(filters.min_price) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseInt(value.replace(/[^\d]/g, ''));
                  handleFilterChange('min_price', numValue);
                }}
                placeholder="0"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Precio máximo</label>
              <input
                type="text"
                value={filters.max_price ? formatNumber(filters.max_price) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseInt(value.replace(/[^\d]/g, ''));
                  handleFilterChange('max_price', numValue);
                }}
                placeholder="Sin límite"
                className="input-field text-sm"
              />
            </div>
          </div>
        </FilterSection>

        {/* Vehicle Specs */}
        <FilterSection title="Especificaciones" sectionKey="specs">
          {/* Brand */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Marca</label>
            <select
              value={filters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
              className="input-field text-sm"
            >
              <option value="">Todas las marcas</option>
              {CAR_BRANDS.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Modelo</label>
            <input
              type="text"
              value={filters.model || ''}
              onChange={(e) => handleFilterChange('model', e.target.value || undefined)}
              placeholder="ej: Corolla, Civic"
              className="input-field text-sm"
            />
          </div>

          {/* Year Range */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">Año</label>
            <div className="grid grid-cols-1 gap-1 mb-2">
              {YEAR_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleFilterChange('min_year', range.min);
                    handleFilterChange('max_year', range.max);
                  }}
                  className="text-left px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.min_year || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseInt(value);
                  handleFilterChange('min_year', numValue);
                }}
                placeholder="Desde"
                min="1990"
                max={CURRENT_YEAR}
                className="input-field text-sm"
              />
              <input
                type="number"
                value={filters.max_year || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? undefined : parseInt(value);
                  handleFilterChange('max_year', numValue);
                }}
                placeholder="Hasta"
                min="1990"
                max={CURRENT_YEAR}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Combustible</label>
            <select
              value={filters.fuel_type || ''}
              onChange={(e) => handleFilterChange('fuel_type', e.target.value || undefined)}
              className="input-field text-sm"
            >
              <option value="">Cualquier combustible</option>
              {FUEL_TYPES.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Transmisión</label>
            <select
              value={filters.transmission || ''}
              onChange={(e) => handleFilterChange('transmission', e.target.value || undefined)}
              className="input-field text-sm"
            >
              <option value="">Cualquier transmisión</option>
              {TRANSMISSION_TYPES.map((transmission) => (
                <option key={transmission} value={transmission}>
                  {transmission}
                </option>
              ))}
            </select>
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection title="Ubicación" sectionKey="location">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
            <select
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
              className="input-field text-sm"
            >
              <option value="">Todas las ciudades</option>
              {COLOMBIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection title="Estado" sectionKey="condition">
          <div className="space-y-2">
            {VEHICLE_CONDITIONS.map((condition) => (
              <label key={condition.value} className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={filters.condition === condition.value}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{condition.label}</span>
              </label>
            ))}
            <label className="flex items-center">
              <input
                type="radio"
                name="condition"
                value=""
                checked={!filters.condition}
                onChange={() => handleFilterChange('condition', undefined)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Cualquier estado</span>
            </label>
          </div>
        </FilterSection>

        {/* Apply button */}
        <button
          onClick={onSearch}
          className="w-full btn-primary"
        >
          Aplicar Filtros ({resultsCount.toLocaleString('es-CO')} resultados)
        </button>
      </div>
    </div>
  );
} 