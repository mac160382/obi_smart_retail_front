import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Download, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { getLocations } from '../features/catalogs/services/locationService'
import { SuggestedOrdersTable } from '../features/suggestedOrders/components/SuggestedOrdersTable'
import { getSuggestedOrders } from '../features/suggestedOrders/services/suggestedOrdersService'
import type { SuggestedOrder } from '../features/suggestedOrders/types/suggestedOrder'

function orderKey(order: SuggestedOrder) {
  return `${order.location}:${order.item}`
}

function escapeCsv(value: string | number | null) {
  if (value === null) return ''
  return `"${String(value).replaceAll('"', '""')}"`
}

function getSuggestedOrdersError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) return 'La ubicación o los datos de paginación no son válidos.'
    if (!error.response) return 'No fue posible conectar con el servicio de pedidos sugeridos.'
    if (error.response.status >= 500) return 'El servicio no pudo consultar los pedidos. Intenta nuevamente.'
  }
  return 'No fue posible cargar los pedidos sugeridos.'
}

export function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [adjustedValues, setAdjustedValues] = useState<Record<string, string>>({})
  const {
    data: locations,
    isPending: isLoadingLocations,
    isError: hasLocationsError,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['catalogs', 'locations'],
    queryFn: getLocations,
    staleTime: 5 * 60_000,
  })
  const cannotLoadLocations = hasLocationsError && !locations?.length
  const location = Number(selectedLocation)
  const hasValidLocation = selectedLocation !== '' && Number.isInteger(location)

  const {
    data: suggestedOrders,
    error: suggestedOrdersError,
    isPending: isPendingOrders,
    isFetching: isFetchingOrders,
    isError: hasSuggestedOrdersError,
    refetch: refetchSuggestedOrders,
  } = useQuery({
    queryKey: ['suggested-orders', location, page, pageSize],
    queryFn: () => getSuggestedOrders({ location, page, pageSize }),
    enabled: hasValidLocation,
  })

  useEffect(() => {
    if (!locations) return

    if (locations.length === 0) {
      setSelectedLocation('')
      return
    }

    setSelectedLocation((currentLocation) => {
      const locationStillExists = locations.some(
        (item) => item.location === currentLocation,
      )
      return locationStillExists ? currentLocation : locations[0].location
    })
  }, [locations])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return suggestedOrders?.items ?? []

    return (suggestedOrders?.items ?? []).filter((order) => (
      [order.item, order.descripcion_item, order.descripcion_proveedor, order.descripcion_tienda]
        .some((value) => value.toLowerCase().includes(term))
    ))
  }, [search, suggestedOrders?.items])

  const totals = useMemo(() => {
    const orders = suggestedOrders?.items ?? []
    return {
      estimated: orders.filter((order) => order.status === 'Estimado').length,
      suggested: orders.reduce((sum, order) => sum + order.sugerido, 0),
      adjusted: orders.reduce((sum, order) => {
        const key = orderKey(order)
        const currentValue = Object.prototype.hasOwnProperty.call(adjustedValues, key)
          ? adjustedValues[key]
          : order.ajustado
        return sum + (currentValue === '' || currentValue === null ? 0 : Number(currentValue))
      }, 0),
    }
  }, [adjustedValues, suggestedOrders?.items])

  function changeLocation(nextLocation: string) {
    setSelectedLocation(nextLocation)
    setPage(1)
    setSearch('')
    setAdjustedValues({})
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  function changeAdjustedValue(order: SuggestedOrder, value: string) {
    setAdjustedValues((current) => ({ ...current, [orderKey(order)]: value }))
  }

  function getAdjustedValue(order: SuggestedOrder) {
    const key = orderKey(order)
    return Object.prototype.hasOwnProperty.call(adjustedValues, key)
      ? adjustedValues[key]
      : order.ajustado ?? ''
  }

  function exportCsv() {
    const header = [
      'ESTADO', 'ITEM', 'UBICACION', 'TIENDA', 'PRODUCTO', 'PROVEEDOR', 'PREDICCION',
      'LEAD_TIME_DAYS', 'REVIEW_PERIOD_DAYS', 'UPLIFT_ESPERADO', 'MANEJO_MINIMO',
      'STOCK_ACTUAL', 'EN_TRANSITO', 'SUGERIDO_IA', 'AJUSTADO',
    ].join(',')
    const rows = filteredOrders.map((order) => [
      order.status,
      order.item,
      order.location,
      order.descripcion_tienda,
      order.descripcion_item,
      order.descripcion_proveedor,
      order.prediccion,
      order.lead_time_days,
      order.review_period_days,
      order.uplift_esperado,
      order.minimum_handling_quantity_units,
      order.current_stock_units,
      order.on_order_in_transit_units,
      order.sugerido,
      getAdjustedValue(order),
    ].map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([`${header}\n${rows}`], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`pedido-${selectedLocation || 'sin-ubicacion'}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const ordersErrorMessage = hasSuggestedOrdersError
    ? getSuggestedOrdersError(suggestedOrdersError)
    : undefined

  return <div className="app-shell">
    <Sidebar />
    <main className="main">
      <header className='topbar card'>
        <div><h1>Gestor de Pedidos</h1><p>Control de abastecimiento diario · Red de 21 locales</p></div>
        <div className='location-control'>
          <select
            aria-label='Tienda'
            value={selectedLocation}
            onChange={(event) => changeLocation(event.target.value)}
            disabled={isLoadingLocations || cannotLoadLocations || !locations?.length}
          >
            {isLoadingLocations && <option value=''>Cargando tiendas...</option>}
            {cannotLoadLocations && <option value=''>No fue posible cargar tiendas</option>}
            {!isLoadingLocations && !cannotLoadLocations && locations?.length === 0 && (
              <option value=''>No hay tiendas disponibles</option>
            )}
            {!isLoadingLocations && !cannotLoadLocations && locations && locations.length > 0 && (
              <>
                <option value='' disabled>Selecciona una tienda</option>
                {locations.map((item) => (
                  <option key={item.location} value={item.location}>
                    {item.location} - {item.descripcion_tienda}
                  </option>
                ))}
              </>
            )}
          </select>
          {cannotLoadLocations && (
            <button className='location-retry' type='button' onClick={() => void refetchLocations()}>
              Reintentar
            </button>
          )}
        </div>
      </header>
      <section className="notice card"><ShieldCheck/><div><strong>Fórmula de abastecimiento equilibrada</strong><p>Optimiza almacenamiento, disponibilidad y capital de trabajo.</p></div></section>
      <section className="ai-bar"><Sparkles/><input placeholder="Ej: aumenta leche y reduce bebidas..."/><button>Aplicar comando AI</button></section>
      <section className="stats"><div className="card"><span>Pedidos encontrados</span><strong>{suggestedOrders?.total_items ?? 0}</strong></div><div className="card"><span>Estimados en página</span><strong>{totals.estimated}</strong></div><div className="card"><span>Unidades sugeridas</span><strong>{totals.suggested.toLocaleString('es-MX')}</strong></div><div className="card"><span>Unidades ajustadas</span><strong>{totals.adjusted.toLocaleString('es-MX')}</strong></div></section>
      <section className="content-grid suggested-orders-layout">
        <div className="card catalog"><div className="catalog-head"><div><p className="eyebrow">Revisión de pedido</p><h2>Sugerido semanal inteligente</h2></div><button className="ghost" onClick={exportCsv} disabled={filteredOrders.length === 0}><Download size={16}/>Exportar CSV</button></div>
          <div className="filters suggested-orders-filters">
            <label><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar item, producto, tienda o proveedor"/></label>
            <label className='page-size-control'>Filas por página
              <select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))}>
                {[25, 50, 100, 200].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          </div>
          <SuggestedOrdersTable
            orders={filteredOrders}
            page={suggestedOrders?.page ?? page}
            pageSize={suggestedOrders?.page_size ?? pageSize}
            totalPages={suggestedOrders?.total_pages ?? 0}
            totalItems={suggestedOrders?.total_items ?? 0}
            isLoading={hasValidLocation && (isPendingOrders || isFetchingOrders)}
            errorMessage={ordersErrorMessage}
            hasLocation={hasValidLocation}
            getAdjustedValue={getAdjustedValue}
            onAdjustedChange={changeAdjustedValue}
            onPageChange={setPage}
            onRetry={() => void refetchSuggestedOrders()}
          />
        </div>
      </section>
      <footer>OBI Smart · Grupo12 · 2026</footer>
    </main>
  </div>
}
