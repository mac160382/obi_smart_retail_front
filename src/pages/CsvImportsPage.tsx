import { BarChart3, Boxes, Info, Tag, TrendingUp } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { CsvUploadCard } from '../features/imports/components/CsvUploadCard'
import { uploadCurrentPromotionsCsv } from '../features/imports/services/currentPromotionsImportService'
import { uploadForecastCsv } from '../features/imports/services/forecastImportService'
import { uploadHistoricalSalesCsv } from '../features/imports/services/historicalSalesImportService'
import { uploadInventoryMasterCsv } from '../features/imports/services/inventoryMasterImportService'
import { recalculateSuggestedOrders } from '../features/suggestedOrders/services/suggestedOrderCalculationService'

const importOptions = [
  {
    title: 'Ventas históricas',
    description: 'Histórico de ventas por tienda y producto.',
    endpoint: '/api/v1/imports/historical-sales/csv',
    icon: <BarChart3 size={23} />,
    supportsMode: true,
    onUpload: uploadHistoricalSalesCsv,
  },
  {
    title: 'Promociones actuales',
    description: 'Promociones activas y sus periodos de vigencia.',
    endpoint: '/api/v1/imports/current-promotions/csv',
    icon: <Tag size={23} />,
    onUpload: uploadCurrentPromotionsCsv,
  },
  {
    title: 'Maestro de inventario',
    description: 'Existencias y catálogo maestro de productos.',
    endpoint: '/api/v1/imports/inventory-master/csv',
    icon: <Boxes size={23} />,
    onUpload: uploadInventoryMasterCsv,
  },
  {
    title: 'Pronóstico',
    description: 'Proyecciones de demanda para abastecimiento.',
    endpoint: '/api/v1/imports/forecast/csv',
    icon: <TrendingUp size={23} />,
    onUpload: uploadForecastCsv,
    onRecalculate: recalculateSuggestedOrders,
  },
]

export function CsvImportsPage() {
  return (
    <div className='app-shell'>
      <Sidebar />
      <main className='main csv-imports-main'>
        <header className='csv-page-header card'>
          <div>
            <p className='eyebrow'>Administración de datos</p>
            <h1>Carga de archivos CSV</h1>
            <p>Selecciona los archivos que se utilizarán para actualizar la información operativa.</p>
          </div>
        </header>

        <section className='csv-info-banner'>
          <Info size={19} aria-hidden='true' />
          <div>
            <strong>Preparación de archivos</strong>
            <p>Las cargas de ventas históricas, promociones actuales, maestro de inventario y pronóstico están disponibles.</p>
          </div>
        </section>

        <section className='csv-upload-grid' aria-label='Tipos de importación disponibles'>
          {importOptions.map((option) => <CsvUploadCard key={option.endpoint} {...option} />)}
        </section>

        <footer>OBI Smart · Grupo 12 · 2026</footer>
      </main>
    </div>
  )
}
