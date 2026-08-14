import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AlertTriangle, Archive, Boxes, BrainCircuit, CalendarDays, Calculator, Clock3, Download, PackageCheck, Search, ShieldCheck, Sparkles, SlidersHorizontal, TrendingDown } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { getLocations } from '../features/catalogs/services/locationService'
import { SuggestedOrdersTable } from '../features/suggestedOrders/components/SuggestedOrdersTable'
import { getSuggestedOrders } from '../features/suggestedOrders/services/suggestedOrdersService'
import { downloadSuggestedOrdersReport } from '../features/suggestedOrders/services/suggestedOrdersReportService'
import type { SuggestedOrder } from '../features/suggestedOrders/types/suggestedOrder'
import { useAuthStore } from '../features/auth/store/authStore'

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

function DemandForecastChart({ weeklyUnits }: { weeklyUnits: number }) {
  const values = [7, 15, 30].map((days) => Math.round(weeklyUnits * days / 7))
  const maximum = Math.max(...values, 1)
  const axisMaximum = Math.ceil(maximum / 100) * 100
  const xPositions = [90, 300, 510]
  const yPosition = (value: number) => 190 - (value / axisMaximum) * 135
  const points = values.map((value, index) => `${xPositions[index]},${yPosition(value)}`).join(' ')
  const areaPoints = `90,190 ${points} 510,190`

  return (
    <section className='card demand-forecast-card' aria-labelledby='demand-forecast-title'>
      <div className='forecast-heading'>
        <div className='forecast-title'><span className='forecast-icon'><BrainCircuit size={20}/></span><div><h2 id='demand-forecast-title'>Pronóstico de demanda (IA)</h2><p>Proyección basada en las unidades sugeridas</p></div></div>
        <span className='forecast-period'>Próximos 30 días</span>
      </div>
      <div className='forecast-chart-wrap'>
        <svg className='forecast-chart' viewBox='0 0 560 235' role='img' aria-label={`Pronóstico de ${values[0]} unidades a 7 días, ${values[1]} a 15 días y ${values[2]} a 30 días`}>
          <defs>
            <linearGradient id='forecast-area-gradient' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#22c55e' stopOpacity='.28'/><stop offset='100%' stopColor='#22c55e' stopOpacity='.02'/></linearGradient>
          </defs>
          {[0, .25, .5, .75, 1].map((ratio) => {
            const y = 190 - ratio * 135
            const label = Math.round(axisMaximum * ratio)
            return <g key={ratio}><line className='forecast-grid-line' x1='62' y1={y} x2='530' y2={y}/><text className='forecast-axis-label' x='52' y={y + 4} textAnchor='end'>{label.toLocaleString('es-MX')}</text></g>
          })}
          <text className='forecast-axis-title' x='18' y='122' textAnchor='middle' transform='rotate(-90 18 122)'>Unidades</text>
          <polygon points={areaPoints} fill='url(#forecast-area-gradient)'/>
          <polyline className='forecast-line' points={points}/>
          {values.map((value, index) => <g key={index}><circle className='forecast-point-ring' cx={xPositions[index]} cy={yPosition(value)} r='7'/><circle className='forecast-point' cx={xPositions[index]} cy={yPosition(value)} r='4'/><text className='forecast-value' x={xPositions[index]} y={yPosition(value) - 13} textAnchor='middle'>{value.toLocaleString('es-MX')}</text><text className='forecast-x-label' x={xPositions[index]} y='216' textAnchor='middle'>{[7, 15, 30][index]} días</text></g>)}
        </svg>
      </div>
      <div className='forecast-legend'><span><i/>Pronóstico IA</span><span>Periodo proyectado: 7, 15 y 30 días</span></div>
    </section>
  )
}

function IntelligentAlerts({ orders }: { orders: SuggestedOrder[] }) {
  const alerts = [
    {
      label: 'Riesgo de quiebre de stock',
      unit: 'productos',
      icon: <AlertTriangle size={15}/>,
      className: 'alert-risk',
      items: orders.filter((order) => order.current_stock_units + order.on_order_in_transit_units < order.sugerido),
    },
    {
      label: 'Exceso de inventario',
      unit: 'productos',
      icon: <Archive size={15}/>,
      className: 'alert-excess',
      items: orders.filter((order) => order.current_stock_units > Math.max(order.sugerido * 2, order.prediccion * 2)),
    },
    {
      label: 'Baja rotación (> 30 días)',
      unit: 'productos',
      icon: <Clock3 size={15}/>,
      className: 'alert-rotation',
      items: orders.filter((order) => order.prediccion <= 0 || order.current_stock_units > order.prediccion * 30),
    },
    {
      label: 'Pedidos con uplift negativo',
      unit: 'pedidos',
      icon: <TrendingDown size={15}/>,
      className: 'alert-negative',
      items: orders.filter((order) => order.uplift_esperado < 0),
    },
  ]

  return (
    <aside className='card intelligent-alerts' aria-labelledby='intelligent-alerts-title'>
      <div className='alerts-heading'><div><h2 id='intelligent-alerts-title'>Alertas inteligentes</h2><p>Detecciones generadas por IA</p></div><span className='alerts-total'>{alerts.reduce((sum, alert) => sum + alert.items.length, 0)}</span></div>
      <div className='alerts-list'>
        {alerts.map((alert) => (
          <details className={`alert-item ${alert.className}`} key={alert.label}>
            <summary><span className='alert-type-icon'>{alert.icon}</span><span className='alert-label'>{alert.label}</span><strong>{alert.items.length} {alert.unit}</strong><span className='alert-view'>Ver</span></summary>
            <div className='alert-details'>
              {alert.items.length === 0
                ? <span>Sin elementos afectados.</span>
                : alert.items.slice(0, 5).map((order) => <span key={`${alert.label}-${order.location}-${order.item}`}><b>{order.item}</b> · {order.descripcion_item}</span>)}
              {alert.items.length > 5 && <span>+ {alert.items.length - 5} elementos adicionales</span>}
            </div>
          </details>
        ))}
      </div>
    </aside>
  )
}

export function DashboardPage() {
  const session = useAuthStore((state) => state.session)
  const loginAt = session?.loginAt
  const loginDate = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(loginAt ?? Date.now()))
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

  function exportStoreReport() {
    downloadSuggestedOrdersReport({
      orders: suggestedOrders?.items ?? [],
      location: selectedLocation,
      manager: session?.username || 'Usuario registrado',
      adjustedValues,
    })
  }

  const ordersErrorMessage = hasSuggestedOrdersError
    ? getSuggestedOrdersError(suggestedOrdersError)
    : undefined

  return <div className="app-shell">
    <Sidebar />
    <main className="main">
      <header className='topbar card'>
        <div><h1>Gestor de Pedidos</h1><p>Control de abastecimiento diario · Red de 21 locales</p></div>
        <div className='topbar-actions'>
          <div className='login-date-card'><CalendarDays size={19}/><div><span>Fecha de ingreso</span><strong>{loginDate}</strong></div></div>
          <div className='location-control'>
            <select
              aria-label='Tienda'
              value={selectedLocation}
              onChange={(event) => changeLocation(event.target.value)}
              disabled={isLoadingLocations || cannotLoadLocations || !locations?.length}
            >
              {isLoadingLocations && <option value=''>Cargando tiendas...</option>}
              {cannotLoadLocations && <option value=''>No fue posible cargar tiendas</option>}
              {!isLoadingLocations && !cannotLoadLocations && locations?.length === 0 && <option value=''>No hay tiendas disponibles</option>}
              {!isLoadingLocations && !cannotLoadLocations && locations && locations.length > 0 && <><option value='' disabled>Selecciona una tienda</option>{locations.map((item) => <option key={item.location} value={item.location}>{item.location} - {item.descripcion_tienda}</option>)}</>}
            </select>
            {cannotLoadLocations && <button className='location-retry' type='button' onClick={() => void refetchLocations()}>Reintentar</button>}
          </div>
        </div>
      </header>
      <section className="notice card"><ShieldCheck/><div><strong>Fórmula de abastecimiento equilibrada</strong><p>Optimiza almacenamiento, disponibilidad y capital de trabajo.</p></div></section>
      <section className="ai-bar"><Sparkles/><input placeholder="Ej: aumenta leche y reduce bebidas..."/><button>Aplicar comando AI</button></section>
      <section className="stats">
        <div className="card stat-card"><div className="stat-icon stat-icon-found"><PackageCheck size={21}/></div><div><span>Pedidos encontrados</span><strong>{suggestedOrders?.total_items ?? 0}</strong></div></div>
        <div className="card stat-card"><div className="stat-icon stat-icon-estimated"><Calculator size={21}/></div><div><span>Estimados en página</span><strong>{totals.estimated}</strong></div></div>
        <div className="card stat-card"><div className="stat-icon stat-icon-suggested"><Boxes size={21}/></div><div><span>Unidades sugeridas</span><strong>{totals.suggested.toLocaleString('es-MX')}</strong></div></div>
        <div className="card stat-card"><div className="stat-icon stat-icon-adjusted"><SlidersHorizontal size={21}/></div><div><span>Unidades ajustadas</span><strong>{totals.adjusted.toLocaleString('es-MX')}</strong></div></div>
      </section>
      <section className='forecast-alerts-row'>
        <DemandForecastChart weeklyUnits={totals.suggested}/>
        <IntelligentAlerts orders={suggestedOrders?.items ?? []}/>
      </section>
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
      <section className='store-report-download card'>
        <div><span className='report-download-icon'><Download size={21}/></span><div><strong>Reporte completo por tienda</strong><p>Descarga métricas, pronóstico, alertas y sugerido semanal en un archivo PDF.</p></div></div>
        <button type='button' onClick={exportStoreReport} disabled={!hasValidLocation}><Download size={17}/>Descargar PDF</button>
      </section>
      <footer>OBI Smart · Grupo12 · 2026</footer>
    </main>
  </div>
}
