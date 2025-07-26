'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TrendingDown, ExternalLink, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Mock data - would come from API
const recentPriceDrops = [
  {
    id: '1',
    title: 'Toyota Corolla Cross XEI 2021',
    brand: 'Toyota',
    model: 'Corolla Cross',
    year: 2021,
    currentPrice: 89500000,
    previousPrice: 92000000,
    priceChange: -2500000,
    percentageChange: -2.7,
    imageUrl: '/api/placeholder/300/200',
    location: 'Bogotá, D.C.',
    mileage: 45000,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    url: 'https://carro.mercadolibre.com.co/MCO-example',
  },
  {
    id: '2',
    title: 'Mazda CX-5 Grand Touring 2020',
    brand: 'Mazda',
    model: 'CX-5',
    year: 2020,
    currentPrice: 78900000,
    previousPrice: 81500000,
    priceChange: -2600000,
    percentageChange: -3.2,
    imageUrl: '/api/placeholder/300/200',
    location: 'Medellín, Antioquia',
    mileage: 62000,
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    url: 'https://carro.mercadolibre.com.co/MCO-example-2',
  },
  {
    id: '3',
    title: 'Honda CR-V EXL 2019',
    brand: 'Honda',
    model: 'CR-V',
    year: 2019,
    currentPrice: 72300000,
    previousPrice: 74800000,
    priceChange: -2500000,
    percentageChange: -3.3,
    imageUrl: '/api/placeholder/300/200',
    location: 'Cali, Valle del Cauca',
    mileage: 58000,
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    url: 'https://carro.mercadolibre.com.co/MCO-example-3',
  },
];

export default function RecentPriceDrops() {
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

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingDown className="h-5 w-5 text-success-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Bajadas de Precio Recientes
          </h2>
        </div>
        <Link
          href="/vehicles?filter=price_drops"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todas
        </Link>
      </div>

      <div className="space-y-4">
        {recentPriceDrops.map((vehicle) => (
          <div
            key={vehicle.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Sin imagen</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {vehicle.title}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{vehicle.year}</span>
                      <span>•</span>
                      <span>{formatMileage(vehicle.mileage)} km</span>
                      <span>•</span>
                      <span>{vehicle.location}</span>
                    </div>
                  </div>
                  
                  <Link
                    href={vehicle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(vehicle.currentPrice)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(vehicle.previousPrice)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      {vehicle.percentageChange.toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium text-success-600">
                      {formatPrice(Math.abs(vehicle.priceChange))}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Actualizado {formatDistanceToNow(vehicle.lastUpdated, { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 