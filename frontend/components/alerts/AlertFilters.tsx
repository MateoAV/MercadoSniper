'use client';

import { Filter, SortAsc, SortDesc } from 'lucide-react';

interface AlertFiltersProps {
  filters: {
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  alertsCount: number;
}

export default function AlertFilters({ filters, onFiltersChange, alertsCount }: AlertFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const statusOptions = [
    { value: 'all', label: 'Todas las alertas', count: alertsCount },
    { value: 'active', label: 'Activas', count: 0 },
    { value: 'triggered', label: 'Activadas', count: 0 },
    { value: 'inactive', label: 'Inactivas', count: 0 },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Fecha de creación' },
    { value: 'targetPrice', label: 'Precio objetivo' },
    { value: 'triggeredAt', label: 'Fecha de activación' },
  ];

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Estado:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort options */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Ordenar por:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort direction */}
          <button
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title={filters.sortOrder === 'asc' ? 'Cambiar a descendente' : 'Cambiar a ascendente'}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-5 w-5" />
            ) : (
              <SortDesc className="h-5 w-5" />
            )}
          </button>

          {/* Results count */}
          <span className="text-sm text-gray-500">
            {alertsCount} resultado{alertsCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
} 