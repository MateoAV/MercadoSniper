import { Card } from '@/components/ui/Card'
import { formatNumber } from '@/utils/formatters'

interface ScrapingStats {
  totalPages: number
  currentPage: number
  totalVehicles: number
  newVehicles: number
  updatedVehicles: number
  startTime: Date | null
  endTime: Date | null
  status: 'idle' | 'running' | 'completed' | 'error'
  errorMessage?: string
}

interface ScrapingProgressProps {
  stats: ScrapingStats
}

export default function ScrapingProgress({ stats }: ScrapingProgressProps) {
  const progressPercentage = stats.totalPages > 0 
    ? (stats.currentPage / stats.totalPages) * 100 
    : 0

  const vehiclesPerSecond = stats.startTime 
    ? stats.totalVehicles / ((new Date().getTime() - stats.startTime.getTime()) / 1000)
    : 0

  const estimatedTimeRemaining = vehiclesPerSecond > 0 && stats.totalPages > 0
    ? ((stats.totalPages - stats.currentPage) * 48) / vehiclesPerSecond
    : 0

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Scraping Progress</h3>
      
      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Page {stats.currentPage} of {stats.totalPages}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(stats.currentPage)}
          </p>
          <p className="text-sm text-gray-500">Pages Processed</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(stats.totalVehicles)}
          </p>
          <p className="text-sm text-gray-500">Vehicles Found</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {vehiclesPerSecond > 0 ? Math.round(vehiclesPerSecond) : 0}
          </p>
          <p className="text-sm text-gray-500">Vehicles/sec</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {estimatedTimeRemaining > 0 ? Math.round(estimatedTimeRemaining) : 0}s
          </p>
          <p className="text-sm text-gray-500">Est. Remaining</p>
        </div>
      </div>

      {/* Current Activity */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-sm text-blue-800 font-medium">
            Processing page {stats.currentPage}... Found {stats.totalVehicles} vehicles so far
          </span>
        </div>
      </div>
    </Card>
  )
} 