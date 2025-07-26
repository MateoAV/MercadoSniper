'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

import { 
  Calendar, 
  TrendingUp, 
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  MapPin,
  Target,
  Loader2
} from 'lucide-react'
import { apiService } from '@/services/api'
import toast from 'react-hot-toast'

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

interface AnalyticsData {
  vehicleStats: any;
  priceDrops: any;
  timeSeriesSummary: any;
  recentVehicles: any;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  const timeRangeOptions = [
    { value: '7d' as TimeRange, label: '7 días' },
    { value: '30d' as TimeRange, label: '30 días' },
    { value: '90d' as TimeRange, label: '90 días' },
    { value: '1y' as TimeRange, label: '1 año' },
    { value: 'all' as TimeRange, label: 'Todo' },
  ]

  // Fetch analytics data when component mounts or time range changes
  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Convert time range to appropriate parameters
      const getDaysFromTimeRange = (range: TimeRange): number => {
        // Backend constraint: days must be between 1 and 30 (30 days max)
        switch (range) {
          case '7d': return 7
          case '30d': return 30
          case '90d': return 30    // Use max allowed (30 days)
          case '1y': return 30     // Use max allowed (30 days)
          case 'all': return 30    // Use max allowed (30 days)
          default: return 30
        }
      }

      const getHoursFromTimeRange = (range: TimeRange): number => {
        // Backend constraint: hours must be between 1 and 168 (7 days max)
        switch (range) {
          case '7d': return 24 * 7  // 168 hours (max allowed)
          case '30d': return 168    // Use max allowed (7 days of price drops)
          case '90d': return 168    // Use max allowed (7 days of price drops)
          case '1y': return 168     // Use max allowed (7 days of price drops)
          case 'all': return 168    // Use max allowed (7 days of price drops)
          default: return 168
        }
      }

      const days = getDaysFromTimeRange(timeRange)
      const hours = getHoursFromTimeRange(timeRange)

      // Fetch all available analytics data in parallel with individual error handling
      const [
        vehicleStats,
        priceDrops,
        timeSeriesSummary,
        recentVehicles
      ] = await Promise.allSettled([
        apiService.getVehicleStats(),
        apiService.getPriceDrops(hours, 20), // Get more price drops for analysis
        apiService.getTimeSeriesSummary(days),
        apiService.getRecentVehicles(50) // Get more recent vehicles for distribution analysis
      ])

      setAnalyticsData({
        vehicleStats: vehicleStats.status === 'fulfilled' ? vehicleStats.value : null,
        priceDrops: priceDrops.status === 'fulfilled' ? priceDrops.value : null,
        timeSeriesSummary: timeSeriesSummary.status === 'fulfilled' ? timeSeriesSummary.value : null,
        recentVehicles: recentVehicles.status === 'fulfilled' ? recentVehicles.value : null
      })

      // Log any failures for debugging
      if (vehicleStats.status === 'rejected') {
        console.warn('Failed to fetch vehicle stats:', vehicleStats.reason)
      }
      if (priceDrops.status === 'rejected') {
        console.warn('Failed to fetch price drops:', priceDrops.reason)
      }
      if (timeSeriesSummary.status === 'rejected') {
        console.warn('Failed to fetch time series summary:', timeSeriesSummary.reason)
      }
      if (recentVehicles.status === 'rejected') {
        console.warn('Failed to fetch recent vehicles:', recentVehicles.reason)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Error al cargar algunos datos analíticos. Los datos disponibles se mostrarán.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchAnalyticsData()
    toast.success('Datos actualizados correctamente')
  }

  const handleExport = async () => {
    try {
      if (!analyticsData) {
        toast.error('No hay datos disponibles para exportar')
        return
      }

      // Create CSV data from the analytics data
      const csvData = [
        // Headers
        ['Métrica', 'Valor', 'Fecha'],
        
        // Vehicle Stats
        ...(analyticsData.vehicleStats ? [
          ['Total Vehículos', analyticsData.vehicleStats.total_vehicles || 0, new Date().toISOString()],
          ['Vehículos Activos', analyticsData.vehicleStats.active_vehicles || 0, new Date().toISOString()],
          ['Precio Promedio', analyticsData.vehicleStats.average_price || 0, new Date().toISOString()],
        ] : []),
        
        // Price Drops
        ...(analyticsData.priceDrops ? analyticsData.priceDrops.slice(0, 10).map((drop: any, index: number) => [
          `Precio Reducido ${index + 1}`,
          `${drop.brand || 'N/A'} ${drop.model || 'N/A'}`,
          drop.updated_at || new Date().toISOString()
        ]) : [])
      ]

      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      
      // Create and download the file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `mercado_analytics_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Datos exportados correctamente')
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error)
      toast.error('Error al exportar los datos analíticos')
    }
  }

  if (isLoading && !analyticsData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando datos analíticos...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analítica</h1>
            <p className="mt-1 text-sm text-gray-500">
              Información del mercado y análisis de precios para vehículos en Colombia
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="block pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualizar
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              disabled={isLoading || !analyticsData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Vehículos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (analyticsData?.vehicleStats?.total_vehicles || 0).toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vehículos Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (analyticsData?.vehicleStats?.active_vehicles || 0).toLocaleString()
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `$${((analyticsData?.vehicleStats?.average_price || 0) / 1000000).toFixed(1)}M`
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Descuentos Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (analyticsData?.priceDrops?.length || 0)
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Price Drops */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Descuentos Recientes</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData?.priceDrops?.slice(0, 5).map((drop: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {drop.brand} {drop.model} {drop.year}
                      </p>
                      <p className="text-sm text-gray-500">{drop.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        ${(drop.price_numeric / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500">
                        {drop.percentage_drop ? `${drop.percentage_drop.toFixed(1)}% desc.` : 'Nuevo precio'}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No hay descuentos recientes</p>
                )}
              </div>
            )}
          </Card>

          {/* Vehicle Distribution by Brand */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Distribución por Marca</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData?.recentVehicles && (() => {
                  // Count vehicles by brand
                  const brandCounts = analyticsData.recentVehicles.reduce((acc: any, vehicle: any) => {
                    const brand = vehicle.brand || 'Otros'
                    acc[brand] = (acc[brand] || 0) + 1
                    return acc
                  }, {})
                  
                  // Get top 5 brands
                  const topBrands = Object.entries(brandCounts)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                  
                  const total = analyticsData.recentVehicles.length
                  
                  return topBrands.map(([brand, count]) => (
                    <div key={brand} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{brand}</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${((count as number) / total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{count}</span>
                      </div>
                    </div>
                  ))
                })() || (
                  <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                )}
              </div>
            )}
          </Card>

          {/* Time Series Summary */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Resumen Temporal ({timeRange})</h3>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : analyticsData?.timeSeriesSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData.timeSeriesSummary.total_updates || 0}
                  </p>
                  <p className="text-sm text-blue-600">Actualizaciones</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.timeSeriesSummary.price_changes || 0}
                  </p>
                  <p className="text-sm text-green-600">Cambios de Precio</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    ${((analyticsData.timeSeriesSummary.avg_price || 0) / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-purple-600">Precio Promedio</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay datos de series temporales disponibles</p>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 