import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ExternalLink, Car, MapPin, Calendar, Gauge } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface VehicleData {
  title: string
  price: string
  link: string
  year: string
  kilometers: string
  location: string
  image_url: string
}

interface ScrapingResultsProps {
  data: VehicleData[]
}

export default function ScrapingResults({ data }: ScrapingResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data based on search term
  const filteredData = data.filter(vehicle => 
    vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    document.getElementById('scraping-results')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Card className="p-6" id="scraping-results">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Scraping Results ({formatNumber(filteredData.length)} vehicles)
        </h3>
        
        {/* Search */}
        <div className="mt-4 sm:mt-0 sm:w-72">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page when searching
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {currentData.map((vehicle, index) => (
          <div key={startIndex + index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex space-x-4">
              {/* Vehicle Image */}
              <div className="flex-shrink-0">
                <img
                  src={vehicle.image_url}
                  alt={vehicle.title}
                  className="w-24 h-20 object-cover rounded-lg bg-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-car.jpg' // Fallback image
                  }}
                />
              </div>

              {/* Vehicle Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate mb-2">
                  {vehicle.title}
                </h4>
                
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <Car className="h-3 w-3 mr-1" />
                    <span className="mr-3">{vehicle.year}</span>
                    <Gauge className="h-3 w-3 mr-1" />
                    <span>{vehicle.kilometers}</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{vehicle.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      ${formatNumber(parseInt(vehicle.price.replace(/\D/g, '') || '0'))}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(vehicle.link, '_blank')}
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No vehicles have been scraped yet.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{startIndex + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredData.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{filteredData.length}</span>
                {' '}results
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-r-none"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      variant={currentPage === pageNumber ? 'primary' : 'outline'}
                      size="sm"
                      className="rounded-none"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="rounded-l-none"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
} 