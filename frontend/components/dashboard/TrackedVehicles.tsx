'use client';

import Link from 'next/link';
import { Car, ExternalLink, Eye, Trash2 } from 'lucide-react';

// Mock data - would come from API
const trackedVehicles = [
  {
    id: '1',
    title: 'Ford Escape Titanium 2020',
    brand: 'Ford',
    model: 'Escape',
    year: 2020,
    currentPrice: 85600000,
    mileage: 38000,
    location: 'Bogotá, D.C.',
    isTracking: true,
    url: 'https://carro.mercadolibre.com.co/MCO-example-1',
    addedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'Volkswagen Tiguan Comfortline 2021',
    brand: 'Volkswagen',
    model: 'Tiguan',
    year: 2021,
    currentPrice: 92300000,
    mileage: 42000,
    location: 'Medellín, Antioquia',
    isTracking: true,
    url: 'https://carro.mercadolibre.com.co/MCO-example-2',
    addedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    title: 'Hyundai Tucson Limited 2021',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2021,
    currentPrice: 88900000,
    mileage: 35000,
    location: 'Cali, Valle del Cauca',
    isTracking: true,
    url: 'https://carro.mercadolibre.com.co/MCO-example-3',
    addedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    title: 'Renault Koleos Intens 2020',
    brand: 'Renault',
    model: 'Koleos',
    year: 2020,
    currentPrice: 79800000,
    mileage: 48000,
    location: 'Barranquilla, Atlántico',
    isTracking: true,
    url: 'https://carro.mercadolibre.com.co/MCO-example-4',
    addedAt: new Date('2024-01-12'),
  },
];

export default function TrackedVehicles() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('es-CO').format(mileage);
  };

  const handleRemoveTracking = (vehicleId: string) => {
    // Handle remove tracking logic
    console.log('Remove tracking for vehicle:', vehicleId);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Car className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Vehículos Seguidos
          </h2>
        </div>
        <Link
          href="/vehicles"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-4">
        {trackedVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {vehicle.title}
                </h3>
                
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span>{vehicle.year}</span>
                  <span>•</span>
                  <span>{formatMileage(vehicle.mileage)} km</span>
                </div>
                
                <div className="mt-1 text-xs text-gray-500">
                  {vehicle.location}
                </div>
                
                <div className="mt-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPrice(vehicle.currentPrice)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                
                <Link
                  href={vehicle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                  title="Ver en MercadoLibre"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                
                <button
                  onClick={() => handleRemoveTracking(vehicle.id)}
                  className="text-gray-400 hover:text-danger-600 transition-colors"
                  title="Dejar de seguir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Seguimiento activo
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/search"
          className="w-full btn-secondary text-center block"
        >
          Agregar Más Vehículos
        </Link>
      </div>
    </div>
  );
} 