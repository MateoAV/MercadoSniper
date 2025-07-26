import type { Metadata } from 'next'
import ScrapingPage from '@/components/scraping/ScrapingPage'

export const metadata: Metadata = {
  title: 'Scrape Vehicles - MercadoSniper',
  description: 'Fetch and update vehicle listings from MercadoLibre Colombia',
}

export default function Page() {
  return <ScrapingPage />
} 