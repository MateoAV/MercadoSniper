import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { MapPin } from 'lucide-react'
import { formatNumber } from '@/utils/formatters'

interface GeographicAnalysisProps {
  timeRange: string
  isLoading: boolean
}

export default function GeographicAnalysis({ timeRange, isLoading }: GeographicAnalysisProps) {
  // Mock data for geographic distribution
  const cityData = [
    { city: 'Bogotá', count: 12847, percentage: 28.2, avgPrice: 48500000 },
    { city: 'Medellín', count: 8934, percentage: 19.6, avgPrice: 42300000 },
    { city: 'Cali', count: 6723, percentage: 14.8, avgPrice: 39800000 },
    { city: 'Barranquilla', count: 4562, percentage: 10.0, avgPrice: 41200000 },
    { city: 'Cartagena', count: 3421, percentage: 7.5, avgPrice: 45600000 },
    { city: 'Bucaramanga', count: 2845, percentage: 6.2, avgPrice: 38900000 },
    { city: 'Pereira', count: 2134, percentage: 4.7, avgPrice: 37500000 },
    { city: 'Manizales', count: 1823, percentage: 4.0, avgPrice: 36800000 },
    { city: 'Ibagué', count: 1567, percentage: 3.4, avgPrice: 35200000 },
    { city: 'Otras', count: 812, percentage: 1.8, avgPrice: 34100000 }
  ]

  // Top 5 cities for the bar chart
  const topCities = cityData.slice(0, 5)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.city}</p>
          <p className="text-sm text-gray-600">
            Vehicles: <span className="font-medium text-blue-600">{data.count.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium text-green-600">{data.percentage}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Avg Price: <span className="font-medium text-orange-600">
              ${(data.avgPrice / 1000000).toFixed(1)}M
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Cities Bar Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Top 5 Cities by Vehicle Count</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCities} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="city"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed City List */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">All Cities Distribution</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cityData.map((city, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mr-3">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{city.city}</p>
                  <p className="text-xs text-gray-500">
                    ${(city.avgPrice / 1000000).toFixed(1)}M avg
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatNumber(city.count)}
                </p>
                <p className="text-xs text-gray-500">{city.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Insights */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Regional Insights</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Bogotá leads with 28.2% of all vehicle listings</li>
              <li>• Coastal cities (Barranquilla, Cartagena) show higher average prices</li>
              <li>• Coffee region cities offer the most affordable options</li>
              <li>• Urban centers have 3x more listings than smaller cities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 