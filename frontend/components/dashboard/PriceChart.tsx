'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

// Mock data - would come from API
const priceData = [
  { date: '2024-01-01', avgPrice: 85000000, lowestPrice: 65000000, highestPrice: 120000000 },
  { date: '2024-01-03', avgPrice: 84200000, lowestPrice: 64500000, highestPrice: 118000000 },
  { date: '2024-01-05', avgPrice: 83800000, lowestPrice: 63800000, highestPrice: 117500000 },
  { date: '2024-01-07', avgPrice: 83500000, lowestPrice: 63200000, highestPrice: 116800000 },
  { date: '2024-01-09', avgPrice: 82900000, lowestPrice: 62800000, highestPrice: 115900000 },
  { date: '2024-01-11', avgPrice: 82400000, lowestPrice: 62100000, highestPrice: 115200000 },
  { date: '2024-01-13', avgPrice: 81800000, lowestPrice: 61500000, highestPrice: 114600000 },
  { date: '2024-01-15', avgPrice: 81200000, lowestPrice: 60900000, highestPrice: 113800000 },
  { date: '2024-01-17', avgPrice: 80700000, lowestPrice: 60300000, highestPrice: 113100000 },
  { date: '2024-01-19', avgPrice: 80100000, lowestPrice: 59800000, highestPrice: 112400000 },
  { date: '2024-01-21', avgPrice: 79600000, lowestPrice: 59200000, highestPrice: 111700000 },
  { date: '2024-01-23', avgPrice: 79000000, lowestPrice: 58600000, highestPrice: 111000000 },
];

export default function PriceChart() {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {formatPrice(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Tendencia de Precios
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
            <span>Precio Promedio</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
            <span>Precio Más Bajo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-warning-500 rounded-full mr-2"></div>
            <span>Precio Más Alto</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatPrice(value).slice(0, -3) + 'M'}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#3b82f6' }}
              name="Precio Promedio"
            />
            <Line
              type="monotone"
              dataKey="lowestPrice"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
              name="Precio Más Bajo"
            />
            <Line
              type="monotone"
              dataKey="highestPrice"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              name="Precio Más Alto"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {formatPrice(59200000)}
          </div>
          <div className="text-sm text-gray-600">Precio más bajo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {formatPrice(79000000)}
          </div>
          <div className="text-sm text-gray-600">Precio promedio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600">
            {formatPrice(111000000)}
          </div>
          <div className="text-sm text-gray-600">Precio más alto</div>
        </div>
      </div>
    </div>
  );
} 