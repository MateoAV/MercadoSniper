import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface VehicleDistributionProps {
  timeRange: string
  isLoading: boolean
}

export default function VehicleDistribution({ timeRange, isLoading }: VehicleDistributionProps) {
  // Mock data for vehicle distribution by brand
  const brandData = [
    { name: 'Toyota', value: 18.5, count: 8456, color: '#EF4444' },
    { name: 'Chevrolet', value: 15.2, count: 6943, color: '#3B82F6' },
    { name: 'Nissan', value: 12.8, count: 5847, color: '#10B981' },
    { name: 'Hyundai', value: 11.3, count: 5162, color: '#F59E0B' },
    { name: 'Kia', value: 9.7, count: 4428, color: '#8B5CF6' },
    { name: 'Mazda', value: 8.2, count: 3741, color: '#EC4899' },
    { name: 'Ford', value: 7.8, count: 3563, color: '#06B6D4' },
    { name: 'Volkswagen', value: 6.9, count: 3148, color: '#84CC16' },
    { name: 'Honda', value: 5.4, count: 2467, color: '#F97316' },
    { name: 'Otros', value: 4.2, count: 1917, color: '#6B7280' }
  ]

  // Mock data for vehicle distribution by year
  const yearData = [
    { year: '2023', count: 3245, percentage: 15.2 },
    { year: '2022', count: 4567, percentage: 21.4 },
    { year: '2021', count: 3890, percentage: 18.2 },
    { year: '2020', count: 3123, percentage: 14.6 },
    { year: '2019', count: 2845, percentage: 13.3 },
    { year: '2018', count: 2134, percentage: 10.0 },
    { year: '≤2017', count: 1567, percentage: 7.3 }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name || data.year}</p>
          <p className="text-sm text-gray-600">
            Vehículos: <span className="font-medium">{data.count?.toLocaleString() || data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Porcentaje: <span className="font-medium">{(data.value || data.percentage)?.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Brand Distribution - Pie Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Distribution by Brand</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={brandData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {brandData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Brand Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {brandData.slice(0, 6).map((brand, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded mr-2 flex-shrink-0"
                style={{ backgroundColor: brand.color }}
              />
              <span className="truncate">
                {brand.name} ({brand.value}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Year Distribution - Bar Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Distribution by Year</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
} 