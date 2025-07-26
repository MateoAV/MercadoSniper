import { Card } from '@/components/ui/Card'
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  DollarSign, 
  Bell, 
  Users,
  Percent,
  Clock
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters'

interface MarketOverviewProps {
  timeRange: string
  isLoading: boolean
}

export default function MarketOverview({ timeRange, isLoading }: MarketOverviewProps) {
  // Mock data - in real app, this would come from API based on timeRange
  const metrics = [
    {
      title: 'Total Vehicles',
      value: '45,623',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Car,
      color: 'blue'
    },
    {
      title: 'Average Price',
      value: '$45,200,000',
      change: '-2.3%',
      trend: 'down' as const,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Active Alerts',
      value: '1,847',
      change: '+8.7%',
      trend: 'up' as const,
      icon: Bell,
      color: 'orange'
    },
    {
      title: 'Price Drops',
      value: '2,156',
      change: '+15.2%',
      trend: 'up' as const,
      icon: TrendingDown,
      color: 'red'
    },
    {
      title: 'Success Rate',
      value: '68.4%',
      change: '+3.1%',
      trend: 'up' as const,
      icon: Percent,
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: '3,429',
      change: '+23.1%',
      trend: 'up' as const,
      icon: Users,
      color: 'indigo'
    }
  ]

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600'
    }
    return colors[color as keyof typeof colors] || 'text-gray-600'
  }

  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? TrendingUp : TrendingDown
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mt-4 h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon
        const TrendIcon = getTrendIcon(metric.trend)
        
        return (
          <Card key={index} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${getIconColor(metric.color)}`}>
                <IconComponent className="h-8 w-8" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor(metric.trend)}`} />
              <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                vs last period
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
} 