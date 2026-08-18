import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertTriangle, Archive, Boxes, BrainCircuit, CalendarDays, Calculator, Clock3, Download, PackageCheck, Save, Search, ShieldCheck, Sparkles, SlidersHorizontal, TrendingDown } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { getLocations } from '../features/catalogs/services/locationService'
import { SuggestedOrdersTable } from '../features/suggestedOrders/components/SuggestedOrdersTable'
import { updateSuggestedOrdersBatch } from '../features/suggestedOrders/services/suggestedOrderBatchUpdateService'
import { getSuggestedOrders } from '../features/suggestedOrders/services/suggestedOrdersService'
import { downloadSuggestedOrdersReport } from '../features/suggestedOrders/services/suggestedOrdersReportService'
import { suggestedOrderKey, type SuggestedOrder } from '../features/suggestedOrders/types/suggestedOrder'
import type { SuggestedOrderBatchUpdateResponse } from '../features/suggestedOrders/types/suggestedOrderBatchUpdate'
import { useAuthStore } from '../features/auth/store/authStore'

interface SuggestedOrderDraft {
  order: SuggestedOrder
  adjusted: string
  observations: string
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

function getBatchUpdateError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail
      if (Array.isArray(detail)) {
        const messages = detail.flatMap((item) => (
          typeof item === 'object' && item && 'msg' in item && typeof item.msg === 'string'
            ? [item.msg]
            : []
        ))
        if (messages.length) return messages.join(' ')
      }
      return 'Los cambios no cumplen con el formato requerido.'
    }
    if (error.response?.status === 403) return 'No tienes permisos para aprobar pedidos sugeridos.'
    if (!error.response) return 'No fue posible conectar con el servicio de actualización.'
    if (error.response.status >= 500) return 'El servicio no pudo guardar los cambios. Intenta nuevamente.'
  }
  return 'No fue posible guardar los cambios.'
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
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const loginAt = session?.loginAt
  const loginDate = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(loginAt ?? Date.now()))
  const [selectedLocation, setSelectedLocation] = useState('')
  const [forecastOrigin, setForecastOrigin] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [drafts, setDrafts] = useState<Record<string, SuggestedOrderDraft>>({})
  const [saveResult, setSaveResult] = useState<SuggestedOrderBatchUpdateResponse | null>(null)
  const batchUpdateMutation = useMutation({
    mutationFn: updateSuggestedOrdersBatch,
    onSuccess: (response) => {
      setDrafts({})
      setSaveResult(response)
      void queryClient.invalidateQueries({ queryKey: ['suggested-orders'] })
    },
  })
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
  const hasValidForecastOrigin = /^\d{4}-\d{2}-\d{2}$/.test(forecastOrigin)

  const {
    data: suggestedOrders,
    error: suggestedOrdersError,
    isPending: isPendingOrders,
    isFetching: isFetchingOrders,
    isError: hasSuggestedOrdersError,
    refetch: refetchSuggestedOrders,
  } = useQuery({
    queryKey: ['suggested-orders', location, forecastOrigin, page, pageSize],
    queryFn: () => getSuggestedOrders({
      location,
      page,
      pageSize,
      forecastOrigin,
    }),
    enabled: hasValidLocation && hasValidForecastOrigin,
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

  const draftList = useMemo(() => Object.values(drafts), [drafts])
  const adjustedValues = useMemo(() => Object.fromEntries(
    Object.entries(drafts).map(([key, draft]) => [key, draft.adjusted]),
  ), [drafts])
  const saveValidationMessage = useMemo(() => {
    if (draftList.length === 0) return undefined
    if (draftList.length > 500) return 'Solo se pueden guardar hasta 500 pedidos por operación.'

    const invalidAdjusted = draftList.some(({ adjusted }) => (
      adjusted.trim() === '' || !Number.isFinite(Number(adjusted))
    ))
    if (invalidAdjusted) return 'Captura una cantidad ajustada numérica en todas las filas modificadas.'

    const invalidObservations = draftList.some(({ observations }) => {
      const value = observations.trim()
      return value.length === 0 || value.length > 5000
    })
    if (invalidObservations) return 'Captura observaciones de entre 1 y 5000 caracteres en todas las filas modificadas.'

    const invalidIdentity = draftList.some(({ order }) => (
      order.item.length === 0 || order.item.length > 50 || !/^\d{4}-\d{2}-\d{2}$/.test(order.forecast_origin)
    ))
    if (invalidIdentity) return 'Uno de los pedidos no tiene item u origen de pronóstico válido.'

    return undefined
  }, [draftList])

  const totals = useMemo(() => {
    const orders = suggestedOrders?.items ?? []
    return {
      estimated: orders.filter((order) => order.status === 'Estimado').length,
      suggested: orders.reduce((sum, order) => sum + order.sugerido, 0),
      adjusted: orders.reduce((sum, order) => {
        const key = suggestedOrderKey(order)
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
    setDrafts({})
    setSaveResult(null)
    batchUpdateMutation.reset()
  }

  function changeForecastOrigin(nextForecastOrigin: string) {
    setForecastOrigin(nextForecastOrigin)
    setPage(1)
    setSearch('')
    setDrafts({})
    setSaveResult(null)
    batchUpdateMutation.reset()
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  function updateDraft(
    order: SuggestedOrder,
    changes: Partial<Pick<SuggestedOrderDraft, 'adjusted' | 'observations'>>,
  ) {
    setSaveResult(null)
    batchUpdateMutation.reset()
    setDrafts((current) => {
      const key = suggestedOrderKey(order)
      const existing = current[key]
      const original = existing?.order ?? order
      const next: SuggestedOrderDraft = {
        order: original,
        adjusted: existing?.adjusted ?? String(original.ajustado ?? ''),
        observations: existing?.observations ?? original.observaciones ?? '',
        ...changes,
      }
      const isOriginal = (
        next.adjusted === String(original.ajustado ?? '') &&
        next.observations === (original.observaciones ?? '')
      )

      if (isOriginal) {
        const remaining = { ...current }
        delete remaining[key]
        return remaining
      }

      return { ...current, [key]: next }
    })
  }

  function changeAdjustedValue(order: SuggestedOrder, value: string) {
    updateDraft(order, { adjusted: value })
  }

  function changeObservations(order: SuggestedOrder, value: string) {
    updateDraft(order, { observations: value })
  }

  function getAdjustedValue(order: SuggestedOrder) {
    return drafts[suggestedOrderKey(order)]?.adjusted ?? order.ajustado ?? ''
  }

  function getObservationsValue(order: SuggestedOrder) {
    return drafts[suggestedOrderKey(order)]?.observations ?? order.observaciones ?? ''
  }

  function saveChanges() {
    if (draftList.length === 0 || saveValidationMessage || batchUpdateMutation.isPending) return

    batchUpdateMutation.mutate({
      items: draftList.map(({ order, adjusted, observations }) => ({
        item: order.item,
        location: order.location,
        forecast_origin: order.forecast_origin,
        ajustado: Number(adjusted),
        observaciones: observations.trim(),
      })),
    })
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
  const batchErrorMessage = batchUpdateMutation.isError
    ? getBatchUpdateError(batchUpdateMutation.error)
    : undefined

  return <div className="app-shell">
    <Sidebar />
    <main className="main">
      <header className='topbar card'>
        <div><h1>Gestor de Pedidos</h1><p>Control de abastecimiento diario · Red de 21 locales</p></div>
        <div className='topbar-actions'>
          <div className='login-date-card'><CalendarDays size={19}/><div><span>Fecha de ingreso</span><strong>{loginDate}</strong></div></div>
          <div className='location-control'>
            <label className='forecast-origin-control'>
              <span>Origen del pronóstico <b aria-hidden='true'>*</b></span>
              <input
                type='date'
                value={forecastOrigin}
                onChange={(event) => changeForecastOrigin(event.target.value)}
                disabled={batchUpdateMutation.isPending}
                aria-label='Fecha de origen del pronóstico'
                aria-required='true'
                required
              />
            </label>
            <select
              aria-label='Tienda'
              value={selectedLocation}
              onChange={(event) => changeLocation(event.target.value)}
              disabled={isLoadingLocations || cannotLoadLocations || !locations?.length || batchUpdateMutation.isPending}
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
        <div className="card catalog"><div className="catalog-head"><div><p className="eyebrow">Revisión de pedido</p><h2>Sugerido inteligente</h2>{forecastOrigin && <span className='active-forecast-filter'>Origen pronóstico: {forecastOrigin}</span>}</div><div className='suggested-orders-actions'><button className="ghost" onClick={exportCsv} disabled={filteredOrders.length === 0 || batchUpdateMutation.isPending}><Download size={16}/>Exportar CSV</button><button className='save-orders-button' type='button' onClick={saveChanges} disabled={draftList.length === 0 || Boolean(saveValidationMessage) || batchUpdateMutation.isPending} title={saveValidationMessage}><Save size={16}/>{batchUpdateMutation.isPending ? 'Guardando cambios...' : `Guardar cambios${draftList.length ? ` (${draftList.length})` : ''}`}</button></div></div>
          <div className='suggested-orders-save-feedback' aria-live='polite'>
            {saveValidationMessage && draftList.length > 0 && <p className='save-feedback-warning'>{saveValidationMessage}</p>}
            {batchErrorMessage && <p className='save-feedback-error' role='alert'>{batchErrorMessage}</p>}
            {saveResult && <p className='save-feedback-success'>Cambios guardados: {saveResult.updated_items} de {saveResult.requested_items} pedidos actualizados · {new Date(saveResult.approved_at).toLocaleString('es-MX')}.</p>}
          </div>
          <div className="filters suggested-orders-filters">
            <label><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar item, producto, tienda o proveedor"/></label>
            <label className='page-size-control'>Filas por página
              <select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))} disabled={batchUpdateMutation.isPending}>
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
            isLoading={hasValidLocation && hasValidForecastOrigin && (isPendingOrders || isFetchingOrders)}
            errorMessage={ordersErrorMessage}
            hasLocation={hasValidLocation}
            hasForecastOrigin={hasValidForecastOrigin}
            getAdjustedValue={getAdjustedValue}
            getObservationsValue={getObservationsValue}
            isOrderModified={(order) => Boolean(drafts[suggestedOrderKey(order)])}
            onAdjustedChange={changeAdjustedValue}
            onObservationsChange={changeObservations}
            onPageChange={setPage}
            onRetry={() => void refetchSuggestedOrders()}
            isSaving={batchUpdateMutation.isPending}
          />
        </div>
      </section>
      <section className='store-report-download card'>
        <div><span className='report-download-icon'><Download size={21}/></span><div><strong>Reporte completo por tienda</strong><p>Descarga métricas, pronóstico, alertas y sugerido semanal en un archivo PDF.</p></div></div>
        <button type='button' onClick={exportStoreReport} disabled={!hasValidLocation || !hasValidForecastOrigin}><Download size={17}/>Descargar PDF</button>
      </section>
      <footer>OBI Smart · Grupo12 · 2026</footer>
    </main>
  </div>
}
