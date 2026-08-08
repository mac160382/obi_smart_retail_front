import type { Product } from '../types/inventory'

export function ProductPanel({ product }: { product?: Product }) {
  if (!product) return <aside className="analysis card empty">Selecciona un producto para analizarlo.</aside>
  const investment = product.quantity * product.price
  const sales = product.quantity * product.projectedSale
  return (
    <aside className="analysis card">
      <p className="eyebrow">Justificación predictiva local</p>
      <h2>{product.name}</h2><small>{product.sku} · {product.format}</small>
      <div className="metric-pair"><div><span>Inversión</span><strong>${investment.toLocaleString('es-CO',{maximumFractionDigits:0})}</strong></div><div><span>Venta protegida</span><strong>${sales.toLocaleString('es-CO',{maximumFractionDigits:0})}</strong></div></div>
      <h3>Razonamiento OBI AI</h3>
      <ul>{product.reasons.map(r => <li key={r}>{r}</li>)}</ul>
      <h3>Histórico de 7 días</h3>
      <div className="bars">{product.salesHistory.map((v,i) => <span key={i} style={{height:`${Math.max(15, v/Math.max(...product.salesHistory)*100)}%`}} title={`${v}`}/>)}</div>
      <button className="primary">Validar pedido individual</button>
    </aside>
  )
}
