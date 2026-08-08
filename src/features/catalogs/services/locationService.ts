import { apiClient } from '../../../lib/api/client'
import type { LocationCatalogItem } from '../types/location'

export async function getLocations(): Promise<LocationCatalogItem[]> {
  const { data } = await apiClient.get<LocationCatalogItem[]>('/catalogs/locations')
  return data
}
