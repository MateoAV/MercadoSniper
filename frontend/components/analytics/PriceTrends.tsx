import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { formatCurrency } from '@/utils/formatters'

interface PriceTrendsProps {
  timeRange: string
  isLoading: boolean
}

export default function PriceTrends({ timeRange, isLoading }: PriceTrendsProps) {
  // Mock data - in real app, this would come from API based on timeRange
  const generateMockData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const data = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      
      const basePrice = 45000000
      const variation = Math.sin(i / 10) * 2000000 + Math.random() * 1000000 - 500000
      
      data.push({
        date: date.toLocaleDateString('es-CO', { 
          month: 'short', 
          day: 'numeric',
          ...(timeRange === '1y' || timeRange === 'all' ? { year: '2-digit' } : {})
        }),
        avgPrice: Math.round(basePrice + variation),
        minPrice: Math.round(basePrice + variation - 3000000),
        maxPrice: Math.round(basePrice + variation + 5000000),
        volume: Math.floor(Math.random() * 500) + 200
      })
    }
    
    return data
  }

  const data = generateMockData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Price range area */}
            <Area
              type="monotone"
              dataKey="maxPrice"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.1}
              name="Max Price"
            />
            <Area
              type="monotone"
              dataKey="minPrice"
              stackId="1"
              stroke="#3B82F6"
              fill="#ffffff"
              fillOpacity={1}
              name="Min Price"
            />
            
            {/* Average price line */}
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#EF4444"
              strokeWidth={3}
              dot={false}
              name="Average Price"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(Math.max(...data.map(d => d.avgPrice)))}
          </p>
          <p className="text-sm text-gray-500">Highest Average</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(Math.min(...data.map(d => d.avgPrice)))}
          </p>
          <p className="text-sm text-gray-500">Lowest Average</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(data[data.length - 1]?.avgPrice || 0)}
          </p>
          <p className="text-sm text-gray-500">Current Average</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {((data[data.length - 1]?.avgPrice - data[0]?.avgPrice) / data[0]?.avgPrice * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Period Change</p>
        </div>
      </div>
    </div>
  )
} 