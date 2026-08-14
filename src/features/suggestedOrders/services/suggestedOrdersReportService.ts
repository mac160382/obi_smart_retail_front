import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SuggestedOrder } from '../types/suggestedOrder'

interface ReportOptions {
  orders: SuggestedOrder[]
  location: string
  manager: string
  adjustedValues: Record<string, string>
}

const BLUE: [number, number, number] = [0, 116, 200]
const NAVY: [number, number, number] = [15, 23, 42]
const SLATE: [number, number, number] = [100, 116, 139]

function adjustedValue(order: SuggestedOrder, values: Record<string, string>) {
  const key = `${order.location}:${order.item}`
  return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : order.ajustado ?? ''
}

function safeFilename(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function drawHeader(document: jsPDF, store: string, manager: string, date: string) {
  document.setFillColor(...BLUE)
  document.roundedRect(14, 10, 17, 17, 3, 3, 'F')
  document.setTextColor(255, 255, 255)
  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.text('M', 22.5, 21.5, { align: 'center' })
  document.setTextColor(...NAVY)
  document.setFontSize(17)
  document.text('MAREA', 36, 17)
  document.setTextColor(217, 154, 24)
  document.setFontSize(7)
  document.text('HIPERMERCADOS', 36, 22)
  document.setTextColor(...NAVY)
  document.setFontSize(15)
  document.text('Gestor de Pedidos', 283, 16, { align: 'right' })
  document.setFont('helvetica', 'normal')
  document.setTextColor(...SLATE)
  document.setFontSize(7.5)
  document.text(`Fecha: ${date}`, 283, 21, { align: 'right' })
  document.text(`Tienda: ${store}`, 283, 25, { align: 'right' })
  document.text(`Gestor: ${manager}`, 283, 29, { align: 'right' })
  document.setDrawColor(...BLUE)
  document.setLineWidth(.7)
  document.line(14, 34, 283, 34)
}

function drawFooter(document: jsPDF, page: number) {
  document.setTextColor(148, 163, 184)
  document.setFontSize(7)
  document.text('OBI Smart Retail - Reporte generado por IA', 14, 202)
  document.text(`Página ${page}`, 283, 202, { align: 'right' })
}

export function downloadSuggestedOrdersReport({ orders, location, manager, adjustedValues }: ReportOptions) {
  const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const now = new Date()
  const date = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(now)
  const store = `${location || '-'} - ${orders[0]?.descripcion_tienda ?? 'Sin tienda seleccionada'}`
  const suggested = orders.reduce((sum, order) => sum + order.sugerido, 0)
  const adjusted = orders.reduce((sum, order) => sum + Number(adjustedValue(order, adjustedValues) || 0), 0)
  const estimated = orders.filter((order) => order.status === 'Estimado').length
  const forecast = [7, 15, 30].map((days) => Math.round(suggested * days / 7))
  const alertCounts = [
    orders.filter((order) => order.current_stock_units + order.on_order_in_transit_units < order.sugerido).length,
    orders.filter((order) => order.current_stock_units > Math.max(order.sugerido * 2, order.prediccion * 2)).length,
    orders.filter((order) => order.prediccion <= 0 || order.current_stock_units > order.prediccion * 30).length,
    orders.filter((order) => order.uplift_esperado < 0).length,
  ]

  drawHeader(document, store, manager, date)
  document.setTextColor(...NAVY)
  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.text('Resumen de abastecimiento', 14, 44)
  document.setFont('helvetica', 'normal')
  document.setTextColor(...SLATE)
  document.setFontSize(8)
  document.text('Información consolidada para la tienda seleccionada y sus pedidos sugeridos.', 14, 49)

  const metrics = [
    ['PEDIDOS ENCONTRADOS', orders.length.toLocaleString('es-MX')],
    ['ESTIMADOS EN PÁGINA', estimated.toLocaleString('es-MX')],
    ['UNIDADES SUGERIDAS', suggested.toLocaleString('es-MX')],
    ['UNIDADES AJUSTADAS', adjusted.toLocaleString('es-MX')],
  ]
  const metricColors = [[239,246,255],[245,243,255],[255,251,235],[236,253,245]]
  metrics.forEach(([label, value], index) => {
    const x = 14 + index * 68
    document.setFillColor(...metricColors[index] as [number, number, number])
    document.setDrawColor(226, 232, 240)
    document.roundedRect(x, 55, 63, 21, 1.5, 1.5, 'FD')
    document.setTextColor(...SLATE)
    document.setFont('helvetica', 'bold')
    document.setFontSize(7)
    document.text(label, x + 4, 63)
    document.setTextColor(...NAVY)
    document.setFontSize(16)
    document.text(value, x + 59, 69, { align: 'right' })
  })

  document.setDrawColor(226, 232, 240)
  document.roundedRect(14, 82, 166, 102, 1.5, 1.5, 'S')
  document.setTextColor(...NAVY)
  document.setFontSize(12)
  document.text('Pronóstico de demanda (IA)', 18, 91)
  const chartX = [38, 92, 166]
  const chartBottom = 169
  const chartHeight = 55
  const maximum = Math.max(...forecast, 1)
  for (let index = 0; index <= 4; index += 1) {
    const y = chartBottom - index * chartHeight / 4
    document.setDrawColor(229, 234, 240)
    document.line(32, y, 172, y)
    document.setTextColor(...SLATE)
    document.setFontSize(6.5)
    document.text(Math.round(maximum * index / 4).toLocaleString('es-MX'), 29, y + 2, { align: 'right' })
  }
  document.setDrawColor(22, 163, 74)
  document.setLineWidth(1.2)
  const points = forecast.map((value, index) => ({ x: chartX[index], y: chartBottom - value / maximum * chartHeight }))
  points.slice(1).forEach((point, index) => document.line(points[index].x, points[index].y, point.x, point.y))
  points.forEach((point, index) => {
    document.setFillColor(22, 163, 74)
    document.circle(point.x, point.y, 1.8, 'F')
    document.setTextColor(22, 101, 52)
    document.setFontSize(7)
    document.text(forecast[index].toLocaleString('es-MX'), point.x, point.y - 4, { align: 'center' })
    document.setTextColor(...SLATE)
    document.text(`${[7, 15, 30][index]} días`, point.x, 177, { align: 'center' })
  })

  document.roundedRect(185, 82, 98, 102, 1.5, 1.5, 'S')
  document.setTextColor(...NAVY)
  document.setFontSize(12)
  document.text('Alertas generadas por IA', 190, 91)
  const alertLabels = ['Riesgo de quiebre de stock', 'Exceso de inventario', 'Baja rotación (> 30 días)', 'Pedidos con uplift negativo']
  alertLabels.forEach((label, index) => {
    const y = 105 + index * 17
    document.setFillColor(...([[254,242,242],[236,253,245],[236,254,255],[245,243,255]][index] as [number,number,number]))
    document.roundedRect(190, y - 7, 7, 7, 1.5, 1.5, 'F')
    document.setTextColor(...SLATE)
    document.setFontSize(7.5)
    document.text(label, 201, y - 2)
    document.setFont('helvetica', 'bold')
    document.text(`${alertCounts[index]} ${index === 3 ? 'pedidos' : 'productos'}`, 278, y - 2, { align: 'right' })
    document.setFont('helvetica', 'normal')
  })
  drawFooter(document, 1)

  document.addPage('a4', 'landscape')
  drawHeader(document, store, manager, date)
  document.setTextColor(...NAVY)
  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.text('Sugerido semanal inteligente', 14, 44)
  document.setFont('helvetica', 'normal')
  document.setTextColor(...SLATE)
  document.setFontSize(8)
  document.text('Detalle completo de los pedidos cargados para la tienda seleccionada.', 14, 49)

  autoTable(document, {
    startY: 55,
    head: [['Estado','Item','Producto','Proveedor','Predicción','Stock','Tránsito','Sugerido IA','Ajustado']],
    body: orders.map((order) => [order.status, order.item, order.descripcion_item, order.descripcion_proveedor, order.prediccion, order.current_stock_units, order.on_order_in_transit_units, order.sugerido, adjustedValue(order, adjustedValues)]),
    theme: 'striped',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2.2, textColor: [51,65,85] },
    headStyles: { fillColor: [7,104,159], textColor: [255,255,255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245,249,252] },
    columnStyles: { 0:{cellWidth:20}, 1:{cellWidth:19}, 2:{cellWidth:47}, 3:{cellWidth:39} },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: ({ pageNumber }) => {
      if (pageNumber > 1) drawHeader(document, store, manager, date)
      drawFooter(document, pageNumber + 1)
    },
  })

  document.save(`reporte-tienda-${safeFilename(location || 'sin-tienda')}-${now.toISOString().slice(0,10)}.pdf`)
}
