import { Metadata } from 'next';
import SearchPage from '@/components/search/SearchPage';

export const metadata: Metadata = {
  title: 'Buscar Vehículos - MercadoSniper',
  description: 'Busca y rastrea vehículos en MercadoLibre Colombia. Encuentra las mejores ofertas y recibe alertas de precios.',
};

export default function SearchPageRoute() {
  return <SearchPage />;
} 