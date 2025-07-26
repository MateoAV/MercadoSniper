'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Vehicle } from '@/types';
import { formatCurrency, formatMileage, formatRelativeTime } from '@/utils/formatters';
import { 
  ExternalLink, 
  Plus, 
  Check, 
  MapPin, 
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Star,
  Eye
} from 'lucide-react';
import Image from 'next/image';

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

interface VehicleCardProps {
  vehicle: Vehicle;
  onTrackVehicle: () => Promise<void>;
}

export default function VehicleCard({ vehicle, onTrackVehicle }: VehicleCardProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isTracked, setIsTracked] = useState(vehicle.tracking_count ? vehicle.tracking_count > 0 : false);

  const handleTrackVehicle = async () => {
    if (isTracked) return;
    
    setIsTracking(true);
    try {
      await onTrackVehicle();
      setIsTracked(true);
    } catch (error) {
      console.error('Error tracking vehicle:', error);
    } finally {
      setIsTracking(false);
    }
  };

  const getConditionBadge = () => {
    if (vehicle.additional_info?.condition === 'new') {
      return <span className="badge-success">Nuevo</span>;
    }
    return <span className="badge-primary">Usado</span>;
  };

  const getFuelIcon = () => {
    switch (vehicle.fuel_type?.toLowerCase()) {
      case 'eléctrico':
      case 'electrico':
        return '⚡';
      case 'híbrido':
      case 'hibrido':
        return '🔋';
      case 'diésel':
      case 'diesel':
        return '⛽';
      default:
        return '⛽';
    }
  };

  const getTransmissionIcon = () => {
    return vehicle.transmission?.toLowerCase().includes('manual') ? '🚗' : '🚙';
  };

  // Calculate if there's a price drop (if we have historical data)
  const currentPrice = vehicle.price_numeric || 0;
  const originalPrice = vehicle.additional_info?.original_price || currentPrice;
  const hasPriceDrop = originalPrice > currentPrice;
  const priceDropPercentage = hasPriceDrop 
    ? ((originalPrice - currentPrice) / originalPrice) * 100 
    : 0;

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      {/* Vehicle image */}
      <div className="relative mb-4">
        {vehicle.image_url && isValidImageUrl(vehicle.image_url) ? (
          <div className="w-full h-48 rounded-lg overflow-hidden">
            <Image 
              src={vehicle.image_url} 
              alt={vehicle.title} 
              width={400} 
              height={300}
              className="w-full h-full object-cover"
              onError={() => {
                console.warn('Failed to load image:', vehicle.image_url);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🚗</div>
                <span className="text-gray-600 text-sm">Sin imagen</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Condition badge */}
        <div className="absolute top-3 left-3">
          {getConditionBadge()}
        </div>
        
        {/* Price drop badge */}
        {hasPriceDrop && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-danger-500 text-white">
              -{priceDropPercentage.toFixed(0)}%
            </span>
          </div>
        )}

        {/* Tracking status */}
        {isTracked && (
          <div className="absolute bottom-3 left-3">
            <span className="badge-success flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Siguiendo
            </span>
          </div>
        )}
      </div>

      {/* Vehicle info */}
      <div className="space-y-3">
        {/* Title and brand */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {vehicle.title}
          </h3>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <span className="font-medium">{vehicle.brand}</span>
            {vehicle.year && (
              <>
                <span className="mx-2">•</span>
                <span>{vehicle.year}</span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentPrice)}
            </div>
            {hasPriceDrop && (
              <div className="text-right">
                <div className="text-sm text-gray-500 line-through">
                  {formatCurrency(originalPrice)}
                </div>
                <div className="text-sm font-medium text-success-600">
                  Ahorro: {formatCurrency(originalPrice - currentPrice)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {vehicle.kilometers && (
            <div className="flex items-center text-gray-600">
              <Gauge className="h-4 w-4 mr-2 text-gray-400" />
              <span>{formatMileage(vehicle.kilometers)}</span>
            </div>
          )}
          
          {vehicle.fuel_type && (
            <div className="flex items-center text-gray-600">
              <span className="mr-2">{getFuelIcon()}</span>
              <span>{vehicle.fuel_type}</span>
            </div>
          )}
          
          {vehicle.transmission && (
            <div className="flex items-center text-gray-600">
              <span className="mr-2">{getTransmissionIcon()}</span>
              <span>{vehicle.transmission}</span>
            </div>
          )}
          
          {vehicle.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}
        </div>

        {/* Features (if available) */}
        {vehicle.additional_info?.features && vehicle.additional_info.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Características destacadas:</h4>
            <div className="flex flex-wrap gap-1">
              {vehicle.additional_info.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {feature}
                </span>
              ))}
              {vehicle.additional_info.features.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  +{vehicle.additional_info.features.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Seller info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
              <span className="text-xs">{vehicle.additional_info?.seller?.charAt(0) || 'V'}</span>
            </div>
            <span>{vehicle.additional_info?.seller || 'Vendedor'}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{vehicle.updated_at ? formatRelativeTime(new Date(vehicle.updated_at)) : 'Reciente'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-3 border-t border-gray-200">
          <Link
            href={vehicle.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-secondary flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver en ML
          </Link>
          
          <Link
            href={`/vehicles/${vehicle._id || vehicle.mercadolibre_id}`}
            className="btn-secondary flex items-center justify-center"
          >
            <Eye className="h-4 w-4" />
          </Link>
          
          <button
            onClick={handleTrackVehicle}
            disabled={isTracking || isTracked}
            className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
              isTracked
                ? 'bg-success-100 text-success-700 cursor-default'
                : 'btn-primary'
            }`}
          >
            {isTracking ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isTracked ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Siguiendo
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Seguir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 