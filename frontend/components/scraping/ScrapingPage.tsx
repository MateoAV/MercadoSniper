'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import ScrapingProgress from './ScrapingProgress'
import ScrapingResults from './ScrapingResults'
import { 
  Download, 
  Play, 
  Square, 
  RefreshCw,
  Database,
  TrendingUp,
  Clock,
  MapPin,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatNumber, formatRelativeTime } from '@/utils/formatters'
import { apiService } from '@/services/api'
import { websocketService } from '@/services/websocket'
import { ScrapingJob, ScrapingJobStatus, ScrapingJobType, ScrapingStats, Vehicle } from '@/types'
import toast from 'react-hot-toast'

export default function ScrapingPage() {
  const [activeJob, setActiveJob] = useState<ScrapingJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([])
  const [scrapingStats, setScrapingStats] = useState<ScrapingStats | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [maxPages, setMaxPages] = useState<number>(50)

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()

    // Subscribe to scraping job updates
    console.log('🔍 DEBUG: Setting up WebSocket listener for scraping_job_update')
    websocketService.on('scraping_job_update', handleScrapingJobUpdate)

    return () => {
      console.log('🔍 DEBUG: Cleaning up WebSocket listener')
      websocketService.off('scraping_job_update', handleScrapingJobUpdate)
    }
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Get recent scraping jobs
      const jobs = await apiService.getScrapingJobs({ limit: 5 })
      setRecentJobs(jobs || [])

      // Check if there's an active job
      const runningJobs = jobs.filter(job => job.status === 'running')
      if (runningJobs.length > 0) {
        setActiveJob(runningJobs[0])
        // Subscribe to updates for this job
        if (runningJobs[0]._id) {
          websocketService.subscribeToScrapingJob(runningJobs[0]._id)
        }
      }

      // Get scraping stats
      const stats = await apiService.getScrapingStats()
      setScrapingStats(stats)

      // Get recent vehicles
      await fetchRecentVehicles()
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Error al cargar los datos de scraping')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const recentVehicles = await apiService.getRecentVehicles(20)
      setVehicles(recentVehicles || [])
    } catch (error) {
      console.error('Error fetching recent vehicles:', error)
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleScrapingJobUpdate = (data: { job: any } | any) => {
    console.log('🔍 DEBUG: Received scraping job update:', data)
    console.log('🔍 DEBUG: Data type:', typeof data)
    console.log('🔍 DEBUG: Data keys:', Object.keys(data))
    console.log('🔍 DEBUG: Has job property:', 'job' in data)
    console.log('🔍 DEBUG: Job object:', data.job)
    console.log('🔍 DEBUG: Job object keys:', data.job ? Object.keys(data.job) : 'null')
    
    // Handle both formats: { job: {...} } and direct {...}
    const rawUpdate = data.job || data
    console.log('🔍 DEBUG: Raw update:', rawUpdate)

    // Map the WebSocket data to the ScrapingJob interface
    const currentPage = rawUpdate.current_page || 0
    const vehiclesSaved = rawUpdate.vehicles_saved || 0
    
    // Calculate progress based on vehicles found, not pages
    let progressPercentage: number
    let estimatedTotal: number
    
    if (rawUpdate.status === 'completed' || rawUpdate.status === 'failed') {
      progressPercentage = 100
      estimatedTotal = vehiclesSaved
    } else {
      // Use the most recent completed job as baseline (95% of progress)
      const lastCompletedJob = recentJobs.find(job => job.status === 'completed' && job.successful_items)
      const baselineVehicles = lastCompletedJob?.successful_items || 3000 // Fallback to reasonable estimate
      
      if (vehiclesSaved <= baselineVehicles) {
        // We're still within the expected range, scale to 95%
        progressPercentage = Math.round((vehiclesSaved / baselineVehicles) * 95)
        estimatedTotal = baselineVehicles
      } else {
        // We've exceeded the baseline, use the remaining 5% for excess
        const excess = vehiclesSaved - baselineVehicles
        const excessProgress = Math.min((excess / (baselineVehicles * 0.2)) * 5, 5) // Cap excess at 5%
        progressPercentage = Math.round(95 + excessProgress)
        estimatedTotal = vehiclesSaved + Math.round(vehiclesSaved * 0.1) // Estimate 10% more might come
      }
      
      // Cap at 99% while running
      progressPercentage = Math.min(progressPercentage, 99)
    }
    
    const updatedJob: ScrapingJob = {
      _id: rawUpdate._id,
      job_type: 'bulk_listings' as ScrapingJobType,
      status: rawUpdate.status as ScrapingJobStatus,
      parameters: { max_pages: maxPages },
      total_items: estimatedTotal,
      processed_items: vehiclesSaved,
      successful_items: rawUpdate.vehicles_saved || 0,
      failed_items: 0,
      progress_percentage: progressPercentage,
      results: {
        vehicles_found: rawUpdate.vehicles_found || 0,
        vehicles_saved: rawUpdate.vehicles_saved || 0,
        current_url: rawUpdate.current_url || '',
        message: rawUpdate.message || '',
        current_page: currentPage
      },
      error_message: rawUpdate.error_message || null,
      created_at: activeJob?.created_at || new Date().toISOString(),
      started_at: activeJob?.started_at || new Date().toISOString(),
      completed_at: rawUpdate.status === 'completed' ? new Date().toISOString() : (activeJob?.completed_at || null),
      estimated_completion: null
    }

    console.log('🔍 DEBUG: Progress calculation - Vehicles saved:', vehiclesSaved, 'Estimated total:', estimatedTotal, 'Progress:', progressPercentage + '%')

    console.log('🔍 DEBUG: Mapped job:', updatedJob)

    // Update the active job if it's the same one OR if we don't have an active job but this is a running job
    console.log('🔍 DEBUG: Active job ID:', activeJob?._id)
    console.log('🔍 DEBUG: Updated job ID:', updatedJob._id)
    console.log('🔍 DEBUG: IDs match:', activeJob?._id === updatedJob._id)
    console.log('🔍 DEBUG: Active job exists:', !!activeJob)
    console.log('🔍 DEBUG: Job is running:', updatedJob.status === 'running')
    
    if ((activeJob && activeJob._id === updatedJob._id) || 
        (!activeJob && updatedJob.status === 'running')) {
      console.log('🔍 DEBUG: Updating active job:', updatedJob)
      setActiveJob(updatedJob)

      // If job completed or failed, handle completion
      if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
        // Show notification
        if (updatedJob.status === 'completed') {
          toast.success(`Scraping completado: ${updatedJob.successful_items} vehículos procesados`)
        } else {
          toast.error(`Error en scraping: ${updatedJob.error_message || 'Error desconocido'}`)
        }
        
        // Clear active job after a short delay to show the completed state
        setTimeout(() => {
          setActiveJob(null)
          fetchInitialData()
        }, 3000)
        
        // Unsubscribe from this job
        if (updatedJob._id) {
          websocketService.unsubscribeFromScrapingJob(updatedJob._id)
        }
      }
    }

    // Update the job in the recent jobs list
    setRecentJobs(prev => 
      prev.map(job => job._id === updatedJob._id ? updatedJob : job)
    )
  }

  const startScraping = async () => {
    try {
      console.log('🔍 DEBUG: startScraping function called!')
      console.log('🔍 DEBUG: Starting scraping with maxPages:', maxPages)
      const response = await apiService.startBulkScraping(maxPages)
      console.log('🔍 DEBUG: Scraping response:', response)
      
      if (response && response.job_id) {
        // Unsubscribe from any previous job
        if (activeJob && activeJob._id) {
          websocketService.unsubscribeFromScrapingJob(activeJob._id)
        }
        
        // Create a job object from the response
        const newJob: ScrapingJob = {
          _id: response.job_id,
          job_type: 'bulk_listings' as ScrapingJobType,
          status: 'running' as ScrapingJobStatus,
          parameters: { max_pages: maxPages },
          total_items: 0,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          progress_percentage: 0,
          results: {},
          error_message: null,
          created_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          completed_at: null,
          estimated_completion: null
        }
        
        console.log('🔍 DEBUG: Setting active job to:', newJob._id)
        setActiveJob(newJob)
        
        // Subscribe to updates for this job
        websocketService.subscribeToScrapingJob(response.job_id)
        
        toast.success('Scraping iniciado correctamente')
        
        // Add the new job to recent jobs
        setRecentJobs(prev => [newJob, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Error starting scraping:', error)
      toast.error('Error al iniciar el scraping')
    }
  }

  const stopScraping = async () => {
    if (!activeJob || !activeJob._id) return
    
    try {
      await apiService.cancelScrapingJob(activeJob._id)
      toast.success('Trabajo de scraping cancelado')
      
      // Update the job status locally
      setActiveJob(prev => prev ? { ...prev, status: 'cancelled' as ScrapingJobStatus } : null)
      
      // Refresh data
      fetchInitialData()
    } catch (error) {
      console.error('Error cancelling scraping job:', error)
      toast.error('Error al cancelar el trabajo de scraping')
    }
  }

  const handleMaxPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setMaxPages(Math.min(value, 200)) // Limit to 200 pages
    }
  }

  const downloadCSV = () => {
    if (vehicles.length === 0) return

    const headers = ['title', 'price', 'url', 'year', 'kilometers', 'location', 'brand', 'model', 'mercadolibre_id']
    const csvContent = [
      headers.join(','),
      ...vehicles.map(vehicle => 
        headers.map(header => {
          const value = vehicle[header as keyof Vehicle]
          return `"${value ? String(value).replace(/"/g, '""') : ''}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `vehicles_export_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Cargando información de scraping...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Scraping de Vehículos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Obtener y actualizar listados de vehículos desde MercadoLibre Colombia
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {!activeJob || activeJob.status !== 'running' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={maxPages}
                  onChange={handleMaxPagesChange}
                  min="1"
                  max="200"
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  placeholder="Páginas"
                />
                <Button
                  onClick={startScraping}
                  className="btn-primary"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Scraping
                </Button>
              </div>
            ) : (
              <Button
                onClick={stopScraping}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Square className="h-4 w-4 mr-2" />
                Detener
              </Button>
            )}

            {vehicles.length > 0 && (
              <Button
                onClick={downloadCSV}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Vehículos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scrapingStats?.total_vehicles_scraped ? formatNumber(scrapingStats.total_vehicles_scraped) : '0'}
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
                <p className="text-sm font-medium text-gray-500">Trabajos Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scrapingStats?.completed_jobs ? formatNumber(scrapingStats.completed_jobs) : '0'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCw className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trabajos Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scrapingStats?.running_jobs ? formatNumber(scrapingStats.running_jobs) : '0'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Último Scraping</p>
                <p className="text-lg font-bold text-gray-900">
                  {scrapingStats?.last_scraping_time 
                    ? formatRelativeTime(new Date(scrapingStats.last_scraping_time))
                    : 'Nunca'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Job Progress */}
        {activeJob && activeJob.status === 'running' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso del Scraping</h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso: {activeJob.progress_percentage?.toFixed(1)}%</span>
                <span>{activeJob.successful_items} vehículos guardados</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${activeJob.progress_percentage || 0}%` }}
                ></div>
              </div>
              {activeJob.results?.current_page && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Página actual: {activeJob.results.current_page}</span>
                  <span>Encontrados: {activeJob.results?.vehicles_found || 0}</span>
                </div>
              )}
            </div>
            

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Tiempo Transcurrido</p>
                <p className="text-gray-900">
                  {activeJob.started_at 
                    ? `${Math.round((new Date().getTime() - new Date(activeJob.started_at).getTime()) / 1000)}s`
                    : '0s'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Elementos Exitosos</p>
                <p className="text-green-600 font-medium">{activeJob.successful_items || 0}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Elementos Fallidos</p>
                <p className="text-red-600 font-medium">{activeJob.failed_items || 0}</p>
              </div>
            </div>
            
            {activeJob.estimated_completion && (
              <div className="mt-4 text-sm">
                <p className="font-medium text-gray-700">Finalización Estimada</p>
                <p className="text-gray-900">
                  {formatRelativeTime(new Date(activeJob.estimated_completion))}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trabajos Recientes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elementos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentJobs.map((job, index) => (
                    <tr key={job._id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.job_type === 'bulk_listings' ? 'Listados' : 
                         job.job_type === 'single_vehicle' ? 'Vehículo Único' : 
                         job.job_type === 'price_update' ? 'Actualización de Precios' : 
                         job.job_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${job.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {job.status === 'completed' ? 'Completado' :
                           job.status === 'running' ? 'En Progreso' :
                           job.status === 'failed' ? 'Fallido' :
                           job.status === 'cancelled' ? 'Cancelado' :
                           job.status === 'pending' ? 'Pendiente' :
                           job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.successful_items || 0} / {job.total_items || '?'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.started_at ? formatRelativeTime(new Date(job.started_at)) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.completed_at ? formatRelativeTime(new Date(job.completed_at)) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Recent Vehicles */}
        {vehicles.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Vehículos Recientes</h3>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={fetchRecentVehicles}
                disabled={loadingVehicles}
              >
                {loadingVehicles ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id || vehicle.mercadolibre_id}>
                      <td className="px-6 py-4 text-sm">
                        <a 
                          href={vehicle.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-900 hover:underline"
                        >
                          {vehicle.title}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(vehicle.price_numeric || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.year || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.updated_at ? formatRelativeTime(new Date(vehicle.updated_at)) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {activeJob && activeJob.status === 'failed' && activeJob.error_message && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error en el trabajo de scraping</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{activeJob.error_message}</p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}