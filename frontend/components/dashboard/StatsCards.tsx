'use client';

import { Car, Bell, TrendingDown, DollarSign } from 'lucide-react';

interface StatCard {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
}

const stats: StatCard[] = [
  {
    name: 'Vehículos Seguidos',
    value: '12',
    change: '+2 esta semana',
    changeType: 'increase',
    icon: Car,
  },
  {
    name: 'Alertas Activas',
    value: '8',
    change: 'Sin cambios',
    changeType: 'neutral',
    icon: Bell,
  },
  {
    name: 'Bajadas de Precio Hoy',
    value: '3',
    change: '+1 desde ayer',
    changeType: 'increase',
    icon: TrendingDown,
  },
  {
    name: 'Ahorro Total',
    value: '$2.450.000',
    change: '+$320.000 este mes',
    changeType: 'increase',
    icon: DollarSign,
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon
                className="h-8 w-8 text-primary-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span
                className={`font-medium ${
                  stat.changeType === 'increase'
                    ? 'text-success-600'
                    : stat.changeType === 'decrease'
                    ? 'text-danger-600'
                    : 'text-gray-500'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 