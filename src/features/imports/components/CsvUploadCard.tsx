import { useId, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Calculator, CheckCircle2, FileText, UploadCloud, X } from 'lucide-react'
import type { CsvImportRequest, CsvImportSummary } from '../types/csvImport'
import type { HistoricalSalesImportMode } from '../types/historicalSalesImport'
import type { SuggestedOrderCalculationResponse } from '../../suggestedOrders/types/suggestedOrderCalculation'

interface CsvUploadCardProps {
  title: string
  description: string
  endpoint: string
  icon: ReactNode
  supportsMode?: boolean
  onUpload?: (request: CsvImportRequest) => Promise<CsvImportSummary>
  onRecalculate?: () => Promise<SuggestedOrderCalculationResponse>
}

interface ValidationErrorResponse {
  detail?: Array<{ msg?: string }> | string
}

function getUploadError(error: unknown) {
  if (axios.isAxiosError<ValidationErrorResponse>(error)) {
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail
      if (Array.isArray(detail)) {
        const messages = detail.flatMap((item) => item.msg ? [item.msg] : [])
        if (messages.length) return messages.join(' ')
      }
      if (typeof detail === 'string') return detail
      return 'El archivo no cumple con el formato requerido.'
    }
    if (!error.response) return 'No fue posible conectar con el servicio de importación.'
    if (error.response.status >= 500) return 'El servicio no pudo procesar el archivo. Intenta nuevamente.'
  }
  return 'No fue posible cargar el archivo.'
}

function getRecalculationError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'No tienes permisos para calcular pedidos sugeridos.'
    if (error.response?.status === 409) return 'Ya existe un cálculo de pedidos en proceso.'
    if (!error.response) return 'No fue posible conectar con el servicio de cálculo.'
    if (error.response.status >= 500) return 'El servicio no pudo calcular los pedidos. Intenta nuevamente.'
  }
  return 'No fue posible calcular el pedido sugerido.'
}

export function CsvUploadCard({ title, description, endpoint, icon, supportsMode = false, onUpload, onRecalculate }: CsvUploadCardProps) {
  const queryClient = useQueryClient()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<HistoricalSalesImportMode>('incremental')
  const uploadMutation = useMutation({
    mutationFn: (request: CsvImportRequest) => {
      if (!onUpload) throw new Error('La integración no está disponible.')
      return onUpload(request)
    },
    onSuccess: () => {
      setFile(null)
      setMode('incremental')
      if (inputRef.current) inputRef.current.value = ''
    },
  })
  const recalculationMutation = useMutation({
    mutationFn: () => {
      if (!onRecalculate) throw new Error('La integración no está disponible.')
      return onRecalculate()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suggested-orders'] })
    },
  })
  const isBusy = uploadMutation.isPending || recalculationMutation.isPending

  function selectFile(nextFile?: File) {
    if (!nextFile) return
    uploadMutation.reset()

    const isCsv = nextFile.type === 'text/csv' || nextFile.name.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      setFile(null)
      setError('Selecciona un archivo con extensión .csv.')
      return
    }

    setFile(nextFile)
    setError(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isBusy) return
    selectFile(event.dataTransfer.files[0])
  }

  function clearFile() {
    setFile(null)
    setError(null)
    uploadMutation.reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleUpload() {
    if (!file || !onUpload || isBusy) return

    if (supportsMode && mode === 'replace') {
      const confirmed = window.confirm(
        'El modo replace reemplazará completamente las ventas históricas. ¿Deseas continuar?',
      )
      if (!confirmed) return
    }

    uploadMutation.mutate(supportsMode ? { file, mode } : { file })
  }

  function handleRecalculate() {
    if (!onRecalculate || isBusy) return
    recalculationMutation.mutate()
  }

  return (
    <article className='csv-upload-card'>
      <header className='csv-card-heading'>
        <span className='csv-card-icon'>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <code className='csv-endpoint'>{endpoint}</code>

      {onUpload && supportsMode && (
        <div className='csv-mode-control'>
          <label htmlFor={`${inputId}-mode`}>Modo de carga</label>
          <select
            id={`${inputId}-mode`}
            value={mode}
            onChange={(event) => setMode(event.target.value as HistoricalSalesImportMode)}
            disabled={isBusy}
          >
            <option value='incremental'>Incremental</option>
            <option value='replace'>Replace</option>
          </select>
          {mode === 'replace' && <p>Este modo reemplazará completamente la información histórica.</p>}
        </div>
      )}

      <div
        className={`csv-dropzone${isDragging ? ' dragging' : ''}${isBusy ? ' disabled' : ''}`}
        onDragEnter={() => !isBusy && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloud size={30} aria-hidden='true' />
        <strong>Arrastra el archivo aquí</strong>
        <span>o selecciona desde tu equipo</span>
        <input ref={inputRef} id={inputId} type='file' accept='.csv,text/csv' onChange={handleFileChange} disabled={isBusy} />
        <label htmlFor={inputId}>Seleccionar CSV</label>
      </div>

      {error && <p className='csv-file-error' role='alert'>{error}</p>}
      {uploadMutation.isError && <p className='csv-file-error' role='alert'>{getUploadError(uploadMutation.error)}</p>}
      {recalculationMutation.isError && <p className='csv-file-error' role='alert'>{getRecalculationError(recalculationMutation.error)}</p>}
      {file && (
        <div className='csv-selected-file'>
          <FileText size={17} aria-hidden='true' />
          <div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></div>
          <CheckCircle2 className='csv-file-valid' size={17} aria-label='Archivo válido' />
          <button type='button' onClick={clearFile} aria-label={`Quitar ${file.name}`} disabled={isBusy}><X size={16} /></button>
        </div>
      )}

      {uploadMutation.data && (
        <div className='csv-upload-result' role='status'>
          <div><CheckCircle2 size={18} /><strong>Carga completada</strong></div>
          <p>
            {uploadMutation.data.filename}
            {uploadMutation.data.mode && ` · modo ${uploadMutation.data.mode}`}
            {uploadMutation.data.operation && ` · ${uploadMutation.data.operation}`}
          </p>
          <dl>
            <div><dt>Total</dt><dd>{uploadMutation.data.totalRows}</dd></div>
            <div><dt>Insertadas</dt><dd>{uploadMutation.data.insertedRows}</dd></div>
            <div><dt>Rechazadas</dt><dd>{uploadMutation.data.rejectedRows}</dd></div>
          </dl>
          {uploadMutation.data.featureEngineeringStatus && (
            <small>Feature engineering: {uploadMutation.data.featureEngineeringStatus}</small>
          )}
          {uploadMutation.data.validationErrors.length > 0 && (
            <small className='csv-result-warning'>{uploadMutation.data.validationErrors.length} errores de validación reportados.</small>
          )}
        </div>
      )}

      {recalculationMutation.data && (
        <div className='csv-upload-result csv-recalculation-result' role='status' aria-live='polite'>
          <div><CheckCircle2 size={18} /><strong>Pedido sugerido calculado</strong></div>
          <p>{recalculationMutation.data.destination} · {recalculationMutation.data.operation}</p>
          <dl>
            <div><dt>Eliminadas</dt><dd>{recalculationMutation.data.deleted_rows}</dd></div>
            <div><dt>Insertadas</dt><dd>{recalculationMutation.data.inserted_rows}</dd></div>
            <div><dt>Duración</dt><dd>{recalculationMutation.data.duration_ms.toLocaleString('es-MX')} ms</dd></div>
          </dl>
          <small>Calculado: {new Date(recalculationMutation.data.calculated_at).toLocaleString('es-MX')}</small>
        </div>
      )}

      <footer className='csv-card-actions'>
        {onUpload ? (
          <>
            <span className='csv-integration-ready'>Servicio disponible</span>
            <div className='csv-card-action-buttons'>
              <button type='button' onClick={handleUpload} disabled={!file || isBusy}>
                {uploadMutation.isPending ? 'Cargando archivo...' : 'Cargar archivo'}
              </button>
              {onRecalculate && (
                <button className='csv-recalculate-button' type='button' onClick={handleRecalculate} disabled={isBusy}>
                  <Calculator size={15} aria-hidden='true' />
                  {recalculationMutation.isPending ? 'Calculando pedido...' : 'Calcular pedido sugerido'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <span>Integración pendiente</span>
            <button type='button' disabled title='Disponible cuando se integre el endpoint'>Cargar archivo</button>
          </>
        )}
      </footer>
    </article>
  )
}
