import { Copy } from 'lucide-react'
import type { SuggestedOrder } from '../types/suggestedOrder'

interface SuggestedOrdersTableProps {
  orders: SuggestedOrder[]
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  isLoading: boolean
  errorMessage?: string
  hasLocation: boolean
  hasForecastOrigin: boolean
  getAdjustedValue: (order: SuggestedOrder) => string | number
  getObservationsValue: (order: SuggestedOrder) => string
  isOrderModified: (order: SuggestedOrder) => boolean
  onAdjustedChange: (order: SuggestedOrder, value: string) => void
  onObservationsChange: (order: SuggestedOrder, value: string) => void
  onPageChange: (page: number) => void
  onRetry: () => void
  isSaving: boolean
}

const numberFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 2,
})

function statusClass(status: SuggestedOrder['status']) {
  return status.toLowerCase()
}

function formatMetric(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : numberFormatter.format(value)
}

export function SuggestedOrdersTable({
  orders,
  page,
  pageSize,
  totalPages,
  totalItems,
  isLoading,
  errorMessage,
  hasLocation,
  hasForecastOrigin,
  getAdjustedValue,
  getObservationsValue,
  isOrderModified,
  onAdjustedChange,
  onObservationsChange,
  onPageChange,
  onRetry,
  isSaving,
}: SuggestedOrdersTableProps) {
  if (!hasLocation) {
    return <div className='orders-feedback'>Selecciona una tienda para consultar sus pedidos sugeridos.</div>
  }

  if (!hasForecastOrigin) {
    return <div className='orders-feedback'>Selecciona la fecha de origen del pronóstico para consultar los pedidos sugeridos.</div>
  }

  if (isLoading) {
    return <div className='orders-feedback'>Cargando pedidos sugeridos...</div>
  }

  if (errorMessage) {
    return (
      <div className='orders-feedback orders-feedback-error' role='alert'>
        <span>{errorMessage}</span>
        <button type='button' onClick={onRetry}>Reintentar</button>
      </div>
    )
  }

  if (orders.length === 0) {
    return <div className='orders-feedback'>No hay pedidos sugeridos para los filtros seleccionados.</div>
  }

  const firstItem = (page - 1) * pageSize + 1
  const lastItem = Math.min(firstItem + orders.length - 1, totalItems)

  return (
    <>
      <div className='table-wrap suggested-orders-table-wrap'>
        <table className='suggested-orders-table'>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Item</th>
              <th>Origen pronóstico</th>
              <th>Ubicación</th>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Proveedor</th>
              <th>Predicción</th>
              <th>Lead time</th>
              <th>Revisión</th>
              <th>Uplift</th>
              <th>Manejo mín.</th>
              <th>Stock actual</th>
              <th>En tránsito</th>
              <th>Máx. qty vendida</th>
              <th>Safety stock</th>
              <th>Reorder point</th>
              <th>Sugerido IA</th>
              <th>Ajustado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={`${order.location}-${order.item}-${order.forecast_origin}`}
                className={isOrderModified(order) ? 'order-row-modified' : undefined}
              >
                <td><span className={`order-status ${statusClass(order.status)}`}>{order.status}</span></td>
                <td><strong>{order.item}</strong></td>
                <td>{order.forecast_origin}</td>
                <td>{order.location}</td>
                <td>{order.descripcion_tienda}</td>
                <td>{order.descripcion_item}</td>
                <td>{order.descripcion_proveedor}</td>
                <td>{numberFormatter.format(order.prediccion)}</td>
                <td>{order.lead_time_days} días</td>
                <td>{order.review_period_days} días</td>
                <td>{numberFormatter.format(order.uplift_esperado)}</td>
                <td>{order.minimum_handling_quantity_units}</td>
                <td>{order.current_stock_units}</td>
                <td>{order.on_order_in_transit_units}</td>
                <td>{formatMetric(order.max_qty_vendida)}</td>
                <td>{formatMetric(order.safety_stock)}</td>
                <td>{formatMetric(order.reorder_point)}</td>
                <td>
                  <div className='order-suggested-control'>
                    <input
                      className='qty order-quantity'
                      type='number'
                      value={Math.max(0, order.sugerido)}
                      aria-label={`Sugerido IA para ${order.descripcion_item}`}
                      readOnly
                    />
                    <button
                      type='button'
                      className='copy-suggested-button'
                      aria-label={`Copiar Sugerido IA a Ajustado para ${order.descripcion_item}`}
                      title={order.status !== 'Estimado'
                        ? 'La copia solo está disponible para pedidos estimados'
                        : order.sugerido > 0
                          ? 'Copiar a Ajustado'
                          : 'Solo se puede copiar un valor mayor que cero'}
                      onClick={() => {
                        if (order.status === 'Estimado' && order.sugerido > 0) {
                          onAdjustedChange(order, String(order.sugerido))
                        }
                      }}
                      disabled={order.status !== 'Estimado' || order.sugerido <= 0 || isSaving}
                    >
                      <Copy size={15}/>
                    </button>
                  </div>
                </td>
                <td>
                  <input
                    className='qty order-quantity'
                    type='number'
                    min='0'
                    step='any'
                    value={getAdjustedValue(order)}
                    placeholder='—'
                    aria-label={`Cantidad ajustada para ${order.descripcion_item}`}
                    onChange={(event) => onAdjustedChange(order, event.target.value)}
                    disabled={order.status === 'Aprobado' || isSaving}
                  />
                </td>
                <td>
                  <input
                    className='order-observations'
                    type='text'
                    maxLength={5000}
                    value={getObservationsValue(order)}
                    placeholder='Observación opcional'
                    aria-label={`Observaciones para ${order.descripcion_item}`}
                    onChange={(event) => onObservationsChange(order, event.target.value)}
                    disabled={order.status === 'Aprobado' || isSaving}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className='orders-pagination' aria-label='Paginación de pedidos sugeridos'>
        <span>Mostrando {firstItem}-{lastItem} de {totalItems}</span>
        <div>
          <button type='button' onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isSaving}>Anterior</button>
          <strong>Página {page} de {Math.max(totalPages, 1)}</strong>
          <button type='button' onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isSaving}>Siguiente</button>
        </div>
      </nav>
    </>
  )
}
