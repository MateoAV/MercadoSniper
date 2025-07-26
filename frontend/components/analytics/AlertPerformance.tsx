import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { formatNumber, formatPercentage } from '@/utils/formatters'

interface AlertPerformanceProps {
  timeRange: string
  isLoading: boolean
}

export default function AlertPerformance({ timeRange, isLoading }: AlertPerformanceProps) {
  // Mock data for alert triggers over time
  const alertTriggersData = [
    { date: 'Ene 20', triggered: 45, total: 120 },
    { date: 'Ene 21', triggered: 52, total: 125 },
    { date: 'Ene 22', triggered: 38, total: 130 },
    { date: 'Ene 23', triggered: 67, total: 135 },
    { date: 'Ene 24', triggered: 78, total: 140 },
    { date: 'Ene 25', triggered: 84, total: 145 },
    { date: 'Ene 26', triggered: 92, total: 150 }
  ]

  // Mock data for alert type distribution
  const alertTypeData = [
    { name: 'Price Drop', value: 45.2, count: 847, color: '#EF4444' },
    { name: 'Target Price', value: 38.6, count: 723, color: '#3B82F6' },
    { name: 'New Listing', value: 16.2, count: 304, color: '#10B981' }
  ]

  // Performance metrics
  const metrics = [
    {
      label: 'Success Rate',
      value: '68.4%',
      change: '+3.2%',
      trend: 'up'
    },
    {
      label: 'Avg Response Time',
      value: '2.3 min',
      change: '-0.5 min',
      trend: 'up'
    },
    {
      label: 'Total Triggers',
      value: '1,874',
      change: '+12.5%',
      trend: 'up'
    },
    {
      label: 'False Positives',
      value: '4.2%',
      change: '-1.1%',
      trend: 'up'
    }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const successRate = ((data.triggered / data.total) * 100).toFixed(1)
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-gray-600">
            Triggered: <span className="font-medium text-orange-600">{data.triggered}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total: <span className="font-medium text-blue-600">{data.total}</span>
          </p>
          <p className="text-sm text-gray-600">
            Success Rate: <span className="font-medium text-green-600">{successRate}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.value.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <p className="text-lg font-bold text-gray-900">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.label}</p>
            <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {metric.change}
            </p>
          </div>
        ))}
      </div>

      {/* Alert Triggers Over Time */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Triggers Over Time</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={alertTriggersData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="triggered"
                stackId="2"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Type Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Type Distribution</h4>
        <div className="flex items-center space-x-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {alertTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-2">
            {alertTypeData.map((type, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{type.count}</span>
                  <span className="text-gray-500 ml-1">({type.value.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 